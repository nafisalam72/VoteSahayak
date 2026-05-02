/**
 * @file App.tsx
 * @description Root application component — AuthGate removed, auth is now route-level.
 */

import React from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <div
      className="bg-slate-950 text-slate-100 min-h-screen selection:bg-orange-500 selection:text-white font-sans antialiased"
      id="vote-sahayak-root"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <RouterProvider router={router} />
    </div>
  );
}
