import type { FirebaseApp } from "firebase/app";
import type { User } from "firebase/auth";

type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
};

type RuntimeConfigResponse = {
  firebase?: Partial<FirebaseClientConfig> | null;
};

let appPromise: Promise<FirebaseApp | null> | null = null;
let authPromise: Promise<import("firebase/auth").Auth | null> | null = null;
let analyticsPromise: Promise<unknown | null> | null = null;
let configPromise: Promise<FirebaseClientConfig | null> | null = null;

function isCompleteConfig(
  value: Partial<FirebaseClientConfig> | null | undefined
): value is FirebaseClientConfig {
  return Boolean(value?.apiKey && value.authDomain && value.projectId && value.appId);
}

function getBuildTimeConfigFromJson(): FirebaseClientConfig | null {
  const rawConfig = import.meta.env.VITE_FIREBASE_CONFIG as string | undefined;
  if (!rawConfig) return null;

  try {
    const parsed = JSON.parse(rawConfig) as Partial<FirebaseClientConfig>;
    return isCompleteConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getBuildTimeConfig(): FirebaseClientConfig | null {
  const jsonConfig = getBuildTimeConfigFromJson();
  if (jsonConfig) return jsonConfig;

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as
      | string
      | undefined,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
  };

  return isCompleteConfig(config) ? config : null;
}

async function getRuntimeConfig(): Promise<FirebaseClientConfig | null> {
  try {
    const response = await fetch("/api/config", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as RuntimeConfigResponse;
    return isCompleteConfig(data.firebase) ? data.firebase : null;
  } catch {
    return null;
  }
}

export async function getFirebaseClientConfig(): Promise<FirebaseClientConfig | null> {
  if (!configPromise) {
    configPromise = Promise.resolve(getBuildTimeConfig()).then(
      (buildTimeConfig) => buildTimeConfig || getRuntimeConfig()
    );
  }

  return configPromise;
}

export async function hasFirebaseClientConfig(): Promise<boolean> {
  return (await getFirebaseClientConfig()) !== null;
}

async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    const config = await getFirebaseClientConfig();
    if (!config) return null;

    const { getApps, initializeApp } = await import("firebase/app");
    return getApps().length ? getApps()[0] : initializeApp(config);
  })();

  return appPromise;
}

export async function initializeFirebaseAnalytics(): Promise<void> {
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      const app = await getFirebaseApp();
      if (!app) return null;

      const [{ getAnalytics, isSupported }] = await Promise.all([
        import("firebase/analytics"),
      ]);

      return (await isSupported()) ? getAnalytics(app) : null;
    })();
  }

  await analyticsPromise;
}

export async function getFirebaseAuth() {
  if (authPromise) return authPromise;

  authPromise = (async () => {
    const app = await getFirebaseApp();
    if (!app) return null;

    const { getAuth } = await import("firebase/auth");
    return getAuth(app);
  })();

  return authPromise;
}

export async function subscribeToAuthState(
  onChange: (user: User | null) => void
): Promise<() => void> {
  const auth = await getFirebaseAuth();
  if (!auth) {
    onChange(null);
    return () => undefined;
  }

  const { onAuthStateChanged } = await import("firebase/auth");
  return onAuthStateChanged(auth, onChange);
}

export async function signInWithGoogle(): Promise<void> {
  const auth = await getFirebaseAuth();
  if (!auth) return;

  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
}

export async function signOutCurrentUser(): Promise<void> {
  const auth = await getFirebaseAuth();
  if (!auth) return;

  const { signOut } = await import("firebase/auth");
  await signOut(auth);
}

export async function getCurrentIdToken(): Promise<string | null> {
  const auth = await getFirebaseAuth();
  const currentUser = auth?.currentUser;
  return currentUser ? currentUser.getIdToken() : null;
}
