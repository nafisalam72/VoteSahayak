/**
 * @file components/UserBadge.tsx
 * @description Floating sign-out badge. Sign-out triggers auth state change
 * which RequireAuth handles automatically — no manual redirect needed.
 */

import React, { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { LogOut, ShieldCheck } from "lucide-react";
import { subscribeToAuthState, signOutCurrentUser } from "@/lib/firebase";

export default function UserBadge() {
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    subscribeToAuthState((u) => setUser(u)).then(fn => { unsub = fn; });
    return () => unsub?.();
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutCurrentUser();
      // RequireAuth in routes.tsx detects user=null → navigate to /login automatically
    } catch {
      setSigningOut(false);
    }
  };

  if (!user) return null;

  return (
    <aside
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-slate-900/95 border border-slate-700 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur text-sm text-slate-200"
      aria-label="Signed-in user info"
    >
      <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" aria-hidden="true" />
      <span className="max-w-40 truncate text-slate-300">{user.email || user.displayName}</span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="ml-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-orange-400"
        aria-label="Sign out of VoteSahayak"
      >
        <LogOut className="inline w-3.5 h-3.5 mr-1" aria-hidden="true" />
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </aside>
  );
}
