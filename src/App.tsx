import React, { useState, useEffect } from "react";
import { useApp } from "./context/AppContext";
import { WelcomeSplash } from "./components/WelcomeSplash";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Invoicing } from "./components/Invoicing";
import { Purchases } from "./components/Purchases";
import { Inventory } from "./components/Inventory";
import { PartyLedger } from "./components/PartyLedger";
import { Cashbook } from "./components/Cashbook";
import { DailyCashBook } from "./components/DailyCashBook";
import { Expenses } from "./components/Expenses";
import { Reports } from "./components/Reports";
import { BackupRestore } from "./components/BackupRestore";
import { Settings } from "./components/Settings";
import { AdManager } from "./components/AdManager";
import { MultiUserAccess } from "./components/MultiUserAccess";
import { AdBanner } from "./components/AdBanner";
import { InvoicePrintModal } from "./components/InvoicePrintModal";
import { AiAssistantDrawer } from "./components/AiAssistantDrawer";
import { AppLockModal } from "./components/AppLockModal";
import { AdModal } from "./components/AdModal";
import { BarcodeScannerModal } from "./components/BarcodeScannerModal";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { ScheduledBackupPromptModal } from "./components/ScheduledBackupPromptModal";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from "lucide-react";

export function App() {
  const {
    showSplash,
    activeTab,
    setActiveTab,
    printingInvoice,
    setPrintingInvoice,
    toast,
    setIsAIDrawerOpen,
    isAIDrawerOpen,
    isScheduledBackupPromptOpen,
    showToast,
  } = useApp();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showAdvisorBadge, setShowAdvisorBadge] = useState(true);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // 1. Shift + ? or Ctrl + / or Alt + H (Shortcuts Guide)
      if ((e.shiftKey && e.key === "?") || ((e.ctrlKey || e.metaKey) && e.key === "/") || (e.altKey && e.key.toLowerCase() === "h")) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 2. Ctrl + N / Cmd + N (New Invoice / Go to Invoicing)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setActiveTab("invoicing");
        showToast("Switched to Invoicing (Ctrl+N)", "success");
        return;
      }

      // 3. Ctrl + B / Cmd + B (Barcode Scanner)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsBarcodeScannerOpen(true);
        return;
      }

      // 4. Ctrl + K / Cmd + K (Focus Search)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-header-search-input");
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Navigation hotkeys (Alt + key when not typing inside an input)
      if (e.altKey && !isInput) {
        const key = e.key.toLowerCase();
        if (key === "d") {
          e.preventDefault();
          setActiveTab("dashboard");
          showToast("Switched to Dashboard (Alt+D)");
        } else if (key === "p") {
          e.preventDefault();
          setActiveTab("inventory");
          showToast("Switched to Stock Inventory (Alt+P)");
        } else if (key === "g") {
          e.preventDefault();
          setActiveTab("parties");
          showToast("Switched to Party Ledger (Alt+G)");
        } else if (key === "c") {
          e.preventDefault();
          setActiveTab("cashbook");
          showToast("Switched to Cashbook (Alt+C)");
        } else if (key === "r") {
          e.preventDefault();
          setActiveTab("reports");
          showToast("Switched to Reports (Alt+R)");
        } else if (key === "a") {
          e.preventDefault();
          setIsAIDrawerOpen(!isAIDrawerOpen);
        }
      }

      // Escape key to close active popups
      if (e.key === "Escape") {
        if (isShortcutsModalOpen) setIsShortcutsModalOpen(false);
        if (isBarcodeScannerOpen) setIsBarcodeScannerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveTab, setIsAIDrawerOpen, isAIDrawerOpen, isShortcutsModalOpen, isBarcodeScannerOpen, showToast]);

  // If splash is open, render Welcome Shutter Screen
  if (showSplash) {
    return <WelcomeSplash />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased transition-colors duration-200 pb-16 md:pb-0">
      {/* Security App Lock Protection */}
      <AppLockModal />

      {/* Interstitial Ad Modal */}
      <AdModal />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
      />

      {/* Power User Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Global Application Header */}
      <Header
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        onOpenQuickInvoice={() => setActiveTab("invoicing")}
        onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1 relative w-full">
        {/* Navigation Sidebar */}
        <Sidebar
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Dynamic Content Body Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {activeTab === "dashboard" && (
            <Dashboard
              onOpenQuickInvoice={() => setActiveTab("invoicing")}
              onOpenQuickCash={() => setActiveTab("cashbook")}
              onOpenPartyModal={() => setActiveTab("parties")}
            />
          )}
          {activeTab === "invoicing" && <Invoicing />}
          {activeTab === "purchases" && <Purchases />}
          {activeTab === "inventory" && <Inventory />}
          {(activeTab === "parties" || activeTab === "party_ledger") && <PartyLedger />}
          {activeTab === "cashbook" && <Cashbook />}
          {activeTab === "daily_cashbook" && <DailyCashBook />}
          {activeTab === "multi_user" && <MultiUserAccess />}
          {activeTab === "expenses" && <Expenses />}
          {activeTab === "reports" && <Reports />}
          {activeTab === "ad_manager" && <AdManager />}
          {activeTab === "backup" && <BackupRestore />}
          {activeTab === "settings" && <Settings />}

          {/* Global Bottom Ad Banner */}
          <div className="mt-8">
            <AdBanner location="bottom_banner" />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Floating AI Business Advisor Widget (bottom-right) */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-30 flex flex-col items-end gap-3 print:hidden">
        {showAdvisorBadge && (
          <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-4 w-64 border border-slate-200 dark:border-slate-800 relative group animate-fadeIn">
            <button
              onClick={() => setShowAdvisorBadge(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
              title="Dismiss advice"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                AI Business Advisor
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
              &quot;Based on your sales trends, consider reordering Wheat Flour before weekend demand.&quot;
            </p>
          </div>
        )}

        <button
          onClick={() => setIsAIDrawerOpen(!isAIDrawerOpen)}
          className="w-13 h-13 bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center text-white hover:scale-105 transition-transform active:scale-95"
          title="Open AI Business Advisor"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

      {/* Printable Invoice Modal */}
      {printingInvoice && (
        <InvoicePrintModal
          invoice={printingInvoice}
          onClose={() => setPrintingInvoice(null)}
        />
      )}

      {/* AI Chat Drawer */}
      <AiAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
      />

      {/* Automated Scheduled Backup Prompt Modal */}
      {isScheduledBackupPromptOpen && <ScheduledBackupPromptModal />}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-extrabold text-white ${
              toast.type === "success"
                ? "bg-emerald-600"
                : toast.type === "error"
                ? "bg-rose-600"
                : "bg-amber-600"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : toast.type === "error" ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
