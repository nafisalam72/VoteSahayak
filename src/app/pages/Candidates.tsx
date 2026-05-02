import React, { useState } from "react";
import { Search, User, Briefcase, GraduationCap, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

const MOCK_CANDIDATES = [
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
  }
];

export default function Candidates() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = MOCK_CANDIDATES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.party.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Know Your Candidates</h1>
          <p className="text-slate-400">Review affidavits, education, and background details of candidates in your constituency.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search candidate or party..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((candidate, idx) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-700 transition-colors"
          >
            <div className={`h-2 ${candidate.color}`} />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{candidate.name}</h3>
                  <p className="text-sm font-medium text-slate-400">{candidate.party}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800 text-sm">
                <div className="flex items-start gap-3 text-slate-300">
                  <GraduationCap className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <span className="text-slate-500 block text-xs">Education</span>
                    {candidate.education}
                  </div>
                </div>
                <div className="flex items-start gap-3 text-slate-300">
                  <Briefcase className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <span className="text-slate-500 block text-xs">Profession</span>
                    {candidate.profession} (Age: {candidate.age})
                  </div>
                </div>
                <div className="flex items-start gap-3 text-slate-300">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 ${candidate.cases > 0 ? 'text-orange-500' : 'text-green-500'}`} />
                  <div>
                    <span className="text-slate-500 block text-xs">Criminal Cases</span>
                    <span className={candidate.cases > 0 ? 'text-orange-400' : 'text-green-400'}>
                      {candidate.cases} pending
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700">
                View Full Affidavit
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No candidates found matching your search.
        </div>
      )}
    </div>
  );
}
