import React from "react";
import { motion } from "motion/react";
import { Calendar, Flag, Users, ShieldCheck, Megaphone } from "lucide-react";

const TIMELINE_EVENTS = [
  {
    date: "15th March",
    title: "Election Announcement",
    description: "The Election Commission of India (ECI) announces the schedule for the general elections.",
    icon: Megaphone,
    status: "completed"
  },
  {
    date: "25th March",
    title: "Filing of Nominations",
    description: "Last date for candidates to file their nomination papers for the upcoming phases.",
    icon: Users,
    status: "completed"
  },
  {
    date: "10th April",
    title: "Scrutiny of Nominations",
    description: "Verification of candidate documents and affidavits by the Returning Officer.",
    icon: ShieldCheck,
    status: "current"
  },
  {
    date: "19th April",
    title: "Phase 1 Polling",
    description: "First phase of voting commences across designated constituencies.",
    icon: Flag,
    status: "upcoming"
  },
  {
    date: "4th June",
    title: "Counting of Votes",
    description: "Votes are counted and results are officially declared by the ECI.",
    icon: Calendar,
    status: "upcoming"
  }
];

export default function Timeline() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Election Timeline</h1>
        <p className="text-slate-400">Track the schedule and key phases of the upcoming Indian General Elections.</p>
      </div>

      <div className="relative border-l-2 border-slate-800 ml-6 md:ml-8 space-y-12">
        {TIMELINE_EVENTS.map((event, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15 }}
            className="relative pl-8 md:pl-12"
          >
            {/* Timeline Dot */}
            <div className={`absolute -left-[21px] top-1 p-2 rounded-full border-4 border-slate-950 ${
              event.status === 'completed' ? 'bg-green-500' :
              event.status === 'current' ? 'bg-orange-500 animate-pulse' :
              'bg-slate-700'
            }`}>
              <event.icon className={`w-4 h-4 ${
                event.status === 'upcoming' ? 'text-slate-400' : 'text-white'
              }`} />
            </div>

            <div className={`bg-slate-900 border ${
              event.status === 'current' ? 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'border-slate-800'
            } rounded-2xl p-6 transition-transform hover:-translate-y-1`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                <h3 className="text-xl font-bold text-slate-100">{event.title}</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 w-fit">
                  {event.date}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {event.description}
              </p>
              
              {event.status === 'current' && (
                <div className="mt-4 inline-flex items-center text-sm font-medium text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2 animate-ping" />
                  Active Phase
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
