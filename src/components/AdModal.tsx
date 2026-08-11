import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, ShieldCheck, Zap, ArrowRight, ExternalLink } from "lucide-react";
import { useApp } from "../context/AppContext";

export const AdModal: React.FC = () => {
  const { showAdModal, setShowAdModal, upgradeToPremium } = useApp();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!showAdModal) return;
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showAdModal]);

  if (!showAdModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Close / Countdown button */}
          <div className="flex items-center justify-between mb-4">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300">
              Sponsored Advertisement
            </span>

            {countdown > 0 ? (
              <span className="text-xs font-semibold text-slate-400">
                Close in {countdown}s...
              </span>
            ) : (
              <button
                onClick={() => setShowAdModal(false)}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                <span>Skip Ad</span>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Ad Content */}
          <div className="text-center my-4 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <Zap className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Shree Smart POS & UPI Soundbox
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Get Instant Audio Payment Alerts in Hindi, English & Marathi on every customer UPI payment! Zero monthly rental fee for the first 12 months.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Loud Speaker for noisy retail counters</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Supports Paytm, PhonePe, Google Pay, BHIM</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Same day settlement directly into your bank</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 mt-6">
            <button
              onClick={() => {
                alert("Opening POS order request page...");
                setShowAdModal(false);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Order Soundbox for ₹299 (70% OFF)</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                upgradeToPremium();
                setShowAdModal(false);
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-center"
            >
              Remove Ads Forever (Go Pro)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
