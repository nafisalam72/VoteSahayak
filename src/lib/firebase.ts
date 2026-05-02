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

const getBuildTimeConfig = (): FirebaseClientConfig | null => ({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

export async function getFirebaseClientConfig(): Promise<FirebaseClientConfig | null> {
  if (!configPromise) {
    const cfg = getBuildTimeConfig();
    configPromise = Promise.resolve(isComplete(cfg) ? cfg : null);
  }
  return configPromise;
}

export async function getFirebaseAuth() {
  if (authPromise) return authPromise;
  authPromise = (async () => {
    const cfg = await getFirebaseClientConfig();
    if (!cfg) return null;
    const { initializeApp, getApps } = await import("firebase/app");
    const app = getApps().length ? getApps()[0] : initializeApp(cfg);
    const { getAuth, setPersistence, browserLocalPersistence } = await import("firebase/auth");
    const auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);
    return auth;
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
  if (!auth) throw new Error("Firebase not initialized");
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
  if (!auth) throw new Error("Firebase not initialized");
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const auth = await getFirebaseAuth();
  if (!auth) throw new Error("Firebase not initialized");
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
