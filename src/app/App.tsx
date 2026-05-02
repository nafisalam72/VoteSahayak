/**
 * @file App.tsx
 * @description Root application component for VoteSahayak.
 *
 * Renders the top-level container with global styling tokens and injects
 * the React Router {@link RouterProvider} to handle all client-side routing.
 * The `bg-slate-950` background and `text-slate-100` foreground establish the
 * app's dark theme across every page.
 */

import { RouterProvider } from "react-router";
import AuthGate from "./components/AuthGate";
import { router } from "./routes";

/**
 * Root `App` component — the entry point rendered by `main.tsx`.
 *
 * @returns The full application wrapped in a themed container and router.
 */
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
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
    </div>
  );
}
