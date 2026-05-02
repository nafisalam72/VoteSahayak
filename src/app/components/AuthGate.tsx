/**
 * @file components/AuthGate.tsx
 * @description Wraps the entire app to enforce Firebase authentication.
 */

import React, { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { LogOut, ShieldCheck, Loader2 } from "lucide-react";
import {
  hasFirebaseClientConfig,
  handleRedirectResult,
  initializeFirebaseAnalytics,
  signOutCurrentUser,
  subscribeToAuthState,
} from "@/lib/firebase";

type AuthGateProps = { children: React.ReactNode };

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    hasFirebaseClientConfig().then(async (ok) => {
      if (!ok) { setIsLoading(false); return; }
      void initializeFirebaseAnalytics();
      // Process redirect result first (user returning from Google)
      await handleRedirectResult();
      return subscribeToAuthState((u) => { setUser(u); setIsLoading(false); });
    }).then(fn => { if (fn) unsub = fn; })
      .catch(() => { setAuthError("Auth failed to initialize."); setIsLoading(false); });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const path = window.location.pathname;
    if (!user && path !== "/login") window.location.replace("/login");
    if (user && path === "/login") window.location.replace("/");
  }, [isLoading, user]);

  const handleSignOut = async () => {
    try { await signOutCurrentUser(); }
    catch { setAuthError("Sign-out failed. Please try again."); }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-orange-400 animate-spin mx-auto" aria-label="Loading" />
          <p className="text-slate-400 text-sm">Checking secure session…</p>
        </div>
      </main>
    );
  }

  return (
    <>
      {children}
      {user && (
        <aside
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-slate-900/95 border border-slate-700 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur text-sm text-slate-200"
          aria-label="Signed-in user"
        >
          <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" aria-hidden="true" />
          <span className="max-w-44 truncate">{user.email || user.displayName}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="ml-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors focus-visible:outline focus-visible:outline-orange-400"
            aria-label="Sign out of VoteSahayak"
          >
            <LogOut className="inline w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Sign out
          </button>
          {authError && <p className="text-xs text-red-400">{authError}</p>}
        </aside>
      )}
    </>
  );
}
