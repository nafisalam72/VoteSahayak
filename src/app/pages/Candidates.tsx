/**
 * @file pages/Candidates.tsx
 * @description Know Your Candidates page for VoteSahayak.
 *
 * Displays a filterable grid of candidate affidavit summaries including
 * education, profession, age, and pending criminal cases. Uses a skeleton
 * loading state on mount to simulate an async data fetch.
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  User,
  Briefcase,
  GraduationCap,
  AlertTriangle,
} from "lucide-react";
import { motion } from "motion/react";
import { Skeleton } from "@/app/components/ui/skeleton";
import type { Candidate } from "@/types";

/** Mock candidate data — replace with a real API call in production. */
const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    party: "Democratic Alliance (DA)",
    age: 45,
    education: "Ph.D. in Economics",
    profession: "Professor",
    cases: 0,
    color: "bg-orange-500",
  },
  {
    id: 2,
    name: "Priya Patel",
    party: "National Progressive Party (NPP)",
    age: 52,
    education: "LLB, LLM",
    profession: "Advocate",
    cases: 1,
    color: "bg-green-600",
  },
  {
    id: 3,
    name: "Vikram Singh",
    party: "Independent (IND)",
    age: 38,
    education: "B.Tech",
    profession: "Social Worker",
    cases: 0,
    color: "bg-blue-500",
  },
];

// ---------------------------------------------------------------------------
// CandidateCardSkeleton
// ---------------------------------------------------------------------------

/**
 * Skeleton placeholder shown for each candidate card during loading.
 * Mirrors the card layout to prevent layout shift when real data arrives.
 */
function CandidateCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <Skeleton className="h-2 w-full" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Candidates (default export)
// ---------------------------------------------------------------------------

/**
 * Know Your Candidates page component.
 *
 * Shows a search bar to filter candidates by name or party, followed by
 * a grid of candidate cards with affidavit details. Skeleton cards are
 * displayed for 800ms on mount to simulate an API fetch.
 *
 * @returns The full candidates UI.
 */
export default function Candidates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  /** Simulate an initial data-fetch loading state. */
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Memoized filtered candidates list — only recomputes when searchTerm changes.
   * Filters by name or party (case-insensitive).
   */
  const filtered = useMemo(
    () =>
      MOCK_CANDIDATES.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.party.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Know Your Candidates
          </h1>
          <p className="text-slate-400">
            Review affidavits, education, and background details of candidates
            in your constituency.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search candidate or party…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-orange-500"
            aria-label="Search candidates by name or party"
            id="candidates-search-input"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <CandidateCardSkeleton key={i} />
            ))
          : filtered.map((candidate, idx) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-700 transition-colors"
              >
                {/* Party colour accent stripe */}
                <div className={`h-2 ${candidate.color}`} aria-hidden="true" />
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">
                        {candidate.name}
                      </h3>
                      <p className="text-sm font-medium text-slate-400">
                        {candidate.party}
                      </p>
                    </div>
                  </div>

                  <dl className="space-y-3 pt-4 border-t border-slate-800 text-sm">
                    <div className="flex items-start gap-3 text-slate-300">
                      <GraduationCap
                        className="w-4 h-4 text-slate-500 mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <dt className="text-slate-500 text-xs">Education</dt>
                        <dd>{candidate.education}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-slate-300">
                      <Briefcase
                        className="w-4 h-4 text-slate-500 mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <dt className="text-slate-500 text-xs">Profession</dt>
                        <dd>
                          {candidate.profession} (Age: {candidate.age})
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-slate-300">
                      <AlertTriangle
                        className={`w-4 h-4 mt-0.5 ${
                          candidate.cases > 0
                            ? "text-orange-500"
                            : "text-green-500"
                        }`}
                        aria-hidden="true"
                      />
                      <div>
                        <dt className="text-slate-500 text-xs">
                          Criminal Cases
                        </dt>
                        <dd
                          className={
                            candidate.cases > 0
                              ? "text-orange-400"
                              : "text-green-400"
                          }
                        >
                          {candidate.cases} pending
                        </dd>
                      </div>
                    </div>
                  </dl>

                  <button
                    className="w-full mt-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700"
                    aria-label={`View full affidavit for ${candidate.name}`}
                    id={`candidate-affidavit-btn-${candidate.id}`}
                  >
                    View Full Affidavit
                  </button>
                </div>
              </motion.div>
            ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500" role="status">
          No candidates found matching your search.
        </div>
      )}
    </div>
  );
}
