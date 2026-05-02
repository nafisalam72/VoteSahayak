/**
 * @file pages/Support.tsx
 * @description Help & Support page for VoteSahayak.
 *
 * Provides voters with quick access to the national voter helpline (1950),
 * the cVIGIL violation-reporting app, and additional contact channels
 * (NVSP portal, ECI email, and the AI chat assistant).
 */

import React from "react";
import { Phone, Mail, Globe, MessageSquare, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

/**
 * Help & Support page component.
 *
 * Renders two primary CTA cards (Helpline + cVIGIL) and a secondary
 * contact-channels panel. All interactive elements have accessible labels.
 *
 * @returns The full support page UI.
 */
export default function Support() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-3xl font-bold text-slate-100">Help &amp; Support</h1>
        <p className="text-slate-400">
          Need assistance? Reach out to the official helplines or report issues
          directly.
        </p>
      </div>

      {/* Primary CTA cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Helpline card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-600/20 to-slate-900 border border-green-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-4"
          role="region"
          aria-labelledby="support-helpline-heading"
        >
          <div
            className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            <Phone className="w-8 h-8 text-green-500" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="support-helpline-heading"
              className="text-xl font-bold text-slate-100"
            >
              National Voter Helpline
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Available in Hindi, English, and regional languages
            </p>
          </div>
          <div
            className="text-4xl font-black text-green-500 tracking-wider font-mono my-4"
            aria-label="Helpline number 1950"
          >
            1950
          </div>
          <a
            href="tel:1950"
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
            aria-label="Call the National Voter Helpline at 1950"
            id="support-call-btn"
          >
            Call Now
          </a>
        </motion.div>

        {/* cVIGIL card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-500/20 to-slate-900 border border-orange-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-4"
          role="region"
          aria-labelledby="support-cvigil-heading"
        >
          <div
            className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            <AlertTriangle
              className="w-8 h-8 text-orange-500"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2
              id="support-cvigil-heading"
              className="text-xl font-bold text-slate-100"
            >
              Report a Violation
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Report Model Code of Conduct violations using cVIGIL
            </p>
          </div>
          <div className="text-lg font-bold text-slate-200 mt-4 mb-2">
            cVIGIL App
          </div>
          <a
            href="https://cvigil.eci.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            aria-label="Download the cVIGIL app to report election violations"
            id="support-cvigil-btn"
          >
            Download App
          </a>
        </motion.div>
      </div>

      {/* Secondary contact channels */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 mt-8">
        <h3 className="text-lg font-bold text-slate-200 mb-6">
          Other Ways to Connect
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="https://nvsp.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-orange-500/50 transition-colors"
            aria-label="Visit the official NVSP voter portal at nvsp.in"
          >
            <Globe className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <div>
              <div className="text-xs text-slate-500">Official Portal</div>
              <div className="text-sm font-medium text-slate-200 hover:text-orange-400">
                nvsp.in
              </div>
            </div>
          </a>

          <a
            href="mailto:complaints@eci.gov.in"
            className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-orange-500/50 transition-colors"
            aria-label="Email the Election Commission at complaints@eci.gov.in"
          >
            <Mail className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <div>
              <div className="text-xs text-slate-500">Email Support</div>
              <div className="text-sm font-medium text-slate-200 hover:text-orange-400">
                complaints@eci.gov.in
              </div>
            </div>
          </a>

          <a
            href="/chat"
            className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-orange-500/50 transition-colors"
            aria-label="Chat with the AI VoteSahayak assistant"
          >
            <MessageSquare className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <div>
              <div className="text-xs text-slate-500">AI Assistant</div>
              <div className="text-sm font-medium text-slate-200 hover:text-orange-400">
                Ask VoteSahayak
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
