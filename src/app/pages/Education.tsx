/**
 * @file pages/Education.tsx
 * @description Voter Education page for VoteSahayak.
 *
 * Presents curated educational resources — video tutorials and helpful
 * articles — to help voters make informed decisions. Cards animate in with
 * a staggered entrance and highlight on hover.
 */

import React from "react";
import { PlayCircle, FileText, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import type { VideoEntry, ArticleEntry } from "@/types";

/** Curated video tutorial entries. */
const VIDEOS: VideoEntry[] = [
  { title: "How to use EVM & VVPAT", duration: "3:45", category: "Tutorial" },
  {
    title: "Understanding Model Code of Conduct",
    duration: "5:20",
    category: "Guidelines",
  },
  { title: "Rights of a Voter", duration: "4:15", category: "Awareness" },
];

/** Curated article entries. */
const ARTICLES: ArticleEntry[] = [
  { title: "Complete Guide to Form 6, 7 & 8", readTime: "5 min read" },
  {
    title: "What to do if your name is missing from the Electoral Roll?",
    readTime: "4 min read",
  },
  {
    title: "Facilities for PwD and Senior Citizens at Polling Booths",
    readTime: "6 min read",
  },
];

/**
 * Voter Education page component.
 *
 * Renders two columns: a video tutorials section and a helpful articles
 * section. All items have hover states and are keyboard-navigable.
 *
 * @returns The full voter education UI.
 */
export default function Education() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          Voter Education
        </h1>
        <p className="text-slate-400">
          Resources, tutorials, and guides to help you make an informed
          decision.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Video tutorials */}
        <section aria-labelledby="education-videos-heading">
          <h2
            id="education-videos-heading"
            className="text-xl font-bold text-slate-200 flex items-center gap-2 mb-4"
          >
            <PlayCircle className="w-5 h-5 text-orange-500" aria-hidden="true" />
            Video Tutorials
          </h2>
          <div className="space-y-4">
            {VIDEOS.map((video, idx) => (
              <motion.button
                key={video.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group flex gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 cursor-pointer transition-all w-full text-left"
                aria-label={`Play video: ${video.title} (${video.duration})`}
              >
                <div className="w-32 h-20 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden">
                  <PlayCircle
                    className="w-8 h-8 text-slate-400 group-hover:text-orange-500 group-hover:scale-110 transition-all z-10"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-semibold text-orange-500 mb-1">
                    {video.category}
                  </span>
                  <h3 className="text-sm font-medium text-slate-200 group-hover:text-orange-400 transition-colors line-clamp-2">
                    {video.title}
                  </h3>
                  <span className="text-xs text-slate-500 mt-2">
                    {video.duration}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Articles */}
        <section aria-labelledby="education-articles-heading">
          <h2
            id="education-articles-heading"
            className="text-xl font-bold text-slate-200 flex items-center gap-2 mb-4"
          >
            <FileText className="w-5 h-5 text-green-500" aria-hidden="true" />
            Helpful Articles
          </h2>
          <div className="space-y-4">
            {ARTICLES.map((article, idx) => (
              <motion.button
                key={article.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 cursor-pointer transition-all flex items-start justify-between gap-4 w-full text-left"
                aria-label={`Read article: ${article.title} — ${article.readTime}`}
              >
                <div>
                  <h3 className="text-base font-medium text-slate-200 group-hover:text-green-400 transition-colors mb-2">
                    {article.title}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {article.readTime}
                  </span>
                </div>
                <ExternalLink
                  className="w-5 h-5 text-slate-600 group-hover:text-green-500 shrink-0"
                  aria-hidden="true"
                />
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
