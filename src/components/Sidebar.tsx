import React from "react";
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Package,
  Users,
  Wallet,
  Receipt,
  BarChart3,
  Database,
  Settings,
  X,
  Sparkles,
  ShieldCheck,
  Building,
  Sun,
  Moon,
  Megaphone,
  BookOpen,
  QrCode,
  UserCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ActiveTab } from "../types";

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile = () => {},
}) => {
  const { activeTab, setActiveTab, products, parties, invoices, purchases, advertisements, setIsAIDrawerOpen, theme, toggleTheme, t } = useApp();

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "invoicing",
      label: "Sales & Invoices",
      icon: FileText,
      badge: invoices.length,
      badgeColor: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300",
    },
    {
      id: "purchases",
      label: "Stock Purchases",
      icon: ShoppingBag,
      badge: purchases.length,
      badgeColor: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
    },
    {
      id: "inventory",
      label: "Stock & Inventory",
      icon: Package,
      badge: products.filter((p) => p.stockQuantity <= p.reorderLevel).length || undefined,
      badgeColor: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse",
    },
    {
      id: "parties",
      label: "Customers & Vendors",
      icon: Users,
      badge: parties.length,
      badgeColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    {
      id: "expenses",
      label: "Shop Expenses",
      icon: Receipt,
    },
    {
      id: "cashbook",
      label: "Cashbook & Payments",
      icon: Wallet,
    },
    {
      id: "daily_cashbook",
      label: "Daily Cash Book",
      icon: BookOpen,
      badge: "5 Types",
      badgeColor: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 font-bold",
    },
    {
      id: "multi_user",
      label: "Multi-User Access",
      icon: UserCheck,
      badge: "QR Scan",
      badgeColor: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 font-bold",
    },
    {
      id: "reports",
      label: "Reports & GST",
      icon: BarChart3,
    },
    {
      id: "ad_manager",
      label: "Ad Manager",
      icon: Megaphone,
      badge: advertisements.filter((a) => a.isActive).length,
      badgeColor: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
    },
    {
      id: "backup",
      label: "Backup & Restore",
      icon: Database,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  const handleSelect = (id: ActiveTab) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-950">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 dark:text-white leading-tight">Shree Shop</span>
            <span className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">Business Book v2.0</span>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : item.badgeColor || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Advisor Banner */}
      <div className="px-3 py-2">
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 rounded-2xl p-3 text-white relative overflow-hidden border border-indigo-800/40 shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">AI Business Advisor</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-snug mb-2">
              GST guidance, stock optimization & tax advice.
            </p>
            <button
              onClick={() => {
                setIsAIDrawerOpen(true);
                onCloseMobile();
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              Ask AI Assistant
            </button>
          </div>
        </div>
      </div>

      {/* Theme Mode Selector Pill */}
      <div className="px-3 py-1.5">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {theme === "light" ? (
              <>
                <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Bright Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400" />
                <span>Dark Mode</span>
              </>
            )}
          </span>
          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            {theme === "light" ? "Light" : "Dark"}
          </span>
        </button>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-900 rounded-xl p-3 text-white relative overflow-hidden flex items-center justify-between text-xs">
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Storage Engine</p>
            <p className="text-xs font-bold text-emerald-400">Offline-First Synced</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Permanent Left Sidebar on Desktop */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 flex-shrink-0 z-20">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-full h-full z-10 shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
