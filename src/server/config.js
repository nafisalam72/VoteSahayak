import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toInt = (v, fallback) => {
  const p = parseInt(v, 10);
  return isNaN(p) || p <= 0 ? fallback : p;
};

const toBool = (v, fallback = false) => {
  if (!v) return fallback;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
};

const getFirebaseConfig = () => ({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_WEB_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "",
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_WEB_APP_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || "",
});

const getGroqConfig = () => ({
  apiKey: process.env.GROQ_API_KEY || "",
  apiUrl: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions",
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
});

const getLimitConfig = () => ({
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 120),
  chatRateLimitMax: toInt(process.env.CHAT_RATE_LIMIT_MAX, 12),
  aiTimeoutMs: toInt(process.env.AI_TIMEOUT_MS, 20000),
});

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toInt(process.env.PORT, 8080),
  distPath: path.resolve(__dirname, "../../dist"),
  groq: getGroqConfig(),
  firebase: getFirebaseConfig(),
  auth: {
    enabled: toBool(process.env.ENABLE_FIREBASE_AUTH, false),
    required: toBool(process.env.REQUIRE_AUTH, false),
  },
  limits: getLimitConfig(),
  cache: {
    ttlMs: toInt(process.env.CACHE_TTL_MS, 300000),
    maxEntries: toInt(process.env.CACHE_MAX_ENTRIES, 250),
  },
};
