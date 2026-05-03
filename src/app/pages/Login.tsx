/**
 * @file pages/Login.tsx
 * @description Pro-level login page: Google SSO + Email/Password with sign-up toggle.
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import {
  handleRedirectResult,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/firebase";

type Mode = "login" | "signup";
type Phase = "idle" | "loading" | "submitting" | "redirecting";

function parseFirebaseError(code: string): string {
  const map: Record<string, string> = {
    "auth/user-not-found":       "No account with this email. Please sign up.",
    "auth/wrong-password":       "Incorrect password. Please try again.",
    "auth/email-already-in-use": "This email is already registered. Please log in.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/too-many-requests":    "Too many attempts. Please wait a moment.",
    "auth/invalid-credential":   "Invalid email or password. Please try again.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/internal-error":       "Firebase service is temporarily unavailable. Please check your internet connection and try again.",
    "auth/operation-not-allowed": "Email/password sign-in is not enabled. Please contact support.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [phase, setPhase] = useState<Phase>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  // Redirect result is now handled by GuestOnly in routes.tsx
  useEffect(() => {
    setPhase("idle");
  }, []);

  const clearError = () => setError("");

  const handleGoogle = async () => {
    clearError();
    setPhase("redirecting");
    try { await signInWithGoogle(); }
    catch (e: any) { 
      console.error("Full Login Error:", e);
      // Extract error code from Firebase error or custom message
      let code = e.code;
      if (!code && e.message && e.message.includes("auth/")) {
        code = e.message.split(": ")[0];
      }
      const msg = code ? `[${code}] ${parseFirebaseError(code)}` : `Error: ${e.message || JSON.stringify(e)}`;
      setError(msg); 
      setPhase("idle"); 
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setPhase("submitting");
    try {
      if (mode === "login") await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
      // onAuthStateChanged in GuestOnly will redirect to /
    } catch (err: any) {
      let code = err?.code;
      if (!code && err?.message && err.message.includes("auth/")) {
        code = err.message.split(": ")[0];
      }
      setError(parseFirebaseError(code ?? ""));
      setPhase("idle");
    }
  };

  const isLoading = phase === "loading" || phase === "redirecting" || phase === "submitting";

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4" id="main-content">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/15 mb-4">
            <ShieldCheck className="w-9 h-9 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">VoteSahayak</h1>
          <p className="text-slate-400 mt-1 text-sm">India's Civic Education Platform</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
        >
          {/* Mode tabs */}
          <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); clearError(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m ? "bg-orange-500 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                role="alert"
                className="mb-4 overflow-hidden"
              >
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
                  <p className="font-semibold mb-1">Sign-in Error</p>
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email/Password form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError(); }}
                placeholder="Email address"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="password-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); clearError(); }}
                placeholder={mode === "signup" ? "Create password (min. 6 chars)" : "Password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="w-full pl-10 pr-11 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              id="email-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/20"
            >
              {phase === "submitting" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600 font-medium">OR</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Google Sign-in */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-slate-200 font-semibold rounded-xl transition-all"
            aria-label="Continue with Google"
          >
            {phase === "redirecting" ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>Redirecting to Google…</span></>
            ) : (
              <>
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                Continue with Google
              </>
            )}
          </button>

          <p className="mt-6 text-center text-xs text-slate-600">
            🔒 Secured by Firebase · Your data is private
          </p>
        </motion.div>
      </div>
    </main>
  );
}
