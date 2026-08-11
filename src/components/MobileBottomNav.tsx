import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Package,
  MoreHorizontal,
  Users,
  Receipt,
  BarChart3,
  Database,
  Settings as SettingsIcon,
  HelpCircle,
  X,
  Globe,
  Lock,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ActiveTab, Language } from "../types";

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, language, setLanguage, t } = useApp();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "invoicing", label: "Sales", icon: FileText },
    { id: "purchases", label: "Purchase", icon: ShoppingBag },
    { id: "inventory", label: "Stock", icon: Package },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Fixed Bottom Navigation Bar on Mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around print:hidden shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !isMoreOpen;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-bold scale-105"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            isMoreOpen || ["parties", "cashbook", "expenses", "reports", "backup", "settings"].includes(activeTab)
              ? "text-indigo-600 dark:text-indigo-400 font-bold"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>

      {/* More Bottom Sheet Drawer */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[80vh] overflow-y-auto animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                More Business Modules
              </h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Language switcher */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  App Language:
                </span>
              </div>
              <div className="flex gap-1">
                {(["en", "hi", "gu", "mr"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      language === lang
                        ? "bg-indigo-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of More links */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleSelectTab("parties")}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left flex items-center gap-3"
              >
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Customers & Vendors</p>
                  <p className="text-[10px] text-slate-400">Ledger & Udhaar</p>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab("expenses")}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left flex items-center gap-3"
              >
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Expenses</p>
                  <p className="text-[10px] text-slate-400">Rent, Salary & Bills</p>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab("daily_cashbook")}
                className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-left flex items-center gap-3 col-span-2"
              >
                <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-purple-900 dark:text-purple-200">Daily Cash Book</p>
                  <p className="text-[10px] text-purple-700 dark:text-purple-300">Cheque, Cash, GPay, GST GPay & Vendor Payments</p>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab("cashbook")}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left flex items-center gap-3"
              >
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Cashbook</p>
                  <p className="text-[10px] text-slate-400">Cash In & Out</p>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab("reports")}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left flex items-center gap-3"
              >
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Reports</p>
                  <p className="text-[10px] text-slate-400">P&L & GST Returns</p>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab("backup")}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left flex items-center gap-3"
              >
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Backup & Restore</p>
                  <p className="text-[10px] text-slate-400">Download & Cloud</p>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab("settings")}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left flex items-center gap-3"
              >
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Settings</p>
                  <p className="text-[10px] text-slate-400">Business & Security</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
