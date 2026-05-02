/**
 * @file pages/Account.tsx
 * @description Professional user account and profile management page.
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { User, Shield, LogOut, Mail, Calendar, ExternalLink } from "lucide-react";
import { subscribeToAuthState, signOutCurrentUser } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";

export default function Account() {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    subscribeToAuthState((u) => setUser(u)).then(fn => { unsub = fn; });
    return () => unsub?.();
  }, []);

  const handleSignOut = async () => {
    await signOutCurrentUser();
    // Redirect is handled by RequireAuth in routes.tsx
  };

  if (!user) return null;

  return (
    <div className="space-y-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center gap-6 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-2xl shadow-orange-500/20">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-slate-800" />
          ) : (
            <User className="w-12 h-12" />
          )}
        </div>
        <div className="text-center md:text-left space-y-1 flex-1">
          <h1 className="text-3xl font-bold text-slate-100">{user.displayName || "VoteSahayak Citizen"}</h1>
          <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2">
            <Mail className="w-4 h-4" /> {user.email}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
            <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold uppercase tracking-wider">Verified Account</span>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">Citizen Level 1</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-2xl border border-red-500/20 transition-all active:scale-95"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <section className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" /> Security & Privacy
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-200">Account Authentication</p>
                  <p className="text-sm text-slate-400">Firebase Managed Identity</p>
                </div>
                <span className="text-xs text-green-500 bg-green-500/5 px-2 py-1 rounded-lg">Encrypted</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-200">Data Usage</p>
                  <p className="text-sm text-slate-400">Your chat history is private</p>
                </div>
                <button className="text-orange-500 text-sm hover:underline flex items-center gap-1">Manage <ExternalLink className="w-3 h-3" /></button>
              </div>
            </div>
          </section>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <section className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" /> Activity
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Member since: {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}</p>
              <p className="text-sm text-slate-400">Last login: {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : "N/A"}</p>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
