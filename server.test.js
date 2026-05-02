import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TtlCache, createApp, sanitizeText } from "./server.js";

function createGroqResponse(content) {
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: { content },
        },
      ],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

function createTestApp(overrides = {}) {
  return createApp({
    groqApiKey: "test-groq-key",
    enableFirebaseAuth: false,
    requireAuth: false,
    rateLimitMax: 1000,
    chatRateLimitMax: 1000,
    cacheTtlMs: 60_000,
    ...overrides,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Cloud Run server", () => {
  it("serves a health endpoint for Cloud Monitoring uptime checks", async () => {
    const app = createTestApp();

    const response = await request(app).get("/healthz").expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      service: "votesahayak",
    });
  });

  it("serves runtime public config without exposing secrets", async () => {
    const app = createTestApp({
      firebaseProjectId: "demo-project",
      firebaseWebApiKey: "public-web-key",
      firebaseAuthDomain: "demo-project.firebaseapp.com",
      firebaseWebAppId: "demo-app-id",
      firebaseStorageBucket: "demo-project.firebasestorage.app",
      firebaseMessagingSenderId: "123456789",
      firebaseMeasurementId: "G-DEMO123",
    });

    const response = await request(app).get("/api/config").expect(200);

    expect(response.body).toMatchObject({
      authRequired: false,
      firebase: {
        apiKey: "public-web-key",
        authDomain: "demo-project.firebaseapp.com",
        projectId: "demo-project",
        appId: "demo-app-id",
        storageBucket: "demo-project.firebasestorage.app",
        messagingSenderId: "123456789",
        measurementId: "G-DEMO123",
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("test-groq-key");
  });

  it("rejects invalid chat payloads before calling the AI provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const app = createTestApp();

    await request(app)
      .post("/api/chat")
      .send({ message: "<script>", unexpected: true })
      .expect(400);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sanitizes and proxies valid chat requests through the server", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createGroqResponse("Use Form 6 for new voter registration."));
    vi.stubGlobal("fetch", fetchMock);
    const app = createTestApp();

    const response = await request(app)
      .post("/api/chat")
      .send({ message: "  <b>Which form registers new voters?</b>  " })
      .expect(200);

    expect(response.body).toMatchObject({
      reply: "Use Form 6 for new voter registration.",
      cached: false,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer test-groq-key");
  });

  it("caches repeated chat requests to reduce upstream cost and latency", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createGroqResponse("EVM means Electronic Voting Machine."));
    vi.stubGlobal("fetch", fetchMock);
    const app = createTestApp();

    await request(app).post("/api/chat").send({ message: "What is EVM?" }).expect(200);
    const cached = await request(app)
      .post("/api/chat")
      .send({ message: "What is EVM?" })
      .expect(200);

    expect(cached.body.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rate limits chat requests per client IP", async () => {
    const fetchMock = vi.fn().mockResolvedValue(createGroqResponse("Please call 1950 for voter help."));
    vi.stubGlobal("fetch", fetchMock);
    const app = createTestApp({ chatRateLimitMax: 1 });

    await request(app).post("/api/chat").send({ message: "Help me vote" }).expect(200);
    await request(app).post("/api/chat").send({ message: "Help me vote again" }).expect(429);
  });
});

describe("server helpers", () => {
  it("sanitizes potentially unsafe text", () => {
    expect(sanitizeText("  <img src=x onerror=alert(1)> \n hello ")).toBe(
      "img src=x onerror=alert(1) hello"
    );
  });

  it("expires cache entries after their TTL", () => {
    vi.useFakeTimers();
    const cache = new TtlCache(5);

    cache.set("answer", "cached", 1000);
    expect(cache.get("answer")).toBe("cached");

    vi.advanceTimersByTime(1001);
    expect(cache.get("answer")).toBeNull();
    vi.useRealTimers();
  });
});
