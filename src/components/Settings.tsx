import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  Landmark,
  FileCheck,
  Download,
  Upload,
  CheckCircle,
  Lock,
  Monitor,
  Moon,
  Sun,
  Globe,
  Crown,
  Bell,
  Database,
  HelpCircle,
  Info,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  PhoneCall,
  MessageSquare,
  Sparkles,
  Zap,
  KeyRound,
  ShieldCheck,
  Printer,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { InvoiceTemplate, Language } from "../types";
import { CAMonthlySummary } from "./CAMonthlySummary";

export const Settings: React.FC = () => {
  const {
    profile,
    updateProfile,
    exportDataJson,
    importDataJson,
    performBackupNow,
    showToast,
    appLock,
    setPin,
    toggleAppLock,
    language,
    setLanguage,
    adSettings,
    upgradeToPremium,
    invoiceTemplate,
    setInvoiceTemplate,
    resetAllData,
    theme,
    toggleTheme,
    logAudit,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    | "profile"
    | "ca_summary"
    | "invoice"
    | "desktop"
    | "security"
    | "theme_lang"
    | "ads"
    | "notifications"
    | "backup"
    | "help"
    | "about"
  >("profile");

  const [form, setForm] = useState(profile);

  // Desktop Access State
  const [desktopEnabled, setDesktopEnabled] = useState<boolean>(() => {
    return localStorage.getItem("shree_desktop_enabled") === "true";
  });
  const [pairingCode, setPairingCode] = useState<string>(() => {
    return localStorage.getItem("shree_pairing_code") || "SHREE-8492-DESK";
  });
  const [connectedDevices, setConnectedDevices] = useState<
    { id: string; name: string; ip: string; connectedAt: string }[]
  >(() => {
    const saved = localStorage.getItem("shree_desktop_sessions");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "dev-1",
            name: "Chrome Browser on Windows 11",
            ip: "192.168.1.104",
            connectedAt: "Today at 10:15 AM",
          },
        ];
  });

  // Security Lock State
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  // Notification Toggles State
  const [notifications, setNotifications] = useState({
    lowStock: true,
    paymentDue: true,
    backupReminder: true,
    dailySummary: false,
  });

  const handleProfileChange = (field: keyof typeof profile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(form);
  };

  const toggleDesktop = (enabled: boolean) => {
    setDesktopEnabled(enabled);
    localStorage.setItem("shree_desktop_enabled", enabled ? "true" : "false");
    if (enabled) {
      const newCode = `SHREE-${Math.floor(1000 + Math.random() * 9000)}-DESK`;
      setPairingCode(newCode);
      localStorage.setItem("shree_pairing_code", newCode);
      showToast("Desktop Access Activated. Ready for pairing.", "success");
      logAudit("Desktop Access", "Settings", "Enabled Desktop Bridge");
    } else {
      setConnectedDevices([]);
      localStorage.removeItem("shree_desktop_sessions");
      showToast("Desktop Access Disabled & All Sessions Terminated", "info");
      logAudit("Desktop Access", "Settings", "Disabled Desktop Bridge");
    }
  };

  const regeneratePairingCode = () => {
    const newCode = `SHREE-${Math.floor(1000 + Math.random() * 9000)}-DESK`;
    setPairingCode(newCode);
    localStorage.setItem("shree_pairing_code", newCode);
    showToast("New Pairing Code generated", "success");
  };

  const disconnectDevice = (id: string) => {
    const updated = connectedDevices.filter((d) => d.id !== id);
    setConnectedDevices(updated);
    localStorage.setItem("shree_desktop_sessions", JSON.stringify(updated));
    showToast("Device session disconnected", "info");
  };

  const revokeAllAccess = () => {
    setConnectedDevices([]);
    localStorage.removeItem("shree_desktop_sessions");
    showToast("Revoked all connected desktop sessions", "warning");
  };

  const handleSetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 4 || !/^\d+$/.test(pinInput)) {
      showToast("PIN must be exactly 4 numeric digits", "error");
      return;
    }
    if (pinInput !== pinConfirm) {
      showToast("PIN confirmation does not match", "error");
      return;
    }
    setPin(pinInput);
    setPinInput("");
    setPinConfirm("");
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const success = importDataJson(content);
          if (success) {
            showToast("Data restored successfully!", "success");
          }
        } catch {
          showToast("Invalid JSON backup file", "error");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetConfirm = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all shop data? This will restore sample default products and transactions."
      )
    ) {
      resetAllData();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-indigo-600" />
            <span>Settings & Business Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage profile, invoice templates, desktop access, PIN lock, backups & preferences
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={performBackupNow}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800"
          >
            <Download className="w-4 h-4" />
            <span>Backup Data</span>
          </button>
        </div>
      </div>

      {/* Main Settings Section Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Sub-Navigation Sidebar */}
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0 gap-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit">
          {[
            { id: "profile", label: "Business Profile", icon: Building2 },
            { id: "ca_summary", label: "CA Monthly Summary", icon: FileCheck, badge: "GST" },
            { id: "invoice", label: "Invoice Settings", icon: Printer },
            { id: "desktop", label: "Desktop Access", icon: Monitor, badge: desktopEnabled ? "ON" : "OFF" },
            { id: "security", label: "App Lock & PIN", icon: Lock, badge: appLock.enabled ? "Active" : "Off" },
            { id: "theme_lang", label: "Theme & Language", icon: Globe },
            { id: "ads", label: "Premium & Ads", icon: Crown, badge: adSettings.isPremium ? "Pro" : "Free" },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "backup", label: "Backup & Restore", icon: Database },
            { id: "help", label: "Help & Support", icon: HelpCircle },
            { id: "about", label: "About Application", icon: Info },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex-shrink-0 md:w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      isActive
                        ? "bg-indigo-500 text-white"
                        : item.badge === "ON" || item.badge === "Active" || item.badge === "Pro"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* TAB: CA MONTHLY SUMMARY */}
          {activeTab === "ca_summary" && <CAMonthlySummary />}

          {/* TAB 1: BUSINESS PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Company Identity & GST Registration</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Shop / Business Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleProfileChange("name", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      GSTIN Number (15 Digits)
                    </label>
                    <input
                      type="text"
                      value={form.gstin}
                      onChange={(e) => handleProfileChange("gstin", e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-indigo-600 dark:text-indigo-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={form.pan}
                      onChange={(e) => handleProfileChange("pan", e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleProfileChange("email", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      State / Place of Supply
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => handleProfileChange("state", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Full Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleProfileChange("address", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  <span>Bank & UPI Details for Invoice QR Printing</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={(e) => handleProfileChange("bankName", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={form.accountNumber}
                      onChange={(e) => handleProfileChange("accountNumber", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={form.ifscCode}
                      onChange={(e) => handleProfileChange("ifscCode", e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      UPI ID (VPA) for QR Code
                    </label>
                    <input
                      type="text"
                      value={form.upiId}
                      onChange={(e) => handleProfileChange("upiId", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-indigo-600 dark:text-indigo-400"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Profile & Bank Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: INVOICE SETTINGS & TEMPLATES */}
          {activeTab === "invoice" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>Invoice Customization & Prefix</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Invoice Prefix
                    </label>
                    <input
                      type="text"
                      value={form.invoicePrefix}
                      onChange={(e) => handleProfileChange("invoicePrefix", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Sample Next Invoice #
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`${form.invoicePrefix}0004`}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 text-xs">
                    Select Printable Invoice Theme & Layout Template
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "modern", label: "Modern GST", desc: "Sleek blue banner with itemized GST breakdown" },
                      { id: "classic", label: "Classic Tax Invoice", desc: "Traditional border format for official trade" },
                      { id: "thermal", label: "Thermal POS (3-Inch)", desc: "Compact receipt format for quick retail counters" },
                    ].map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setInvoiceTemplate(tpl.id as InvoiceTemplate)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          invoiceTemplate === tpl.id
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {tpl.label}
                          </span>
                          {invoiceTemplate === tpl.id && (
                            <CheckCircle className="w-4 h-4 text-indigo-600" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{tpl.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Invoice Terms & Conditions / Declaration
                  </label>
                  <textarea
                    value={form.termsAndConditions}
                    onChange={(e) => handleProfileChange("termsAndConditions", e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans leading-relaxed"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => updateProfile(form)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                  >
                    Save Invoice Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESKTOP ACCESS */}
          {activeTab === "desktop" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-indigo-600" />
                      <span>Desktop Access Companion</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Manage shop data from any PC / Laptop web browser in real-time
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Desktop Bridge:
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleDesktop(!desktopEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        desktopEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          desktopEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {desktopEnabled ? (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Temporary Pairing Code Card */}
                      <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                            Pairing Code
                          </span>
                          <button
                            onClick={regeneratePairingCode}
                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Regenerate
                          </button>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 text-center">
                          <span className="text-2xl font-black font-mono tracking-widest text-indigo-600 dark:text-indigo-300">
                            {pairingCode}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-snug">
                          Open web browser on your PC, navigate to desktop portal and enter this 8-character pairing key.
                        </p>
                      </div>

                      {/* QR Code Pairing Preview */}
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-4">
                        <div className="w-24 h-24 bg-white p-2 rounded-xl shadow-md flex items-center justify-center border border-slate-200">
                          <QrCode className="w-20 h-20 text-slate-900" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                            <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            Local Sync Bridge Ready
                          </span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Scan QR code with desktop webcam or phone camera to establish direct encrypted WebRTC socket session.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Connected Devices List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                          Active Desktop Sessions ({connectedDevices.length})
                        </h4>
                        {connectedDevices.length > 0 && (
                          <button
                            onClick={revokeAllAccess}
                            className="text-xs text-rose-600 hover:underline font-bold"
                          >
                            Revoke All Sessions
                          </button>
                        )}
                      </div>

                      {connectedDevices.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                          No desktop sessions active currently.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {connectedDevices.map((dev) => (
                            <div
                              key={dev.id}
                              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <Monitor className="w-5 h-5 text-indigo-500" />
                                <div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {dev.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    IP: {dev.ip} • {dev.connectedAt}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => disconnectDevice(dev.id)}
                                className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-[11px] hover:bg-rose-200"
                              >
                                Disconnect
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
                    <WifiOff className="w-10 h-10 text-slate-400 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Desktop Access is OFF
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Toggle the switch above to enable real-time local web pairing with your desktop browser.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: APP LOCK & SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Security & App Lock Protection</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Protect confidential financial ledgers and sales numbers with a 4-digit PIN lock
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleAppLock(!appLock.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      appLock.enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        appLock.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {appLock.enabled && (
                  <form onSubmit={handleSetPinSubmit} className="space-y-4 max-w-md animate-fadeIn">
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <KeyRound className="w-5 h-5 shrink-0" />
                      <span>
                        Master Emergency Reset PIN: <strong className="font-mono">1234</strong>
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Enter 4-Digit Security PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center tracking-widest text-lg font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm 4-Digit Security PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={pinConfirm}
                        onChange={(e) => setPinConfirm(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center tracking-widest text-lg font-bold"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
                    >
                      Update Security PIN
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: THEME & LOCALIZATION */}
          {activeTab === "theme_lang" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>Display Theme & Application Language</span>
                </h3>

                {/* Theme Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Color Theme Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                    <button
                      type="button"
                      onClick={() => theme === "dark" && toggleTheme()}
                      className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        theme === "light"
                          ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500 shadow-md"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center">
                          <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400 fill-amber-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white">Bright (Light) Mode</p>
                          <p className="text-[10px] text-slate-500">High contrast light background</p>
                        </div>
                      </div>
                      {theme === "light" && <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => theme === "light" && toggleTheme()}
                      className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        theme === "dark"
                          ? "border-indigo-500 bg-indigo-950/60 ring-2 ring-indigo-500 shadow-md"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-900/80 flex items-center justify-center">
                          <Moon className="w-5 h-5 text-indigo-400 fill-indigo-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white">Dark Mode</p>
                          <p className="text-[10px] text-slate-500">Eye-safe slate-950 canvas</p>
                        </div>
                      </div>
                      {theme === "dark" && <CheckCircle className="w-5 h-5 text-indigo-400" />}
                    </button>
                  </div>
                </div>

                {/* Language Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Supported Regional Language
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { code: "en", label: "English", sub: "Default" },
                      { code: "hi", label: "हिंदी", sub: "Hindi" },
                      { code: "gu", label: "ગુજરાતી", sub: "Gujarati" },
                      { code: "mr", label: "मराठी", sub: "Marathi" },
                    ].map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setLanguage(item.code as Language)}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          language === item.code
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-slate-400">{item.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PREMIUM & ADS */}
          {activeTab === "ads" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      <span>Shree Pro Subscription & Advertisements</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Ad-Free experience, cloud multi-device sync & priority AI support
                    </p>
                  </div>

                  {adSettings.isPremium ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase">
                      Pro Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-black uppercase">
                      Free Version
                    </span>
                  )}
                </div>

                {!adSettings.isPremium ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white space-y-4">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-widest">
                      <Zap className="w-4 h-4 fill-amber-300" />
                      Upgrade to Pro Lifetime
                    </div>
                    <h4 className="text-lg font-black leading-tight">
                      Remove All Banners & Interstitial Ads Forever
                    </h4>
                    <ul className="text-xs space-y-2 text-slate-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        100% Ad-Free Billing & Inventory Management
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Unlimited AI Business Advisor Queries
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Multi-Device Web PC Bridge
                      </li>
                    </ul>

                    <button
                      onClick={upgradeToPremium}
                      className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition-transform active:scale-95"
                    >
                      Upgrade to Pro (₹499 One-time)
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 shrink-0 text-emerald-500" />
                    <div>
                      <p className="font-bold">You are on the Pro Ad-Free Plan!</p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        All interstitial ad transitions and bottom banner ads are deactivated for your business account.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Bell className="w-4 h-4 text-indigo-600" />
                  <span>Notification Preferences</span>
                </h3>

                <div className="space-y-3">
                  {[
                    {
                      key: "lowStock",
                      label: "Low Stock & Reorder Alerts",
                      desc: "Show toast notification when items reach minimum stock level",
                    },
                    {
                      key: "paymentDue",
                      label: "Customer Udhaar Reminders",
                      desc: "Alert when customer credit balances cross 30 days",
                    },
                    {
                      key: "backupReminder",
                      label: "Daily Data Backup Reminder",
                      desc: "Prompt to download JSON database backup daily",
                    },
                  ].map((item) => {
                    const isChecked = notifications[item.key as keyof typeof notifications];
                    return (
                      <div
                        key={item.key}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setNotifications((prev) => ({
                              ...prev,
                              [item.key]: !isChecked,
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            isChecked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isChecked ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: BACKUP & RESTORE */}
          {activeTab === "backup" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Database Backup, Restore & Reset</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-600" />
                      <span>Export Full Backup</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Download full offline database JSON file containing all products, invoices, stock logs and customer ledgers.
                    </p>
                    <button
                      onClick={performBackupNow}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md"
                    >
                      Download Backup (.JSON)
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-purple-600" />
                      <span>Restore From File</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Restore previously exported JSON backup file into local database.
                    </p>
                    <label className="block w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold text-center cursor-pointer shadow-md">
                      <span>Select Backup JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileRestore}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    <span>Danger Zone: Factory Data Reset</span>
                  </h4>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 leading-snug">
                    Resets all products, sales invoices, cash entries, and customer balances back to default sample state.
                  </p>
                  <button
                    onClick={handleResetConfirm}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                  >
                    Reset Factory Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: HELP & SUPPORT */}
          {activeTab === "help" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Help Center & Frequently Asked Questions</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href="tel:+919876543210"
                    className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    <PhoneCall className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p>Call Support Helpline</p>
                      <p className="text-[10px] text-emerald-600 font-mono">+91 98765 43210</p>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/919876543210?text=Hello%20Shree%20Support%20Team"
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3 text-indigo-800 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p>WhatsApp Live Chat</p>
                      <p className="text-[10px] text-indigo-600 font-mono">Instant Resolution</p>
                    </div>
                  </a>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Common Questions
                  </h4>

                  {[
                    {
                      q: "How do I print a 3-inch thermal POS receipt?",
                      a: "Navigate to Settings > Invoice Settings, select 'Thermal POS (3-Inch)', and click 'New Sales Invoice' to preview.",
                    },
                    {
                      q: "How does Desktop Access work?",
                      a: "Turn ON Desktop Access in Settings > Desktop Access, open the portal on your PC browser, and enter the generated pairing code.",
                    },
                    {
                      q: "Will my data remain safe if offline?",
                      a: "Yes, Shree Shop uses an offline-first IndexedDB/LocalStorage sync engine. All data is saved on your device locally.",
                    },
                  ].map((faq, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs"
                    >
                      <p className="font-bold text-slate-900 dark:text-white">{faq.q}</p>
                      <p className="text-slate-500 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: ABOUT */}
          {activeTab === "about" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                    S
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Shree Shop Business Book Pro
                    </h3>
                    <p className="text-xs text-indigo-600 font-bold">Version 2.0.0 (GST Ready)</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Shree Shop is an all-in-one GST Billing, Stock Inventory Management, Cashbook Accounting & Udhaar Ledger suite engineered specifically for Indian retail shops, wholesalers, general stores, and traders.
                </p>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
                  <p className="text-slate-700 dark:text-slate-300">
                    Engine: <span className="text-emerald-500">React 18 + Vite + Tailwind CSS</span>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    Storage: <span className="text-indigo-500">Offline-First Encrypted Storage</span>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    AI Advisor: <span className="text-amber-500">Gemini Pro Business Neural Engine</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
