/**
 * @file lib/utils.ts
 * @description Shared utility helpers for the VoteSahayak application.
 *
 * This module consolidates the `cn()` class-merging helper that was
 * previously duplicated in `layout.tsx` and `Chat.tsx`. All components
 * should import from here instead of defining their own copies.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class strings, resolving conflicts via `tailwind-merge`
 * and handling conditional classes via `clsx`.
 *
 * @param inputs - One or more class values (strings, arrays, objects, etc.)
 * @returns A single, de-duplicated, conflict-resolved class string.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-orange-500", "rounded-xl")
 * // → "px-4 py-2 bg-orange-500 rounded-xl" (when isActive is true)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
