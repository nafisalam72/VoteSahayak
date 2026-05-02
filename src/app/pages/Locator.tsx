/**
 * @file pages/Locator.tsx
 * @description Polling Station Locator page for VoteSahayak.
 */

import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Map, Search, Navigation2, Info } from "lucide-react";
import { isValidLocatorQuery, sanitizeLocatorQuery } from "@/lib/security";

export default function Locator() {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const handleSearch = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = sanitizeLocatorQuery(search);
    if (!trimmed) return;
    if (!isValidLocatorQuery(trimmed)) {
      setInputError("Please enter a valid EPIC number or pincode.");
      return;
    }
    setSearch(trimmed);
    setInputError(null);
    setIsSearching(true);
    setResult(false);
    setTimeout(() => {
      setIsSearching(false);
      setResult(true);
    }, 1500);
  }, [search]);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <div className="flex-none space-y-1">
        <h1 className="text-3xl font-bold text-slate-100">Polling Station Locator</h1>
        <p className="text-slate-400">Find your designated polling booth using your EPIC number or address.</p>
      </div>

      <div className="flex-none bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4" aria-label="Polling station search form">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" aria-hidden="true" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Enter EPIC No. or Pincode" className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 transition-all" />
          </div>
          <button type="submit" disabled={isSearching || !search.trim()} className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors shadow-lg shadow-orange-500/20 min-w-[140px]">
            {isSearching ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Locate"}
          </button>
        </form>
        {inputError && <p className="mt-2 text-sm text-red-400" role="alert">{inputError}</p>}
      </div>

      <div className="flex-1 relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden" aria-label="Map area">
        <div className="absolute inset-0 bg-[#0F172A] opacity-50" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        {!result && !isSearching && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <Map className="w-16 h-16 mb-4 opacity-20" />
            <p>Enter details above to locate your polling station</p>
          </div>
        )}
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center" aria-live="polite">
            <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><div className="w-8 h-8 bg-green-500/20 rounded-full animate-ping" /></div>
              <Navigation2 className="w-8 h-8 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="absolute top-12 left-1/2 -translate-x-1/2 w-80 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-5" role="region" aria-label="Station details">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-green-500/10 rounded-lg"><Info className="w-5 h-5 text-green-500" /></div>
                  <div><h2 className="font-semibold text-slate-100">Govt. Senior Secondary School</h2><p className="text-xs text-slate-400 mt-1">Room No. 4, Ground Floor</p></div>
                </div>
                <dl className="pt-3 border-t border-slate-800 space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between"><dt className="text-slate-500">Booth No:</dt><dd className="font-medium text-slate-200">142</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Distance:</dt><dd className="font-medium text-slate-200">1.2 km</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Wait Time:</dt><dd className="font-medium text-green-400">~15 mins</dd></div>
                </dl>
                <button className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700">Get Directions</button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
