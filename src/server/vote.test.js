import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

// Mock config to disable auth in tests
vi.mock("./config.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    config: {
      ...actual.config,
      auth: { enabled: false, required: false }
    }
  };
});

vi.mock("./services/firebase.js", () => ({
  verifier: { verify: vi.fn() },
  checkFirebaseHealth: vi.fn().mockResolvedValue(true),
}));

vi.mock("./services/firestore.js", () => ({
  recordVote: vi.fn().mockResolvedValue(true),
  getVote: vi.fn().mockResolvedValue(null),
  getVoteCounts: vi.fn().mockResolvedValue({ "C1": 5 }),
  checkFirestoreHealth: vi.fn().mockResolvedValue(true),
}));

vi.mock("@google-cloud/logging-winston", () => {
  class MockLW {
    constructor() {
      this.log = vi.fn();
      this.on = vi.fn();
      this.emit = vi.fn();
    }
  }
  return {
    LoggingWinston: MockLW,
    default: { LoggingWinston: MockLW }
  };
});

describe("Voting API Integration", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();
  });

  it("should prevent voting twice for the same user", async () => {
    const { getVote } = await import("./services/firestore.js");
    getVote.mockResolvedValueOnce(null).mockResolvedValueOnce({ candidateId: "C1" });

    const res1 = await request(app)
      .post("/api/vote")
      .send({ candidateId: "C1" });
    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post("/api/vote")
      .send({ candidateId: "C1" });
    expect(res2.status).toBe(409);
  });

  it("should return cached counts", async () => {
    const res = await request(app).get("/api/vote/counts");
    expect(res.status).toBe(200);
    expect(res.body.counts).toBeDefined();
  });
});
