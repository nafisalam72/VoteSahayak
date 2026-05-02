import React, { useEffect, useState } from "react";
import { ShieldCheck, LogIn } from "lucide-react";
import { hasFirebaseClientConfig, signInWithGoogle, subscribeToAuthState } from "@/lib/firebase";

export default function Login() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    hasFirebaseClientConfig()
      .then((configured) => {
        if (!isMounted) return;
        setIsConfigured(configured);
        setIsLoading(false);

        if (!configured) return;

        subscribeToAuthState((user) => {
          if (user && typeof window !== "undefined") {
            window.location.replace("/");
          }
        }).then((nextUnsubscribe) => {
          unsubscribe = nextUnsubscribe;
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Authentication could not be initialized.");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  async function handleLogin() {
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("Google sign-in was cancelled or blocked. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center px-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-orange-400" aria-hidden="true" />
          <p className="text-lg font-semibold">Checking authentication setup...</p>
        </div>
      </main>
    );
  }

  if (!isConfigured) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center px-6">
        <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-bold text-slate-100">Login not configured</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Set Firebase environment variables on the server (`FIREBASE_WEB_API_KEY`,
            `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_WEB_APP_ID`) and restart
            the app.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center px-6">
      <section
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl"
        aria-labelledby="signin-heading"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15">
          <ShieldCheck className="h-8 w-8 text-orange-400" aria-hidden="true" />
        </div>
        <h1 id="signin-heading" className="text-2xl font-bold text-slate-100">
          VoteSahayak Login
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Sign in with Google to access voting pages and protected APIs.
        </p>
        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogin}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400"
          aria-label="Login with Google"
        >
          <LogIn className="h-5 w-5" aria-hidden="true" />
          Login with Google
        </button>
      </section>
    </main>
  );
}
