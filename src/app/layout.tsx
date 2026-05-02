/**
 * @file layout.tsx
 * @description Root layout component for VoteSahayak.
 *
 * Renders the full application shell consisting of:
 * - An animated sidebar with navigation links and a voter helpline footer.
 * - A sticky top header with a mobile hamburger toggle.
 * - An animated `<Outlet />` region where child routes are rendered.
 *
 * The sidebar is always visible on `md+` screens. On mobile, it slides in/out
 * via a spring animation and a semi-transparent overlay backdrop.
 */

import React, { useState, useCallback, memo } from "react";
import { Outlet, NavLink, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Clock,
  CheckCircle,
  MessageCircle,
  Users,
  BookOpen,
  HelpCircle,
  Menu,
  X,
  Vote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------

/**
 * Ordered list of sidebar navigation items.
 * Each item maps a path to a label and a Lucide icon.
 */
const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Voter Journey", icon: Vote },
  { path: "/locator", label: "Station Locator", icon: MapPin },
  { path: "/timeline", label: "Election Timeline", icon: Clock },
  { path: "/candidates", label: "Candidate Info", icon: Users },
  { path: "/education", label: "Voter Education", icon: BookOpen },
  { path: "/quiz", label: "Knowledge Quiz", icon: CheckCircle },
  { path: "/chat", label: "AI Sahayak Chat", icon: MessageCircle },
  { path: "/support", label: "Help & Support", icon: HelpCircle },
];

// ---------------------------------------------------------------------------
// SidebarNavItem
// ---------------------------------------------------------------------------

interface SidebarNavItemProps {
  /** Navigation item data (path, label, icon). */
  item: NavItem;
  /** Whether this item corresponds to the current route. */
  isActive: boolean;
}

/**
 * A single sidebar navigation link, memoized to prevent re-renders when
 * sibling nav items change active state.
 *
 * @param props.item - The nav item configuration object.
 * @param props.isActive - Whether this link is the active route.
 */
const SidebarNavItem = memo(function SidebarNavItem({
  item,
  isActive,
}: SidebarNavItemProps) {
  return (
    <NavLink
      to={item.path}
      className="block relative group"
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && (
        <motion.div
          layoutId="active-nav"
          className="absolute inset-0 bg-slate-800 rounded-xl"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div
        className={cn(
          "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200",
          isActive
            ? "text-orange-400 font-medium"
            : "text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/50"
        )}
      >
        <item.icon
          className={cn("w-5 h-5", isActive ? "text-orange-500" : "")}
        />
        <span>{item.label}</span>
      </div>
    </NavLink>
  );
});

// ---------------------------------------------------------------------------
// Layout (default export)
// ---------------------------------------------------------------------------

/**
 * Root layout component rendered by the `/` React Router route.
 * All child pages are injected into the `<Outlet />` region.
 *
 * @returns The full app shell with sidebar, header, and content area.
 */
export default function Layout() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  /** Opens the mobile sidebar overlay. */
  const openSidebar = useCallback(() => setIsOpen(true), []);

  /** Closes the mobile sidebar overlay. */
  const closeSidebar = useCallback(() => setIsOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col md:relative md:translate-x-0"
        aria-label="Application sidebar"
      >
        {/* Sidebar header: brand + close button */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20">
              <Vote className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">
              VoteSahayak
            </h1>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            aria-label="Close navigation menu"
            id="sidebar-close-btn"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation links */}
        <nav
          className="flex-1 overflow-y-auto p-4 space-y-1"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" &&
                location.pathname.startsWith(item.path));
            return (
              <SidebarNavItem key={item.path} item={item} isActive={isActive} />
            );
          })}
        </nav>

        {/* Helpline footer */}
        <div className="p-6 border-t border-slate-800">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/30">
            <h4 className="text-sm font-semibold text-slate-200 mb-1">
              Helpdesk 24/7
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Toll-free Voter Helpline
            </p>
            <div className="flex items-center gap-2 text-green-500 font-mono font-bold text-lg">
              <span>1950</span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0F15] relative">
        {/* Top header */}
        <header className="h-16 flex items-center gap-4 px-6 bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-30 shrink-0">
          <button
            onClick={openSidebar}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            aria-label="Open navigation menu"
            id="sidebar-open-btn"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2" aria-live="polite">
            <span
              className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-slate-300">
              System Online
            </span>
          </div>
        </header>

        {/* Page content with animated transitions */}
        <div className="flex-1 overflow-auto overflow-x-hidden p-4 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
