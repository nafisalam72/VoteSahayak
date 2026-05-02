/**
 * @file types/index.ts
 * @description Centralized TypeScript type definitions shared across the
 * VoteSahayak application. Importing from this file ensures a single
 * source of truth and eliminates duplicated inline type declarations.
 */

import type React from "react";

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

/**
 * Represents a single message in the AI chat conversation.
 */
export type Message = {
  /** Unique identifier for the message (Date.now().toString() or 'init'). */
  id: string;
  /** Role of the message author. 'system' messages are sent only to the API. */
  role: "user" | "assistant" | "system";
  /** Plaintext content of the message. */
  content: string;
};

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/**
 * Represents a single item in the sidebar navigation.
 */
export type NavItem = {
  /** React Router path for this route. */
  path: string;
  /** Human-readable label displayed in the sidebar. */
  label: string;
  /** Lucide icon component to render alongside the label. */
  icon: React.ComponentType<{ className?: string }>;
};

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

/**
 * Represents a single multiple-choice quiz question.
 */
export type QuizQuestion = {
  /** The question text displayed to the user. */
  question: string;
  /** Array of answer choice strings (must have exactly 4 items). */
  options: string[];
  /** Zero-based index of the correct answer in the `options` array. */
  correct: number;
};

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------

/**
 * Represents a candidate's publicly available affidavit information.
 */
export type Candidate = {
  /** Unique numeric ID. */
  id: number;
  /** Full name of the candidate. */
  name: string;
  /** Party name and abbreviation (e.g., "Democratic Alliance (DA)"). */
  party: string;
  /** Age of the candidate in years. */
  age: number;
  /** Highest educational qualification. */
  education: string;
  /** Current or most recent profession. */
  profession: string;
  /** Number of pending criminal cases declared in affidavit. */
  cases: number;
  /** Tailwind background color class for the party accent stripe. */
  color: string;
};

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

/** Lifecycle status of a timeline event. */
export type EventStatus = "completed" | "current" | "upcoming";

/**
 * Represents a single event in the election timeline.
 */
export type TimelineEvent = {
  /** Display date string (e.g., "15th March"). */
  date: string;
  /** Short event title. */
  title: string;
  /** Detailed description of the event. */
  description: string;
  /** Lucide icon component for the timeline dot. */
  icon: React.ComponentType<{ className?: string }>;
  /** Status used to determine styling (completed/current/upcoming). */
  status: EventStatus;
};

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

/** Represents a video tutorial entry in the Education page. */
export type VideoEntry = {
  title: string;
  duration: string;
  category: string;
};

/** Represents an article entry in the Education page. */
export type ArticleEntry = {
  title: string;
  readTime: string;
};

// ---------------------------------------------------------------------------
// Voting API
// ---------------------------------------------------------------------------

export type VoteRecord = {
  candidateId: string;
  votedAt: string;
};

export type VoteStatusResponse = {
  hasVoted: boolean;
  record: VoteRecord | null;
};
