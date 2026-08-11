import React from "react";
import {
  HardDriveDownload,
  Calendar,
  Clock,
  ShieldCheck,
  X,
  FileText,
  Package,
  Users,
  BellRing,
  Sparkles,
  Database,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export const ScheduledBackupPromptModal: React.FC = () => {
  const {
    backupInfo,
    invoices,
    products,
    parties,
    exportDataJson,
    triggerScheduledBackupDownload,
    dismissScheduledBackupPrompt,
  } = useApp();

  const jsonStr = exportDataJson();
  const sizeKb = (jsonStr.length / 1024).toFixed(1) + " KB";
  const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

  const frequencyLabel =
    backupInfo.frequency === "weekly" ? "Weekly" : "Daily";

  const lastPromptFormatted = backupInfo.lastScheduledDownloadPromptDate
    ? new Date(backupInfo.lastScheduledDownloadPromptDate).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "First Scheduled Backup";

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-scaleIn">
        {/* Top Decorative Header */}
        <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Database className="w-48 h-48 text-white" />
          </div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Automated {frequencyLabel} Schedule Export</span>
                </span>
                <h2 className="text-xl font-black tracking-tight text-white">
                  Database Export Reminder
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissScheduledBackupPrompt}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white transition-colors cursor-pointer"
              title="Close & Snooze"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-indigo-100/90 mt-3 relative z-10 leading-relaxed font-medium">
            Your configured <span className="font-black text-emerald-300 underline underline-offset-2">{frequencyLabel}</span> backup interval has elapsed.
            Download a fresh offline JSON export file now to keep your business records safe and up to date.
          </p>
        </div>

        {/* Modal Body: Stats & Snapshot Preview */}
        <div className="p-6 space-y-5">
          {/* Quick Details Pill */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Current Schedule
              </span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-4 h-4" />
                <span>{frequencyLabel} Export</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Last Downloaded
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5 truncate">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{lastPromptFormatted}</span>
              </span>
            </div>
          </div>

          {/* Database Content Summary Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Fresh Snapshot Content</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[10px] font-mono font-bold">
                {sizeKb}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-100/60 dark:border-slate-800">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>{invoices.length} Invoices</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-100/60 dark:border-slate-800">
                <Package className="w-3.5 h-3.5 text-emerald-500" />
                <span>{products.length} Products</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-100/60 dark:border-slate-800">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>{parties.length} Parties</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-100/60 dark:border-slate-800 font-bold text-emerald-600 dark:text-emerald-400">
                <span>₹{totalRevenue.toLocaleString("en-IN")} Sales</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              Downloading saves a standalone <strong>.JSON</strong> database file to your device and logs a versioned cloud snapshot.
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={dismissScheduledBackupPrompt}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Snooze / Remind Later
          </button>

          <button
            type="button"
            onClick={triggerScheduledBackupDownload}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>Download Fresh Backup (.json)</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
};
