import React from "react";
import { motion } from "motion/react";
import {
  Sun,
  Moon,
  Menu,
  Search,
  PlusCircle,
  Sparkles,
  Scan,
  Globe,
  Zap,
  Crown,
  Camera,
  Keyboard,
  QrCode,
  Users,
  LogOut,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Language } from "../types";

interface HeaderProps {
  onOpenMobileNav?: () => void;
  onOpenQuickInvoice?: () => void;
  onOpenBarcodeScanner?: () => void;
  onOpenShortcutsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileNav = () => {},
  onOpenQuickInvoice = () => {},
  onOpenBarcodeScanner = () => {},
  onOpenShortcutsModal = () => {},
}) => {
  const {
    theme,
    toggleTheme,
    profile,
    language,
    setLanguage,
    setIsAIDrawerOpen,
    setIsBillScannerOpen,
    setSearchQuery,
    searchQuery,
    adSettings,
    upgradeToPremium,
    setActiveTab,
    activeUserSession,
    logoutUser,
    currentUser,
  } = useApp();

  const getInitials = (name: string) => {
    if (!name) return "SB";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile Nav Button + Search Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-28 xs:w-36 sm:w-64 md:w-80 transition-all">
          <input
            id="global-header-search-input"
            type="text"
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            placeholder="Search invoice #, items... (Ctrl+K)"
            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 rounded-xl py-2 px-3 pl-8 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        {/* Barcode Quick Scanner Button */}
        <button
          onClick={onOpenBarcodeScanner}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
          title="Scan Product Barcode"
        >
          <Scan className="w-4 h-4 text-indigo-500" />
          <span className="hidden md:inline">Barcode</span>
        </button>

        {/* AI Bill Scanner Quick Button */}
        <button
          onClick={() => setIsBillScannerOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold transition-all shadow-sm"
          title="Scan Purchase Bill with AI"
        >
          <Camera className="w-4 h-4" />
          <span>Bill Scanner</span>
        </button>
      </div>

      {/* Right: Language Selector, Quick Actions, Theme Toggle, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language selector */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]">
          <Globe className="w-3.5 h-3.5 text-indigo-500 ml-1" />
          {(["en", "hi", "gu", "mr"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2 py-0.5 rounded-lg font-black uppercase transition-all ${
                language === lang
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Pro / Ad Badge */}
        {adSettings.isPremium ? (
          <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
            <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
            Pro Shop
          </span>
        ) : (
          <button
            onClick={upgradeToPremium}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-[10px] font-bold"
            title="Upgrade to Pro & Remove Ads"
          >
            <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>Go Pro</span>
          </button>
        )}

        {/* Quick Invoice Button */}
        <button
          onClick={onOpenQuickInvoice}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">New Sales Invoice</span>
        </button>

        {/* AI Assistant Drawer Trigger */}
        <button
          onClick={() => setIsAIDrawerOpen(true)}
          className="flex items-center gap-1 px-2.5 py-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 rounded-xl text-xs font-bold transition-colors border border-indigo-200 dark:border-indigo-800/60"
          title="Open AI Business Advisor"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="hidden lg:inline">AI Advisor</span>
        </button>

        {/* Multi-User QR Code Trigger Button */}
        <button
          onClick={() => setActiveTab("multi_user")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/80 rounded-xl transition-all border border-purple-200 dark:border-purple-800/80 cursor-pointer text-xs font-black shadow-2xs"
          title="Multi-User Access & QR Scanner"
        >
          <QrCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="hidden lg:inline">QR Scan</span>
        </button>

        {/* Keyboard Shortcuts Trigger Button */}
        <button
          onClick={onOpenShortcutsModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold"
          title="Keyboard Shortcuts Guide (Shift + ?)"
        >
          <Keyboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden xl:inline">Shortcuts</span>
        </button>

        {/* Theme Switcher Button (#global-header-theme-toggle) */}
        <motion.button
          id="global-header-theme-toggle"
          onClick={toggleTheme}
          whileTap={{ scale: 0.9, rotate: 15 }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 cursor-pointer"
          aria-label={`Switch to ${theme === "light" ? "Dark" : "Bright"} mode`}
          title={`Switch to ${theme === "light" ? "Dark" : "Bright"} mode`}
        >
          {theme === "light" ? (
            <>
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="hidden xl:inline text-xs font-bold text-amber-700 dark:text-amber-300">Bright Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              <span className="hidden xl:inline text-xs font-bold text-indigo-300">Dark Mode</span>
            </>
          )}
        </motion.button>

        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Business Profile Summary & Logout */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {profile.name || "Shree General Store"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[140px]">
              {currentUser?.email || profile.gstin || "N/A"}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white shadow-md flex items-center justify-center font-black text-xs">
            {getInitials(profile.name)}
          </div>
          <button
            onClick={logoutUser}
            className="p-1.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer ml-1"
            title="Log Out from Billing Pro+"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
