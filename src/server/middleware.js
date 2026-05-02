/**
 * @file server/middleware.js
 * @description Security and Logging middleware.
 */

import helmet from "helmet";
import compression from "compression";
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
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "connect-src": ["'self'", "*.googleapis.com", "https://api.groq.com"],
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
