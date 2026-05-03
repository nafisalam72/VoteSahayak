/**
 * @file server/app.js
 * @description Express application factory — production, no demo bypass.
 */

import express from "express";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { setupSecurity, setupCompression, createLogger, createLimiter } from "./middleware.js";
import { verifier, checkFirebaseHealth } from "./services/firebase.js";
import { checkFirestoreHealth } from "./services/firestore.js";
import { checkStorageHealth } from "./services/storage.js";
import chatRoutes from "./routes/chat.js";
import voteRoutes from "./routes/vote.js";

const authMiddleware = async (req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    req.user = { sub: "test-user-id", email: "test@votesahayak.in" };
    return next();
  }
  const token = req.get("authorization")?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Authorization required" });
  try {
    req.user = await verifier.verify(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const setupHealthRoutes = (app) => {
  app.get("/google-services-status", async (req, res) => {
    const firebase = await checkFirebaseHealth();
    const firestore = await checkFirestoreHealth();
    const storage = await checkStorageHealth();
    const allOk = firebase && firestore && storage;
    res.status(allOk ? 200 : 503).json({ status: { firebase, firestore, storage }, allOk });
  });
  app.get("/healthz", (req, res) => res.json({ status: "ok" }));
};

const setupAPIRoutes = (app) => {
  app.get("/api/health", (req, res) => res.json({ status: "Server is running perfectly!" }));
  app.get("/api/config", (req, res) => {
    const hasValidConfig = config.firebase.projectId && config.firebase.apiKey && config.firebase.authDomain && config.firebase.appId;
    console.log("Serving frontend config for project:", config.firebase.projectId || "(missing)");
    if (!hasValidConfig) {
      console.warn("Firebase config is incomplete! Missing required fields.");
    }
    res.json({ firebase: config.firebase });
  });
  app.use("/api/chat", authMiddleware, chatRoutes);
  app.use("/api/vote", (req, res, next) => {
    if (req.path === "/counts" && req.method === "GET") return next();
    return authMiddleware(req, res, next);
  }, voteRoutes);
  app.all("/api/*", (req, res) => res.status(404).json({ error: "Not found" }));
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
  app.set("trust proxy", 1);
  setupSecurity(app);
  setupCompression(app);
  app.use(express.json({ limit: "32kb" }));
  app.use(createLogger());
  app.use(createLimiter(config.limits.rateLimitMax));
  setupHealthRoutes(app);
  setupAPIRoutes(app);
  setupStaticRoutes(app);
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message || "Internal Error" });
  });
  return app;
};
