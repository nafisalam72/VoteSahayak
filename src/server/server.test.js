import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { chatCache } from "./services/cache.js";
import { verifier } from "./services/firebase.js";

import { config } from "./config.js";

vi.mock("./services/ai.js", () => ({
  callAI: vi.fn().mockResolvedValue("AI Reply"),
}));

vi.mock("./services/firebase.js", () => ({
  verifier: {
    verify: vi.fn(),
  },
}));

describe("VoteSahayak API", () => {
  let app;

  beforeEach(() => {
    config.auth.required = true;
    app = createApp();
    chatCache.clear();
    vi.clearAllMocks();
  });

  it("GET /healthz returns 200", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("POST /api/chat handles messages and caching", async () => {
    verifier.verify.mockResolvedValue({ sub: "user-123" });
    const payload = { message: "Hello", history: [] };
    const res1 = await request(app)
      .post("/api/chat")
      .set("Authorization", "Bearer mock-token")
      .send(payload);
    expect(res1.status).toBe(200);
    expect(res1.body.reply).toBe("AI Reply");
    expect(res1.body.cached).toBe(false);

    const res2 = await request(app)
      .post("/api/chat")
      .set("Authorization", "Bearer mock-token")
      .send(payload);
    expect(res2.body.cached).toBe(true);
  });

  it("POST /api/vote prevents double voting", async () => {
    verifier.verify.mockResolvedValue({ sub: "user-123" });
    
    const res1 = await request(app)
      .post("/api/vote")
      .set("Authorization", "Bearer mock-token")
      .send({ candidateId: "C1" });
    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post("/api/vote")
      .set("Authorization", "Bearer mock-token")
      .send({ candidateId: "C2" });
    expect(res2.status).toBe(409);
  });
});
