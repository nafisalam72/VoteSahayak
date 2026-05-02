import React, { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { LogOut, ShieldCheck } from "lucide-react";
import {
  hasFirebaseClientConfig,
  initializeFirebaseAnalytics,
  signOutCurrentUser,
  subscribeToAuthState,
} from "@/lib/firebase";

type AuthGateProps = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const [authConfigured, setAuthConfigured] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    hasFirebaseClientConfig()
      .then((isConfigured) => {
        if (!isMounted) return undefined;
        setAuthConfigured(isConfigured);

        if (!isConfigured) {
          setIsLoading(false);
          return undefined;
        }

        void initializeFirebaseAnalytics();

        return subscribeToAuthState((nextUser) => {
          if (!isMounted) return;
          setUser(nextUser);
          setIsLoading(false);
        });
      })
      .then((nextUnsubscribe) => {
        if (nextUnsubscribe) unsubscribe = nextUnsubscribe;
      })
      .catch(() => {
        if (!isMounted) return;
        setAuthError("Authentication could not be initialized.");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (authConfigured === null || isLoading) return;
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    if (!user && path !== "/login") {
      window.location.replace("/login");
      return;
    }

    if (user && path === "/login") {
      window.location.replace("/");
    }
  }, [authConfigured, isLoading, user]);

  async function handleSignOut() {
    setAuthError(null);
    try {
      await signOutCurrentUser();
    } catch {
      setAuthError("Sign-out failed. Please try again.");
    }
  }

  if (authConfigured === false) {
    return <>{children}</>;
  }

  if (authConfigured === null || isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center px-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-orange-400" aria-hidden="true" />
          <p className="text-lg font-semibold">Checking secure session...</p>
        </div>
      </main>
    );
  }

  if (!user && typeof window !== "undefined" && window.location.pathname !== "/login") {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center px-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-orange-400" aria-hidden="true" />
          <p className="text-lg font-semibold">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      {children}
      <aside
        className="fixed bottom-4 right-4 z-[60] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-sm text-slate-200 shadow-2xl backdrop-blur"
        aria-label="Authentication status"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-green-400" aria-hidden="true" />
          <span className="max-w-48 truncate">
            Signed in as {user.email || user.displayName || "Google user"}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
            aria-label="Sign out of VoteSahayak"
          >
            <LogOut className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
