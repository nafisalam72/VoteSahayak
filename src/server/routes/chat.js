import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { config } from "../config.js";
import { chatCache } from "../services/cache.js";
import { callAI } from "../services/ai.js";
import { createLimiter } from "../middleware.js";

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(500),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).default([]),
});

const getCacheKey = (payload) => 
  crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

router.post("/", createLimiter(config.limits.chatRateLimitMax), async (req, res, next) => {
  try {
    const { message, history } = chatSchema.parse(req.body);
    const cacheKey = getCacheKey({ message, history });
    const cached = chatCache.get(cacheKey);
    if (cached) return res.json({ reply: cached, cached: true });

    const reply = await callAI({ message, history });
    chatCache.set(cacheKey, reply);
    res.json({ reply, cached: false });
  } catch (error) {
    console.error("Chat API Error:", error);
    
    // Handle specific error types
    if (error.code === "ai_not_configured") {
      return res.status(503).json({ 
        error: "AI service is not configured on the server",
        code: "ai_not_configured"
      });
    }
    
    if (error.code === "ai_auth_error") {
      return res.status(503).json({ 
        error: "AI service authentication failed. Please contact support.",
        code: "ai_auth_error"
      });
    }
    
    if (error.code === "ai_rate_limit") {
      return res.status(429).json({ 
        error: "AI service rate limit exceeded",
        code: "ai_rate_limit"
      });
    }
    
    if (error.code === "ai_timeout") {
      return res.status(504).json({ 
        error: "AI service request timed out",
        code: "ai_timeout"
      });
    }
    
    next(error);
  }
});

export default router;
