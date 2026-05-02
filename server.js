import "dotenv/config";

import compression from "compression";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeProtectedHeader, importX509, jwtVerify } from "jose";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_NAME = "votesahayak";
const DEFAULT_PORT = 8080;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX = 120;
const DEFAULT_CHAT_RATE_LIMIT_MAX = 12;
const DEFAULT_CACHE_TTL_MS = 5 * 60_000;
const DEFAULT_CACHE_MAX_ENTRIES = 250;
const DEFAULT_AI_TIMEOUT_MS = 20_000;
const MAX_CHAT_INPUT_LENGTH = 500;
const MAX_HISTORY_MESSAGES = 8;
const MAX_ASSISTANT_REPLY_LENGTH = 2_000;
const FIREBASE_CERT_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

const chatRequestSchema = z
  .object({
    message: z.string().min(1).max(MAX_CHAT_INPUT_LENGTH),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().min(1).max(MAX_ASSISTANT_REPLY_LENGTH),
        })
      )
      .max(MAX_HISTORY_MESSAGES)
      .optional()
      .default([]),
  })
  .strict();

const voteRequestSchema = z
  .object({
    candidateId: z.string().min(1).max(80),
  })
  .strict();

const SYSTEM_PROMPT = [
  "You are VoteSahayak, a civic assistant for Indian elections.",
  "Answer only questions about voter registration, EVM/VVPAT, polling stations, election dates, candidate information, accessibility facilities, complaints, and official voter support.",
  "If a question is outside Indian elections or asks for persuasion, misinformation, impersonation, or illegal activity, politely refuse and redirect to official voter information.",
  "Keep answers under 150 words, use plain language, and encourage users to verify critical details with the Election Commission of India or the 1950 helpline.",
].join(" ");

class HttpError extends Error {
  constructor(statusCode, message, code = "request_failed") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class TtlCache {
  constructor(maxEntries = DEFAULT_CACHE_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = DEFAULT_CACHE_TTL_MS) {
    if (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey) this.entries.delete(oldestKey);
    }
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }
}

class VoteStore {
  constructor(maxEntries = 20_000) {
    this.maxEntries = maxEntries;
    this.votes = new Map();
  }

  get(userId) {
    return this.votes.get(userId) ?? null;
  }

  has(userId) {
    return this.votes.has(userId);
  }

  set(userId, voteRecord) {
    if (this.votes.size >= this.maxEntries) {
      const oldestKey = this.votes.keys().next().value;
      if (oldestKey) this.votes.delete(oldestKey);
    }
    this.votes.set(userId, voteRecord);
  }
}

class FirebaseTokenVerifier {
  constructor(projectId) {
    this.projectId = projectId;
    this.certs = new Map();
    this.expiresAt = 0;
  }

  async getCertificates() {
    if (this.certs.size > 0 && Date.now() < this.expiresAt) {
      return this.certs;
    }

    const response = await fetch(FIREBASE_CERT_URL);
    if (!response.ok) {
      throw new Error("Could not fetch Firebase public certificates");
    }

    const certs = await response.json();
    this.certs = new Map(Object.entries(certs));
    this.expiresAt = Date.now() + getCacheMaxAgeMs(response.headers.get("cache-control"));
    return this.certs;
  }

  async verifyIdToken(token) {
    const header = decodeProtectedHeader(token);
    if (header.alg !== "RS256" || !header.kid) {
      throw new Error("Invalid Firebase token header");
    }

    const certs = await this.getCertificates();
    const certificate = certs.get(header.kid);
    if (!certificate) {
      throw new Error("Unknown Firebase token key id");
    }

    const key = await importX509(certificate, "RS256");
    const { payload } = await jwtVerify(token, key, {
      audience: this.projectId,
      issuer: `https://securetoken.google.com/${this.projectId}`,
    });

    if (!payload.sub || typeof payload.sub !== "string") {
      throw new Error("Firebase token missing subject");
    }

    return payload;
  }
}

function getCacheMaxAgeMs(cacheControlHeader) {
  const match = /max-age=(\d+)/i.exec(cacheControlHeader || "");
  const seconds = match ? Number.parseInt(match[1], 10) : 3600;
  return Math.max(seconds, 300) * 1000;
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function createConfig(overrides = {}) {
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: toPositiveInt(process.env.PORT, DEFAULT_PORT),
    distPath: path.resolve(__dirname, "dist"),
    groqApiKey: process.env.GROQ_API_KEY || "",
    groqApiUrl:
      process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions",
    groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    rateLimitWindowMs: toPositiveInt(
      process.env.RATE_LIMIT_WINDOW_MS,
      DEFAULT_RATE_LIMIT_WINDOW_MS
    ),
    rateLimitMax: toPositiveInt(process.env.RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
    chatRateLimitMax: toPositiveInt(
      process.env.CHAT_RATE_LIMIT_MAX,
      DEFAULT_CHAT_RATE_LIMIT_MAX
    ),
    cacheTtlMs: toPositiveInt(process.env.CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS),
    cacheMaxEntries: toPositiveInt(
      process.env.CACHE_MAX_ENTRIES,
      DEFAULT_CACHE_MAX_ENTRIES
    ),
    aiTimeoutMs: toPositiveInt(process.env.AI_TIMEOUT_MS, DEFAULT_AI_TIMEOUT_MS),
    trustProxyHops: toPositiveInt(process.env.TRUST_PROXY_HOPS, 1),
    googleCloudProject:
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      "",
    firebaseProjectId:
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      "",
    firebaseWebApiKey:
      process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY || "",
    firebaseAuthDomain:
      process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    firebaseWebAppId:
      process.env.FIREBASE_WEB_APP_ID || process.env.VITE_FIREBASE_APP_ID || "",
    firebaseStorageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.VITE_FIREBASE_STORAGE_BUCKET ||
      "",
    firebaseMessagingSenderId:
      process.env.FIREBASE_MESSAGING_SENDER_ID ||
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
      "",
    firebaseMeasurementId:
      process.env.FIREBASE_MEASUREMENT_ID ||
      process.env.VITE_FIREBASE_MEASUREMENT_ID ||
      "",
    enableFirebaseAuth: toBoolean(process.env.ENABLE_FIREBASE_AUTH, false),
    requireAuth: toBoolean(process.env.REQUIRE_AUTH, false),
    ...overrides,
  };
}

function getPublicFirebaseConfig(config) {
  if (
    !config.firebaseWebApiKey ||
    !config.firebaseAuthDomain ||
    !config.firebaseProjectId ||
    !config.firebaseWebAppId
  ) {
    return null;
  }

  const publicConfig = {
    apiKey: config.firebaseWebApiKey,
    authDomain: config.firebaseAuthDomain,
    projectId: config.firebaseProjectId,
    appId: config.firebaseWebAppId,
  };

  if (config.firebaseStorageBucket) {
    publicConfig.storageBucket = config.firebaseStorageBucket;
  }
  if (config.firebaseMessagingSenderId) {
    publicConfig.messagingSenderId = config.firebaseMessagingSenderId;
  }
  if (config.firebaseMeasurementId) {
    publicConfig.measurementId = config.firebaseMeasurementId;
  }

  return publicConfig;
}

function cloudTraceName(req, config) {
  const traceHeader = req.get("x-cloud-trace-context");
  if (!traceHeader || !config.googleCloudProject) return undefined;
  const traceId = traceHeader.split("/")[0];
  return `projects/${config.googleCloudProject}/traces/${traceId}`;
}

function log(severity, message, metadata = {}) {
  const payload = {
    severity,
    message,
    service: SERVICE_NAME,
    time: new Date().toISOString(),
    ...metadata,
  };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function sanitizeText(value, maxLength = MAX_CHAT_INPUT_LENGTH) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeHistory(history = []) {
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: sanitizeText(message.content, MAX_ASSISTANT_REPLY_LENGTH),
    }))
    .filter((message) => message.content.length > 0);
}

function buildCacheKey(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function safeErrorResponse(error) {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    };
  }

  return {
    statusCode: 500,
    body: {
      error: "Something went wrong. Please try again.",
      code: "internal_error",
    },
  };
}

function createFirebaseVerifier(config) {
  if (!config.enableFirebaseAuth && !config.requireAuth) return null;

  if (!config.firebaseProjectId) {
    log("ERROR", "Firebase Auth enabled without FIREBASE_PROJECT_ID", {
      authRequired: config.requireAuth,
    });
    if (config.requireAuth) {
      throw new Error("Firebase Auth requires FIREBASE_PROJECT_ID");
    }
    return null;
  }

  log("INFO", "Firebase token verifier initialized", {
    authRequired: config.requireAuth,
    projectId: config.firebaseProjectId,
  });
  return new FirebaseTokenVerifier(config.firebaseProjectId);
}

function authMiddleware(firebaseVerifier, config, options = {}) {
  const forceAuth = options.forceAuth ?? false;
  return async (req, res, next) => {
    if (!config.requireAuth && !forceAuth) return next();

    const header = req.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

    if (!token || !firebaseVerifier) {
      return res.status(401).json({
        error: "Authentication required.",
        code: "auth_required",
      });
    }

    try {
      req.user = await firebaseVerifier.verifyIdToken(token);
      return next();
    } catch (error) {
      log("WARNING", "Firebase token verification failed", {
        requestId: req.id,
        errorName: error?.name,
        trace: cloudTraceName(req, config),
      });
      return res.status(401).json({
        error: "Invalid or expired authentication token.",
        code: "auth_invalid",
      });
    }
  };
}

function getAuthenticatedUserId(req) {
  const userId = req.user?.sub;
  if (!userId || typeof userId !== "string") {
    throw new HttpError(401, "Authentication required.", "auth_required");
  }
  return userId;
}

function createVoteHandlers({ voteStore }) {
  const getVoteStatus = (req, res, next) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const record = voteStore.get(userId);
      res.json({
        hasVoted: Boolean(record),
        record,
      });
    } catch (error) {
      next(error);
    }
  };

  const submitVote = (req, res, next) => {
    try {
      const parsed = voteRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, "Invalid vote payload.", "validation_error");
      }

      const userId = getAuthenticatedUserId(req);
      if (voteStore.has(userId)) {
        throw new HttpError(
          409,
          "You have already cast your vote. Multiple votes are not allowed.",
          "already_voted"
        );
      }

      const record = {
        candidateId: sanitizeText(parsed.data.candidateId, 80),
        votedAt: new Date().toISOString(),
      };

      voteStore.set(userId, record);
      res.status(201).json({
        success: true,
        record,
      });
    } catch (error) {
      next(error);
    }
  };

  return { getVoteStatus, submitVote };
}

function createLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message,
  });
}

async function callGroqApi({ message, history, config, signal }) {
  if (!config.groqApiKey) {
    throw new HttpError(
      503,
      "AI assistant is not configured. Set GROQ_API_KEY on Cloud Run.",
      "ai_not_configured"
    );
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message },
  ];

  const upstreamResponse = await fetch(config.groqApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({
      model: config.groqModel,
      messages,
      temperature: 0.2,
      max_tokens: 500,
    }),
    signal,
  });

  if (!upstreamResponse.ok) {
    throw new HttpError(
      upstreamResponse.status >= 500 ? 502 : upstreamResponse.status,
      "The AI assistant could not answer right now. Please try again.",
      "ai_upstream_error"
    );
  }

  const data = await upstreamResponse.json();
  const reply = sanitizeText(
    data?.choices?.[0]?.message?.content || "",
    MAX_ASSISTANT_REPLY_LENGTH
  );

  if (!reply) {
    throw new HttpError(502, "The AI assistant returned an empty response.", "ai_empty");
  }

  return reply;
}

function createChatHandler({ cache, config }) {
  return async (req, res, next) => {
    try {
      const parsed = chatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, "Invalid chat request.", "validation_error");
      }

      const message = sanitizeText(parsed.data.message, MAX_CHAT_INPUT_LENGTH);
      const history = normalizeHistory(parsed.data.history);

      if (!message) {
        throw new HttpError(400, "Message cannot be empty.", "empty_message");
      }

      const payloadForCache = {
        model: config.groqModel,
        message,
        history,
      };
      const cacheKey = buildCacheKey(payloadForCache);
      const cachedReply = cache.get(cacheKey);

      if (cachedReply) {
        log("INFO", "Chat response served from cache", {
          requestId: req.id,
          messageLength: message.length,
          trace: cloudTraceName(req, config),
        });
        return res.json({ reply: cachedReply, cached: true });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.aiTimeoutMs);

      try {
        const reply = await callGroqApi({
          message,
          history,
          config,
          signal: controller.signal,
        });
        cache.set(cacheKey, reply, config.cacheTtlMs);

        log("INFO", "Chat response generated", {
          requestId: req.id,
          messageLength: message.length,
          historyLength: history.length,
          trace: cloudTraceName(req, config),
        });

        return res.json({ reply, cached: false });
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return next(
          new HttpError(
            504,
            "The AI assistant timed out. Please try a shorter question.",
            "ai_timeout"
          )
        );
      }
      return next(error);
    }
  };
}

function configureSecurity(app) {
  app.disable("x-powered-by");
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "https:"],
          "font-src": ["'self'", "data:", "https:"],
          "connect-src": [
            "'self'",
            "https://identitytoolkit.googleapis.com",
            "https://securetoken.googleapis.com",
            "https://www.googleapis.com",
          ],
          "frame-ancestors": ["'none'"],
          "object-src": ["'none'"],
          "base-uri": ["'self'"],
          "form-action": ["'self'"],
        },
      },
    })
  );
}

function createRequestLogger(config) {
  return (req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader("X-Request-Id", req.id);

    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const severity = res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARNING" : "INFO";

      log(severity, "HTTP request completed", {
        requestId: req.id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
        userAgent: req.get("user-agent"),
        trace: cloudTraceName(req, config),
      });
    });

    next();
  };
}

export function createApp(overrides = {}) {
  const config = createConfig(overrides);
  const app = express();
  const cache = new TtlCache(config.cacheMaxEntries);
  const voteStore = new VoteStore();
  const firebaseVerifier = createFirebaseVerifier(config);
  const voteHandlers = createVoteHandlers({ voteStore });

  app.set("trust proxy", config.trustProxyHops);
  configureSecurity(app);

  app.use(compression());
  app.use(express.json({ limit: "32kb", strict: true }));
  app.use(createRequestLogger(config));

  app.use(
    createLimiter({
      windowMs: config.rateLimitWindowMs,
      limit: config.rateLimitMax,
      message: {
        error: "Too many requests. Please slow down and try again shortly.",
        code: "rate_limited",
      },
    })
  );

  app.get("/healthz", (req, res) => {
    res.json({
      status: "ok",
      service: SERVICE_NAME,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/readyz", (req, res) => {
    res.json({
      status: "ready",
      staticAssetsAvailable: fs.existsSync(path.join(config.distPath, "index.html")),
      aiConfigured: Boolean(config.groqApiKey),
      firebaseAuthEnabled: Boolean(firebaseVerifier),
      authRequired: config.requireAuth,
    });
  });

  app.get("/api/config", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      authRequired: config.requireAuth,
      firebase: getPublicFirebaseConfig(config),
    });
  });

  app.post(
    "/api/chat",
    createLimiter({
      windowMs: config.rateLimitWindowMs,
      limit: config.chatRateLimitMax,
      message: {
        error: "Too many chat requests. Please wait a minute before trying again.",
        code: "chat_rate_limited",
      },
    }),
    authMiddleware(firebaseVerifier, config),
    createChatHandler({ cache, config })
  );

  app.get(
    "/api/vote/status",
    authMiddleware(firebaseVerifier, config, { forceAuth: true }),
    voteHandlers.getVoteStatus
  );

  app.post(
    "/api/vote",
    createLimiter({
      windowMs: config.rateLimitWindowMs,
      limit: Math.max(3, Math.floor(config.chatRateLimitMax / 2)),
      message: {
        error: "Too many vote attempts. Please wait and try again.",
        code: "vote_rate_limited",
      },
    }),
    authMiddleware(firebaseVerifier, config, { forceAuth: true }),
    voteHandlers.submitVote
  );

  app.use(
    express.static(config.distPath, {
      index: false,
      maxAge: "1y",
      immutable: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store");
        }
      },
    })
  );

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();

    const indexPath = path.join(config.distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      return next(
        new HttpError(
          503,
          "Frontend assets are not built. Run npm run build before starting the server.",
          "assets_missing"
        )
      );
    }

    res.setHeader("Cache-Control", "no-store");
    return res.sendFile(indexPath);
  });

  app.use((req, res) => {
    res.status(404).json({
      error: "Not found.",
      code: "not_found",
    });
  });

  app.use((error, req, res, _next) => {
    const { statusCode, body } = safeErrorResponse(error);
    log(statusCode >= 500 ? "ERROR" : "WARNING", body.error, {
      requestId: req.id,
      code: body.code,
      errorName: error?.name,
      trace: cloudTraceName(req, config),
    });
    res.status(statusCode).json(body);
  });

  return app;
}

export {
  MAX_CHAT_INPUT_LENGTH,
  MAX_HISTORY_MESSAGES,
  SYSTEM_PROMPT,
  TtlCache,
  VoteStore,
  buildCacheKey,
  sanitizeText,
};

if (process.argv[1] === __filename) {
  const config = createConfig();
  const app = createApp(config);
  app.listen(config.port, "0.0.0.0", () => {
    log("INFO", "VoteSahayak server started", {
      port: config.port,
      nodeEnv: config.nodeEnv,
      authRequired: config.requireAuth,
      firebaseAuthEnabled: config.enableFirebaseAuth,
    });
  });
}
