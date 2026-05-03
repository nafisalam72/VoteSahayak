/**
 * @file lib/firebase.ts
 */

import type { FirebaseApp } from "firebase/app";
import type { User } from "firebase/auth";

type FirebaseClientConfig = {
  apiKey: string; authDomain: string; projectId: string; appId: string;
  storageBucket?: string; messagingSenderId?: string; measurementId?: string;
};

let appPromise: Promise<FirebaseApp | null> | null = null;
let authPromise: Promise<any | null> | null = null;
let configPromise: Promise<FirebaseClientConfig | null> | null = null;

const isComplete = (v: any): v is FirebaseClientConfig =>
  Boolean(v?.apiKey && v.authDomain && v.projectId && v.appId);

const getBuildTimeConfig = (): FirebaseClientConfig | null => {
  const config = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
  
  // Log missing fields in development
  if (import.meta.env.DEV) {
    const missing = Object.entries(config)
      .filter(([k, v]) => (k !== "storageBucket" && k !== "messagingSenderId" && k !== "measurementId") && !v)
      .map(([k]) => k);
    if (missing.length > 0) {
      console.warn("[Firebase] Build-time env vars missing:", missing);
    }
  }
  
  return config;
};

const getRuntimeConfig = async (): Promise<FirebaseClientConfig | null> => {
  try {
    const res = await fetch("/api/config", { 
      signal: AbortSignal.timeout(5000),
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) {
      console.warn(`[Firebase] Runtime config fetch failed (${res.status})`);
      return null;
    }
    const data = await res.json();
    const cfg = data.firebase;
    if (cfg && isComplete(cfg)) {
      console.log("[Firebase] Runtime config loaded successfully");
    }
    return cfg || null;
  } catch (e) {
    console.warn("[Firebase] Runtime config fetch error:", (e as Error).message);
    return null;
  }
};

export async function getFirebaseClientConfig(): Promise<FirebaseClientConfig | null> {
  if (!configPromise) {
    configPromise = (async () => {
      // Try runtime config first (works with Cloud Run)
      const runtimeCfg = await getRuntimeConfig();
      if (isComplete(runtimeCfg)) return runtimeCfg;
      
      // Fall back to build-time config (works for local dev)
      const buildCfg = getBuildTimeConfig();
      return isComplete(buildCfg) ? buildCfg : null;
    })();
  }
  return configPromise;
}

export async function hasFirebaseClientConfig(): Promise<boolean> {
  const cfg = await getFirebaseClientConfig();
  return cfg !== null;
}

export async function initializeFirebaseAnalytics(): Promise<void> {
  try {
    const cfg = await getFirebaseClientConfig();
    if (!cfg) return;
    const { initializeApp, getApps } = await import("firebase/app");
    const app = getApps().length ? getApps()[0] : initializeApp(cfg);
    // Only initialize analytics if available
    try {
      const { getAnalytics } = await import("firebase/analytics");
      getAnalytics(app);
    } catch {
      // Analytics not available, skip
    }
  } catch {
    // Silently fail analytics initialization
  }
}

export async function getFirebaseAuth() {
  if (authPromise) return authPromise;
  authPromise = (async () => {
    try {
      const cfg = await getFirebaseClientConfig();
      
      if (!cfg) {
        console.error("[Firebase] No valid configuration found. Check environment variables or /api/config endpoint.");
        return null;
      }
      
      if (!isComplete(cfg)) {
        const missing = (Object.entries(cfg) as [string, any][])
          .filter(([k, v]) => !v && ["apiKey", "authDomain", "projectId", "appId"].includes(k))
          .map(([k]) => k);
        console.error("[Firebase] Incomplete configuration. Missing:", missing);
        return null;
      }
      
      const { initializeApp, getApps } = await import("firebase/app");
      const app = getApps().length ? getApps()[0] : initializeApp(cfg);
      
      const { getAuth, setPersistence, browserLocalPersistence } = await import("firebase/auth");
      const auth = getAuth(app);
      
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log("[Firebase] Auth initialized successfully");
      } catch (e) {
        console.warn("[Firebase] Persistence setup failed, continuing anyway:", (e as Error).message);
      }
      
      return auth;
    } catch (e) {
      console.error("[Firebase] Initialization error:", (e as Error).message);
      return null;
    }
  })();
  return authPromise;
}

export async function subscribeToAuthState(cb: (u: User | null) => void) {
  const auth = await getFirebaseAuth();
  if (!auth) { cb(null); return () => {}; }
  const { onAuthStateChanged } = await import("firebase/auth");
  return onAuthStateChanged(auth, cb as any);
}

export async function handleRedirectResult(): Promise<User | null> {
  const auth = await getFirebaseAuth();
  if (!auth) return null;
  const { getRedirectResult } = await import("firebase/auth");
  try { return (await getRedirectResult(auth))?.user ?? null; } catch { return null; }
}

export async function signInWithGoogle(): Promise<User | void> {
  const auth = await getFirebaseAuth();
  if (!auth) {
    throw new Error("auth/internal-error: Firebase is not properly configured. Please contact support.");
  }
  const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  
  try {
    // Try popup first as it's more reliable for localhost if not blocked
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (e: any) {
    // If popup is blocked or fails, fall back to redirect
    if (e.code === "auth/popup-blocked" || e.code === "auth/cancelled-popup-request") {
      return await signInWithRedirect(auth, provider);
    }
    throw e;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = await getFirebaseAuth();
  if (!auth) {
    throw new Error("auth/internal-error: Firebase is not properly configured. Please contact support.");
  }
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const auth = await getFirebaseAuth();
  if (!auth) {
    throw new Error("auth/internal-error: Firebase is not properly configured. Please contact support.");
  }
  const { createUserWithEmailAndPassword } = await import("firebase/auth");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOutCurrentUser(): Promise<void> {
  const auth = await getFirebaseAuth();
  if (auth) {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  }
}

export async function getCurrentIdToken(): Promise<string | null> {
  const auth = await getFirebaseAuth();
  return auth?.currentUser ? auth.currentUser.getIdToken() : null;
}
