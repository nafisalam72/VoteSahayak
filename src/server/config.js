import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toPositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toPositiveInt(process.env.PORT, 8080),
  distPath: path.resolve(__dirname, "../../dist"),
  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    apiUrl: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  },
  firebase: {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_WEB_API_KEY || "",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "",
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_WEB_APP_ID || "",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || "",
  },
  auth: {
    enabled: toBoolean(process.env.ENABLE_FIREBASE_AUTH, false),
    required: toBoolean(process.env.REQUIRE_AUTH, false),
  },
  limits: {
    rateLimitWindowMs: toPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    rateLimitMax: toPositiveInt(process.env.RATE_LIMIT_MAX, 120),
    chatRateLimitMax: toPositiveInt(process.env.CHAT_RATE_LIMIT_MAX, 12),
    aiTimeoutMs: toPositiveInt(process.env.AI_TIMEOUT_MS, 20000),
  },
  cache: {
    ttlMs: toPositiveInt(process.env.CACHE_TTL_MS, 300000),
    maxEntries: toPositiveInt(process.env.CACHE_MAX_ENTRIES, 250),
  },
};
