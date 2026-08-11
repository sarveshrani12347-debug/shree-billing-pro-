import React from "react";
import { Keyboard, X, Zap, ArrowRight, CornerDownLeft, Sparkles } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: "Billing & Sales" | "Navigation" | "Inventory & Tools" | "System";
}

const SHORTCUTS: ShortcutItem[] = [
  // Billing & Sales
  {
    keys: ["Ctrl", "N"],
    description: "Create New Invoice / Open Invoicing Screen",
    category: "Billing & Sales",
  },
  {
    keys: ["Ctrl", "B"],
    description: "Launch Live Camera Barcode & SKU Scanner",
    category: "Billing & Sales",
  },
  {
    keys: ["Alt", "C"],
    description: "Open Cashbook & Record Cash In/Out",
    category: "Billing & Sales",
  },

  // Navigation
  {
    keys: ["Alt", "D"],
    description: "Jump to Dashboard",
    category: "Navigation",
  },
  {
    keys: ["Alt", "P"],
    description: "Jump to Product & Inventory Manager",
    category: "Navigation",
  },
  {
    keys: ["Alt", "G"],
    description: "Jump to Customer & Party Ledger",
    category: "Navigation",
  },
  {
    keys: ["Alt", "R"],
    description: "Jump to GST & Financial Reports",
    category: "Navigation",
  },

  // Inventory & Tools
  {
    keys: ["Ctrl", "K"],
    description: "Focus Global Search Bar",
    category: "Inventory & Tools",
  },
  {
    keys: ["Alt", "A"],
    description: "Toggle AI Assistant & Business Advisor",
    category: "Inventory & Tools",
  },

  // System
  {
    keys: ["Shift", "?"],
    description: "Show / Hide Keyboard Shortcuts Guide",
    category: "System",
  },
  {
    keys: ["Esc"],
    description: "Close active modal or popup window",
    category: "System",
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const categories = ["Billing & Sales", "Navigation", "Inventory & Tools", "System"] as const;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 my-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Power User Keyboard Shortcuts</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                  FAST WORKFLOW
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speed up billing and navigation with instant keyboard hotkeys
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const list = SHORTCUTS.filter((s) => s.category === cat);
            return (
              <div
                key={cat}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
              >
                <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-indigo-600 dark:fill-indigo-400" />
                  <span>{cat}</span>
                </h4>

                <div className="space-y-2">
                  {list.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors text-xs"
                    >
                      <span className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0 font-mono">
                        {item.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-[11px] font-bold shadow-xs">
                              {k}
                            </kbd>
                            {kIdx < item.keys.length - 1 && (
                              <span className="text-slate-400 text-[10px]">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border text-[10px] font-bold">Shift + ?</kbd> anytime to open this helper screen.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
