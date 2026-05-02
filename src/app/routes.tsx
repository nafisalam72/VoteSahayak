/**
 * @file app/routes.tsx
 * @description Enhanced auth protection with robust Google SSO support.
 */

import React, { lazy, Suspense, useEffect, useState } from "react";
import { createBrowserRouter, Navigate, useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import Layout from "./layout";
import { subscribeToAuthState, handleRedirectResult } from "@/lib/firebase";

const Login     = lazy(() => import("./pages/Login"));
const Journey   = lazy(() => import("./pages/Journey"));
const Locator   = lazy(() => import("./pages/Locator"));
const Timeline  = lazy(() => import("./pages/Timeline"));
const Quiz      = lazy(() => import("./pages/Quiz"));
const Chat      = lazy(() => import("./pages/Chat"));
const Candidates = lazy(() => import("./pages/Candidates"));
const Education = lazy(() => import("./pages/Education"));
const Support   = lazy(() => import("./pages/Support"));
const Account   = lazy(() => import("./pages/Account"));

function AuthSpinner() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </main>
  );
}

/** Global Auth Provider to manage state once */
function AuthGuard({ children, mode }: { children: React.ReactNode; mode: "private" | "guest" }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    let unsub: (() => void) | undefined;

    async function init() {
      // 1. Handle redirect result first
      try { await handleRedirectResult(); } catch (e) { console.error("SSO Error:", e); }

      // 2. Listen for auth changes
      const fn = await subscribeToAuthState((u) => {
        if (!active) return;
        setUser(u);
        setLoading(false);
      });
      unsub = fn;
    }

    init();
    return () => { active = false; unsub?.(); };
  }, []);

  useEffect(() => {
    if (loading) return;

    if (mode === "private" && !user) {
      navigate("/login", { replace: true });
    } else if (mode === "guest" && user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, mode, navigate]);

  if (loading) return <AuthSpinner />;
  
  // Prevent flash of content before redirect
  if (mode === "private" && !user) return null;
  if (mode === "guest" && user) return null;

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <AuthGuard mode="guest">
        <Suspense fallback={<AuthSpinner />}>
          <Login />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/",
    element: (
      <AuthGuard mode="private">
        <Layout />
      </AuthGuard>
    ),
    children: [
      { index: true,               element: <Suspense fallback={<AuthSpinner />}><Journey /></Suspense> },
      { path: "locator",           element: <Suspense fallback={<AuthSpinner />}><Locator /></Suspense> },
      { path: "timeline",          element: <Suspense fallback={<AuthSpinner />}><Timeline /></Suspense> },
      { path: "quiz",              element: <Suspense fallback={<AuthSpinner />}><Quiz /></Suspense> },
      { path: "chat",              element: <Suspense fallback={<AuthSpinner />}><Chat /></Suspense> },
      { path: "candidates",        element: <Suspense fallback={<AuthSpinner />}><Candidates /></Suspense> },
      { path: "education",         element: <Suspense fallback={<AuthSpinner />}><Education /></Suspense> },
      { path: "support",           element: <Suspense fallback={<AuthSpinner />}><Support /></Suspense> },
      { path: "account",           element: <Suspense fallback={<AuthSpinner />}><Account /></Suspense> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
