import { describe, it, expect, vi } from "vitest";

// Mock @google-cloud/storage
vi.mock("@google-cloud/storage", () => {
  const mockFile = {
    save: vi.fn().mockResolvedValue(true),
    publicUrl: vi.fn().mockReturnValue("http://mock-url.com")
  };
  const mockBucket = {
    file: vi.fn(() => mockFile),
    getFiles: vi.fn().mockResolvedValue([[]])
  };
  
  const MockStorage = vi.fn().mockImplementation(function() {
    this.bucket = vi.fn(() => mockBucket);
  });
  
  return { Storage: MockStorage };
});

import { uploadCertificate, checkStorageHealth } from "./storage.js";

describe("Storage Service", () => {
  it("uploads certificate correctly", async () => {
    const url = await uploadCertificate("test.pdf", Buffer.from("data"));
    expect(url).toBe("http://mock-url.com");
  });

  it("checks storage health", async () => {
    const health = await checkStorageHealth();
    expect(health).toBe(true);
  });
});
