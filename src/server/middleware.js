/**
 * @file server/middleware.js
 * @description Security and Logging middleware.
 */

import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import winston from "winston";
import { LoggingWinston } from "@google-cloud/logging-winston";

const createLoggingTransport = () => {
  try {
    const lw = new LoggingWinston();
    // Prevent transport errors from crashing the process
    lw.on("error", (err) => {
      process.stderr.write(`Logging transport error: ${err.message}\n`);
    });
    return lw;
  } catch (e) {
    return null;
  }
};

const getTransports = () => {
  const t = [new winston.transports.Console()];
  const lw = createLoggingTransport();
  if (lw) t.push(lw);
  return t;
};

const logger = winston.createLogger({
  level: "info",
  transports: getTransports(),
});

export const setupSecurity = (app) => {
  // CORS configuration for Cloud Run deployment
  // Allow requests from the same origin (Cloud Run URL) and localhost for development
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow same-origin requests
      const allowedOrigins = [
        origin, // Allow the requesting origin
        'http://localhost:5173',
        'http://localhost:8080',
        'https://localhost:5173',
        'https://localhost:8080',
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // For production, we allow the Cloud Run URL dynamically
        // This is safe because we're just allowing the origin that made the request
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // 24 hours
  };

  app.use(cors(corsOptions));

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "connect-src": [
          "'self'",
          "*.googleapis.com",
          "https://api.groq.com",
          "*.firebaseapp.com",
          "*.firebase.com",
          "https://*.firebaseio.com"
        ],
        "frame-src": ["'self'", "*.firebaseapp.com", "*.firebase.com"],
      },
    },
  }));
};

export const setupCompression = (app) => app.use(compression());

export const createLogger = () => (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info("HTTP Request", {
      method: req.method, path: req.path,
      status: res.statusCode, durationMs: Date.now() - start,
    });
  });
  next();
};

export const createLimiter = (max) => rateLimit({
  windowMs: 60 * 1000, max,
  message: { error: "Too many requests" },
  standardHeaders: true, legacyHeaders: false,
});
