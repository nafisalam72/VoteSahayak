/**
 * @file pages/Journey.tsx
 * @description Voter Journey page — step-by-step voter registration guide.
 */

import React from "react";
import { motion } from "motion/react";
import { UserPlus, FileText, CheckSquare, Fingerprint } from "lucide-react";

type JourneyStep = {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

/** Ordered array of voter journey steps. */
const STEPS: JourneyStep[] = [
  {
    id: 1,
    title: "Check Eligibility",
    description: "Ensure you are an Indian citizen and 18+ years of age.",
    icon: UserPlus,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: 2,
    title: "Register via Form 6",
    description: "Submit your details on the Voter Portal or via the app.",
    icon: FileText,
    color: "from-orange-500 to-orange-600",
  },
  {
    id: 3,
    title: "Verify Documents",
    description: "Provide address and identity proof for BLO verification.",
    icon: CheckSquare,
    color: "from-green-500 to-green-600",
  },
  {
    id: 4,
    title: "Cast Your Vote",
    description: "Use the EVM machine at your designated polling booth securely.",
    icon: Fingerprint,
    color: "from-purple-500 to-purple-600",
  },
];

/**
 * Voter Journey page component — the default `/` route.
 * Renders 4 animated step cards and a CTA linking to NVSP registration.
 *
 * @returns The full voter journey UI.
 */
export default function Journey() {
  return (
    <div className="space-y-8 pb-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Voter Journey</h1>
        <p className="text-slate-400">
          Step-by-step guide to becoming an active participant in Indian democracy.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 pt-4">
        {STEPS.map((step, index) => (
          <motion.article
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4 overflow-hidden group hover:border-slate-700 transition-colors"
            aria-label={`Step ${step.id}: ${step.title}`}
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${step.color} opacity-10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:opacity-20 transition-opacity`}
              aria-hidden="true"
            />
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
              aria-hidden="true"
            >
              <step.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-200 mb-2">Step {step.id}</h2>
              <h3 className="text-lg font-medium text-slate-300 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-orange-500/10 via-slate-900 to-green-600/10 border border-slate-800 text-center space-y-6">
        <h2 className="text-2xl font-bold text-slate-200">Ready to Register?</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          You can register online through the Voter Helpline App or the National Voters&apos; Services Portal (NVSP).
        </p>
        <a
          href="https://voters.eci.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-orange-500/20"
          aria-label="Apply for voter registration using Form 6 on the official NVSP portal"
          id="journey-apply-btn"
        >
          Apply Now (Form 6)
        </a>
      </div>
    </div>
  );
}
