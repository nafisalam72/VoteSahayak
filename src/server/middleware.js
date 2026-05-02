import crypto from "node:crypto";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";

export const setupSecurity = (app) => {
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
        "font-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://www.googleapis.com"],
        "frame-ancestors": ["'none'"],
      },
    },
  }));
};

export const setupCompression = (app) => {
  app.use(compression());
};

const cloudTraceName = (req) => {
  const traceHeader = req.get("x-cloud-trace-context");
  if (!traceHeader || !config.firebase.projectId) return undefined;
  return `projects/${config.firebase.projectId}/traces/${traceHeader.split("/")[0]}`;
};

export const createLogger = () => (req, res, next) => {
  req.id = crypto.randomUUID();
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    process.stdout.write(JSON.stringify({
      severity: res.statusCode >= 400 ? "WARNING" : "INFO",
      message: "HTTP Request",
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(duration),
      trace: cloudTraceName(req),
    }) + "\n");
  });
  next();
};

export const createLimiter = (limit, windowMs = config.limits.rateLimitWindowMs) => 
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests", code: "rate_limited" },
  });
