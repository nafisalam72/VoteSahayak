import { describe, it, expect, vi } from "vitest";
import { TtlCache } from "./services/cache.js";

describe("TtlCache", () => {
  it("should set and get values", () => {
    const cache = new TtlCache(10);
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
  });

  it("should respect TTL expiration", () => {
    vi.useFakeTimers();
    const cache = new TtlCache(10);
    cache.set("key", "value", 1000);
    
    vi.advanceTimersByTime(500);
    expect(cache.get("key")).toBe("value");
    
    vi.advanceTimersByTime(600);
    expect(cache.get("key")).toBe(null);
    vi.useRealTimers();
  });

  it("should evict oldest entries when full", () => {
    const cache = new TtlCache(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    
    expect(cache.get("a")).toBe(null);
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });
});
