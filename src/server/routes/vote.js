import { Router } from "express";
import { z } from "zod";

const router = Router();
const votes = new Map(); // Mock database

const voteSchema = z.object({
  candidateId: z.string().min(1),
});

router.get("/status", (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  res.json({ hasVoted: votes.has(userId), record: votes.get(userId) });
});

router.post("/", async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (votes.has(userId)) return res.status(409).json({ error: "Already voted" });

    const { candidateId } = voteSchema.parse(req.body);
    const record = { candidateId, votedAt: new Date().toISOString() };
    votes.set(userId, record);
    res.status(201).json({ success: true, record });
  } catch (error) {
    next(error);
  }
});

export default router;
