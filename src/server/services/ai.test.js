import { describe, it, expect, vi, beforeEach } from "vitest";
import { callAI } from "./ai.js";
import { config } from "../config.js";

global.fetch = vi.fn();

describe("AI Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.groq.apiKey = "mock-key";
  });

  it("calls AI and returns reply", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: "Test reply" } }]
      })
    });

    const reply = await callAI({ message: "Hello", history: [] });
    expect(reply).toBe("Test reply");
    expect(fetch).toHaveBeenCalled();
  });

  it("throws error if API key missing", async () => {
    config.groq.apiKey = "";
    await expect(callAI({ message: "Hello", history: [] })).rejects.toThrow("AI not configured");
  });

  it("throws error if fetch fails", async () => {
    fetch.mockResolvedValue({ ok: false });
    await expect(callAI({ message: "Hello", history: [] })).rejects.toThrow("AI request failed");
  });
});
