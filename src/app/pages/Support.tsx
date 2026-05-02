import React from "react";
import { Phone, Mail, Globe, MessageSquare, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

export default function Support() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-3xl font-bold text-slate-100">Help & Support</h1>
        <p className="text-slate-400">Need assistance? Reach out to the official helplines or report issues directly.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-600/20 to-slate-900 border border-green-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-4"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <Phone className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">National Voter Helpline</h2>
            <p className="text-slate-400 text-sm mt-2">Available in Hindi, English, and regional languages</p>
          </div>
          <div className="text-4xl font-black text-green-500 tracking-wider font-mono my-4">
            1950
          </div>
          <button className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors">
            Call Now
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-500/20 to-slate-900 border border-orange-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-4"
        >
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Report a Violation</h2>
            <p className="text-slate-400 text-sm mt-2">Report Model Code of Conduct violations using cVIGIL</p>
          </div>
          <div className="text-lg font-bold text-slate-200 mt-4 mb-2">
            cVIGIL App
          </div>
          <button className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors">
            Download App
          </button>
        </motion.div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 mt-8">
        <h3 className="text-lg font-bold text-slate-200 mb-6">Other Ways to Connect</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <Globe className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Official Portal</div>
              <div className="text-sm font-medium text-slate-200 hover:text-orange-400 cursor-pointer">nvsp.in</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">Email Support</div>
              <div className="text-sm font-medium text-slate-200 hover:text-orange-400 cursor-pointer">complaints@eci.gov.in</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <MessageSquare className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-xs text-slate-500">AI Assistant</div>
              <div className="text-sm font-medium text-slate-200 hover:text-orange-400 cursor-pointer">Ask VoteSahayak</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
