import express from "express";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { setupSecurity, setupCompression, createLogger, createLimiter } from "./middleware.js";
import { verifier } from "./services/firebase.js";
import chatRoutes from "./routes/chat.js";
import voteRoutes from "./routes/vote.js";

const authMiddleware = async (req, res, next) => {
  if (!config.auth.required) return next();
  const token = req.get("authorization")?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Auth required" });
  try {
    req.user = await verifier.verify(token);
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const setupBaseMiddleware = (app) => {
  app.set("trust proxy", 1);
  setupSecurity(app);
  setupCompression(app);
  app.use(express.json({ limit: "32kb" }));
  app.use(createLogger());
  app.use(createLimiter(config.limits.rateLimitMax));
};

const setupAPIRoutes = (app) => {
  app.get("/api/config", (req, res) => res.json({ firebase: config.firebase }));
  app.use("/api/chat", authMiddleware, chatRoutes);
  app.use("/api/vote", authMiddleware, voteRoutes);
  app.get("/healthz", (req, res) => res.json({ status: "ok" }));
};

const setupStaticRoutes = (app) => {
  app.use(express.static(config.distPath, { index: false }));
  app.get("*", (req, res) => {
    const index = path.join(config.distPath, "index.html");
    if (fs.existsSync(index)) return res.sendFile(index);
    res.status(404).json({ error: "Not found" });
  });
};

export const createApp = () => {
  const app = express();
  setupBaseMiddleware(app);
  setupAPIRoutes(app);
  setupStaticRoutes(app);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message || "Internal Error" });
  });
  return app;
};
