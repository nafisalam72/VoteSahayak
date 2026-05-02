import { describe, expect, it } from "vitest";
import {
  MAX_CHAT_INPUT_LENGTH,
  isSafeChatMessage,
  isValidLocatorQuery,
  sanitizeLocatorQuery,
  sanitizeUserText,
} from "./security";

describe("security utilities", () => {
  it("removes control characters and HTML brackets from chat text", () => {
    expect(sanitizeUserText("  <script>alert(1)</script>\nWhat is EVM?  ")).toBe(
      "scriptalert(1)/script What is EVM?"
    );
  });

  it("enforces the chat message length limit", () => {
    const oversized = "a".repeat(MAX_CHAT_INPUT_LENGTH + 50);
    expect(sanitizeUserText(oversized)).toHaveLength(MAX_CHAT_INPUT_LENGTH);
  });

  it("validates and normalizes EPIC or pincode locator queries", () => {
    expect(sanitizeLocatorQuery(" abc1234567 ")).toBe("ABC1234567");
    expect(isValidLocatorQuery("ABC1234567")).toBe(true);
    expect(isValidLocatorQuery("<bad>")).toBe(false);
  });

  it("rejects blank chat messages after sanitization", () => {
    expect(isSafeChatMessage("   \n\t  ")).toBe(false);
  });
});
