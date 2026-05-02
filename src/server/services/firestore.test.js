import { describe, it, expect, vi } from "vitest";

// Mock @google-cloud/firestore
vi.mock("@google-cloud/firestore", () => {
  const mockDoc = {
    set: vi.fn().mockResolvedValue(true),
    get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ id: 1 }) })
  };
  const mockColl = {
    doc: vi.fn(() => mockDoc),
    get: vi.fn().mockResolvedValue({ docs: [] })
  };
  
  const MockFirestore = vi.fn().mockImplementation(function() {
    this.collection = vi.fn(() => mockColl);
  });
  
  return { Firestore: MockFirestore };
});

import { recordVote, getVote, getVoteCounts, checkFirestoreHealth } from "./firestore.js";

describe("Firestore Service", () => {
  it("records a vote", async () => {
    await recordVote("u1", { candidateId: "c1" });
  });

  it("gets a vote", async () => {
    const vote = await getVote("u1");
    expect(vote).toBeDefined();
  });

  it("gets vote counts", async () => {
    const counts = await getVoteCounts();
    expect(counts).toBeDefined();
  });

  it("checks health", async () => {
    const health = await checkFirestoreHealth();
    expect(health).toBe(true);
  });
});
