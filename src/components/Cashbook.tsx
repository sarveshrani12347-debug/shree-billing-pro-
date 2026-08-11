import React, { useState } from "react";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Trash2,
  Tag,
  Paperclip,
  X,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { CashEntry } from "../types";
import { formatCurrency } from "../utils/gstUtils";
import { CashbookModal } from "./CashbookModal";

export const Cashbook: React.FC = () => {
  const { cashEntries, deleteCashEntry } = useApp();

  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReceipt, setActiveReceipt] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"in" | "out">("in");

  // Filtered Cash Entries
  const filteredEntries = cashEntries.filter((entry) => {
    const matchesType = filterType === "all" || entry.type === filterType;
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.partyName && entry.partyName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Calculate Totals
  const totalInflow = cashEntries
    .filter((e) => e.type === "in")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOutflow = cashEntries
    .filter((e) => e.type === "out")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalInflow - totalOutflow;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Cashbook & Expense Logs</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track daily cash inflow, outflows, payment modes & receipt attachments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setModalType("in");
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Cash In (+)</span>
          </button>

          <button
            onClick={() => {
              setModalType("out");
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Cash Out (-)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Cash Inflow</span>
            <p className="text-lg font-extrabold text-emerald-600 font-mono mt-0.5">
              +{formatCurrency(totalInflow)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Outflow / Expense</span>
            <p className="text-lg font-extrabold text-red-600 font-mono mt-0.5">
              -{formatCurrency(totalOutflow)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Net Liquidity Balance</span>
            <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
              {formatCurrency(netBalance)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[
            { id: "all", label: "All Logs" },
            { id: "in", label: "Cash In" },
            { id: "out", label: "Expenses (Out)" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === f.id
                  ? "bg-slate-900 text-white dark:bg-emerald-600"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memo, category or party..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Cashbook Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">Date</th>
                <th className="p-4">Type</th>
                <th className="p-4">Category Tag</th>
                <th className="p-4">Description / Memo</th>
                <th className="p-4">Party / Ref #</th>
                <th className="p-4">Mode</th>
                <th className="p-4 text-right">Amount (₹)</th>
                <th className="p-4 text-center">Receipt</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredEntries.map((entry) => {
                const isIn = entry.type === "in";

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-300 font-semibold">
                      {entry.date}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          isIn
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {isIn ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {isIn ? "Cash In" : "Cash Out"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                        {entry.category}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {entry.description}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <p className="font-bold">{entry.partyName || "N/A"}</p>
                      {entry.referenceNo && (
                        <p className="text-[10px] font-mono text-slate-400">{entry.referenceNo}</p>
                      )}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                      {entry.paymentMode}
                    </td>
                    <td
                      className={`p-4 text-right font-mono font-extrabold text-sm ${
                        isIn ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isIn ? "+" : "-"}{formatCurrency(entry.amount)}
                    </td>
                    <td className="p-4 text-center">
                      {entry.receiptUrl ? (
                        <button
                          onClick={() => setActiveReceipt(entry.receiptUrl!)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 hover:bg-blue-100"
                          title="View Receipt Photo"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteCashEntry(entry.id)}
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 hover:bg-red-100"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashbook Modal */}
      {isModalOpen && (
        <CashbookModal initialType={modalType} onClose={() => setIsModalOpen(false)} />
      )}

      {/* Receipt Preview Popup */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative bg-white dark:bg-slate-900 p-4 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-800 dark:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold mb-3">Attached Receipt Photo</h3>
            <img
              src={activeReceipt}
              alt="Receipt Attachment"
              className="w-full max-h-96 object-contain rounded-2xl bg-slate-100 dark:bg-slate-950"
            />
          </div>
        </div>
      )}
    </div>
  );
};
