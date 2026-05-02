import { describe, it, expect, vi, beforeEach } from "vitest";
import * as firebase from "./firebase";

// Mock global fetch for config
vi.stubGlobal("fetch", vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      firebase: {
        apiKey: "test", authDomain: "test", projectId: "test", appId: "test"
      }
    }),
  })
));

// Mock Firebase SDKs
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));

vi.mock("firebase/auth", () => {
  const authInstance = {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue("mock-token")
    }
  };
  class MockProvider {
    setCustomParameters = vi.fn();
  }
  return {
    getAuth: vi.fn(() => authInstance),
    GoogleAuthProvider: MockProvider,
    onAuthStateChanged: vi.fn((_, cb) => {
      cb(null);
      return vi.fn();
    }),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock("firebase/analytics", () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn(() => Promise.resolve(true)),
}));

describe("Firebase Library", () => {
  it("getFirebaseClientConfig returns config", async () => {
    expect(await firebase.getFirebaseClientConfig()).toBeDefined();
  });

  it("hasFirebaseClientConfig works", async () => {
    expect(await firebase.hasFirebaseClientConfig()).toBe(true);
  });

  it("initializeFirebaseAnalytics works", async () => {
    await firebase.initializeFirebaseAnalytics();
  });

  it("subscribeToAuthState works", async () => {
    const unsub = await firebase.subscribeToAuthState(() => {});
    expect(unsub).toBeDefined();
    unsub();
  });

  it("signInWithGoogle and signOutCurrentUser work", async () => {
    await firebase.signInWithGoogle();
    await firebase.signOutCurrentUser();
  });

  it("getCurrentIdToken returns token", async () => {
    const token = await firebase.getCurrentIdToken();
    expect(token).toBe("mock-token");
  });
});
