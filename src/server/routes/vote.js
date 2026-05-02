/**
 * @file server/routes/vote.js
 * @description API routes for voting, results, and certificate storage.
 */

import { Router } from "express";
import { z } from "zod";
import { recordVote, getVote, getVoteCounts } from "../services/firestore.js";
import { uploadCertificate } from "../services/storage.js";

const router = Router();

const voteSchema = z.object({
  candidateId: z.string().min(1),
});

const certSchema = z.object({
  fileName: z.string().min(1),
  data: z.string(), // Base64
});

/**
 * GET /api/vote/status
 * Checks if the user has voted.
 */
router.get("/status", async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const vote = await getVote(userId);
    res.json({ hasVoted: !!vote, record: vote });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vote
 * Submits a vote to Firestore.
 */
router.post("/", async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const existingVote = await getVote(userId);
    if (existingVote) return res.status(409).json({ error: "Already voted" });

    const { candidateId } = voteSchema.parse(req.body);
    const record = { candidateId, votedAt: new Date().toISOString() };
    
    await recordVote(userId, record);
    res.status(201).json({ success: true, record });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vote/certificate
 * Uploads a generated certificate to Cloud Storage.
 */
router.post("/certificate", async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { fileName, data } = certSchema.parse(req.body);
    const buffer = Buffer.from(data, "base64");
    
    const url = await uploadCertificate(`${userId}_${fileName}`, buffer);
    res.status(201).json({ success: true, url });
  } catch (error) {
    next(error);
  }
});

let countsCache = null;
let countsExpiry = 0;

/**
 * GET /api/vote/counts
 * Aggregated results with 30s TTL.
 */
router.get("/counts", async (req, res, next) => {
  try {
    if (countsCache && Date.now() < countsExpiry) {
      return res.json({ counts: countsCache, cached: true });
    }

    const counts = await getVoteCounts();
    countsCache = counts;
    countsExpiry = Date.now() + 30000;
    res.json({ counts, cached: false });
  } catch (error) {
    next(error);
  }
});

export default router;
