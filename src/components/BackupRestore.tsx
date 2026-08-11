import React, { useState } from "react";
import {
  Database,
  HardDriveDownload,
  HardDriveUpload,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  CloudUpload,
  Clock,
  History,
  RotateCcw,
  Trash2,
  Download,
  Zap,
  Server,
  FileText,
  Package,
  Users,
  Check,
  Calendar,
  BellRing,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { CloudBackupPoint } from "../types";

export const BackupRestore: React.FC = () => {
  const {
    backupInfo,
    cloudBackupPoints,
    performBackupNow,
    createCloudBackup,
    restoreFromCloudBackup,
    deleteCloudBackup,
    toggleAutoBackup,
    setBackupFrequency,
    setIsScheduledBackupPromptOpen,
    importDataJson,
    resetAllData,
    showToast,
  } = useApp();

  const [selectedRestorePoint, setSelectedRestorePoint] = useState<CloudBackupPoint | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "auto_daily" | "manual_cloud" | "manual_export">("all");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const formatNextPromptDate = () => {
    if (!backupInfo.autoBackupEnabled || backupInfo.frequency === "manual") {
      return "Schedule Disabled";
    }
    const lastPrompt = backupInfo.lastScheduledDownloadPromptDate;
    if (!lastPrompt) {
      return "Due on Next Launch";
    }
    const lastTime = new Date(lastPrompt).getTime();
    if (isNaN(lastTime)) return "Due Now";

    const addMs = backupInfo.frequency === "daily" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const nextTime = new Date(lastTime + addMs);
    if (nextTime.getTime() <= Date.now()) {
      return "Due Now!";
    }
    return nextTime.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleManualCloudSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      createCloudBackup("manual_cloud", "Manual Cloud Database Snapshot", true);
      setIsSyncing(false);
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (window.confirm("Restoring data from file will replace your current active shop database. Are you sure?")) {
          importDataJson(content);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!selectedRestorePoint) return;
    const ok = restoreFromCloudBackup(selectedRestorePoint.id);
    if (ok) {
      setSelectedRestorePoint(null);
    }
  };

  const handleDownloadSnapshotFile = (point: CloudBackupPoint) => {
    const blob = new Blob([point.snapshotData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Shree_Backup_${point.type}_${point.timestamp.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded backup snapshot (${point.sizeKb})`, "success");
  };

  const filteredPoints = cloudBackupPoints.filter((pt) => {
    if (filterType === "all") return true;
    return pt.type === filterType;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Page Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Database className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Automated Cloud Backup & Restore Hub</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time daily sync when app launches, versioned restore points, and offline data safety.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualCloudSync}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing Cloud..." : "Create Cloud Sync Point"}</span>
          </button>

          <button
            type="button"
            onClick={performBackupNow}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>Export JSON File</span>
          </button>
        </div>
      </div>

      {/* Primary Status Banner: Automated Daily Cloud Backup */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Cloud className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Automated Daily Sync Engine Active</span>
              </span>
              <span className="text-xs text-indigo-200">
                Auto-triggers when app opens
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight">
              Cloud Business Data Protection
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                  Last Daily Sync
                </p>
                <p className="text-sm font-extrabold mt-0.5 truncate">
                  {backupInfo.lastBackupDate || "Today"}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                  Snapshot Size
                </p>
                <p className="text-sm font-extrabold mt-0.5">
                  {backupInfo.lastBackupSize || "142 KB"}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                  Restore Points
                </p>
                <p className="text-sm font-extrabold mt-0.5">
                  {cloudBackupPoints.length} Saved
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                  Auto-Sync Status
                </p>
                <p className="text-sm font-extrabold mt-0.5 text-emerald-300">
                  {backupInfo.autoBackupEnabled ? "ENABLED" : "DISABLED"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col items-center justify-center space-y-3 shrink-0">
            <div className="text-center">
              <p className="text-xs font-bold text-indigo-100">
                Automated Daily Sync
              </p>
              <p className="text-[10px] text-indigo-300">
                Triggers automatically on app startup
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleAutoBackup(!backupInfo.autoBackupEnabled)}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md cursor-pointer ${
                backupInfo.autoBackupEnabled
                  ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
              }`}
            >
              {backupInfo.autoBackupEnabled ? "✓ Auto Daily Backup Enabled" : "Enable Auto Daily Sync"}
            </button>
          </div>
        </div>
      </div>

      {/* Automated Backup Export Schedule & Prompt Settings Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Automated Backup Schedule & Export Prompt Settings
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                  Interval Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure an automated daily or weekly schedule that prompts you to download a fresh database export at specified intervals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScheduledBackupPromptOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold text-xs transition-all border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <BellRing className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span>Test Export Prompt Now</span>
            </button>
          </div>
        </div>

        {/* Schedule Frequency Selector Cards */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
            Select Backup Export Schedule Interval
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Daily Schedule Card */}
            <div
              onClick={() => setBackupFrequency("daily")}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                backupInfo.autoBackupEnabled && backupInfo.frequency === "daily"
                  ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-md"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl ${
                      backupInfo.autoBackupEnabled && backupInfo.frequency === "daily"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Daily Schedule
                    </h3>
                    <p className="text-[11px] text-slate-500">Every 24 Hours</p>
                  </div>
                </div>

                {backupInfo.autoBackupEnabled && backupInfo.frequency === "daily" && (
                  <span className="p-1 rounded-full bg-indigo-600 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Prompts you to download a fresh database snapshot every 24 hours on app launch. Ideal for busy daily retail shops.
              </p>
            </div>

            {/* Weekly Schedule Card */}
            <div
              onClick={() => setBackupFrequency("weekly")}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                backupInfo.autoBackupEnabled && backupInfo.frequency === "weekly"
                  ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-600 dark:border-purple-500 shadow-md"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl ${
                      backupInfo.autoBackupEnabled && backupInfo.frequency === "weekly"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Weekly Schedule
                    </h3>
                    <p className="text-[11px] text-slate-500">Every 7 Days</p>
                  </div>
                </div>

                {backupInfo.autoBackupEnabled && backupInfo.frequency === "weekly" && (
                  <span className="p-1 rounded-full bg-purple-600 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Prompts you for a fresh database download once every 7 days. Great for weekly audit procedures and low-volume stores.
              </p>
            </div>

            {/* Disabled / Manual Only Card */}
            <div
              onClick={() => setBackupFrequency("manual")}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                !backupInfo.autoBackupEnabled || backupInfo.frequency === "manual"
                  ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-600 dark:border-amber-500 shadow-md"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl ${
                      !backupInfo.autoBackupEnabled || backupInfo.frequency === "manual"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Manual Only
                    </h3>
                    <p className="text-[11px] text-slate-500">Disabled Schedule</p>
                  </div>
                </div>

                {(!backupInfo.autoBackupEnabled || backupInfo.frequency === "manual") && (
                  <span className="p-1 rounded-full bg-amber-600 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Disables interval download prompts. You can still export JSON database snapshots manually whenever required.
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Status & Metadata Metrics */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Export Schedule
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  backupInfo.autoBackupEnabled && backupInfo.frequency !== "manual"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-slate-400"
                }`}
              />
              <span>
                {backupInfo.autoBackupEnabled && backupInfo.frequency === "daily"
                  ? "Daily Prompt (24h)"
                  : backupInfo.autoBackupEnabled && backupInfo.frequency === "weekly"
                  ? "Weekly Prompt (7 days)"
                  : "Manual Only (Disabled)"}
              </span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Last Downloaded Prompt Date
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs block mt-0.5 truncate">
              {backupInfo.lastScheduledDownloadPromptDate
                ? new Date(backupInfo.lastScheduledDownloadPromptDate).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "Never Prompted Yet"}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Next Export Prompt Due
            </span>
            <span className="font-black text-indigo-600 dark:text-indigo-400 text-xs block mt-0.5">
              {formatNextPromptDate()}
            </span>
          </div>
        </div>
      </div>

      {/* Cloud Backup History & Restore Points Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Cloud Backup History & Version Restore Points
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select any historical point to restore full sales, products, and customer databases.
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: "All Snapshots" },
              { id: "auto_daily", label: "⚡ Auto Daily" },
              { id: "manual_cloud", label: "☁️ Manual Cloud" },
              { id: "manual_export", label: "📁 File Export" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterType === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Restore History List */}
        {filteredPoints.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <Cloud className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No Cloud Backup Points Found
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Automated backups will be created daily on app startup, or you can create one manually right now.
            </p>
            <button
              type="button"
              onClick={handleManualCloudSync}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Create First Cloud Backup Point
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPoints.map((point) => {
              const isAuto = point.type === "auto_daily";
              const isCloud = point.type === "manual_cloud";

              return (
                <div
                  key={point.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                        isAuto
                          ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                          : isCloud
                          ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                          : "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {isAuto ? (
                        <Zap className="w-5 h-5" />
                      ) : isCloud ? (
                        <Cloud className="w-5 h-5" />
                      ) : (
                        <HardDriveDownload className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isAuto
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                              : isCloud
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                          }`}
                        >
                          {isAuto ? "⚡ Automated Daily Sync" : isCloud ? "☁️ Manual Cloud Sync" : "📁 Local File Export"}
                        </span>

                        <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200">
                          {point.formattedDate}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          ({point.sizeKb})
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {point.label}
                      </p>

                      {/* Snapshot metrics pill */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          {point.invoicesCount} Invoices
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Package className="w-3.5 h-3.5 text-emerald-500" />
                          {point.productsCount} Products
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Users className="w-3.5 h-3.5 text-amber-500" />
                          {point.partiesCount} Customers
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          Sales: ₹{point.totalRevenue.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedRestorePoint(point)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Point</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadSnapshotFile(point)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                      title="Download JSON file for this point"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Remove this cloud backup restore point?")) {
                          deleteCloudBackup(point.id);
                        }
                      }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                      title="Delete restore point"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual File Import & Secondary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload External JSON Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <HardDriveUpload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Restore External File
              </h3>
              <p className="text-xs text-slate-500">Upload a saved .json database file</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Import an offline backup file saved from another device or prior session to restore your shop data.
          </p>

          <label className="block w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 text-indigo-600 dark:text-indigo-300 text-xs font-bold text-center cursor-pointer transition-all">
            <span>📁 Select .JSON Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Demo Data Reset Zone */}
        <div className="p-6 rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-4">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-base font-extrabold">Factory Sample Data Reset</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Revert all products, sales bills, and customer ledger entries back to the original seed demo database.
          </p>

          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-md hover:bg-rose-700 transition-all cursor-pointer"
            >
              Reset Demo Data
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 space-y-3">
              <p className="text-xs font-bold text-rose-600">
                Are you sure? Current active shop data will be reset.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetAllData();
                    setShowResetConfirm(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer"
                >
                  Yes, Reset All Data
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restore Point Confirmation Modal */}
      {selectedRestorePoint && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Confirm System Data Restore
                </h3>
                <p className="text-xs text-slate-500">
                  Restore point: {selectedRestorePoint.formattedDate}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Snapshot Content Summary
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-800 dark:text-slate-200">
                <div>• Invoices: {selectedRestorePoint.invoicesCount}</div>
                <div>• Products: {selectedRestorePoint.productsCount}</div>
                <div>• Customers: {selectedRestorePoint.partiesCount}</div>
                <div>• Revenue: ₹{selectedRestorePoint.totalRevenue.toLocaleString("en-IN")}</div>
              </div>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
              ⚠️ Warning: Restoring this backup will overwrite your current active shop database with the exact snapshot state from {selectedRestorePoint.formattedDate}.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRestorePoint(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Confirm & Restore Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
