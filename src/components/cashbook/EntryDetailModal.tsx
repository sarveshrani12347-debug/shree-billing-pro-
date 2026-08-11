import React from "react";
import { X, Calendar, User, FileText, CheckCircle2, XCircle, Tag, Hash, Clock, CreditCard, Edit2 } from "lucide-react";
import { DailyCashEntry, CustomCashColumn } from "../../types";
import { formatCurrency } from "../../utils/gstUtils";

interface EntryDetailModalProps {
  entry: DailyCashEntry | null;
  onClose: () => void;
  onEdit?: (entry: DailyCashEntry) => void;
  columnsConfig?: CustomCashColumn[];
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onEdit,
  columnsConfig = [],
}) => {
  if (!entry) return null;

  const isIncome = entry.direction === "income";
  const matchedCol = columnsConfig.find((c) => c.name === entry.paymentType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isIncome
                  ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                  : "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
              }`}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Transaction Details
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ID: <span className="font-mono">{entry.id}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close (×)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Amount Display Card */}
          <div
            className={`p-4 rounded-2xl border text-center space-y-1 ${
              isIncome
                ? "bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                : "bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800"
            }`}
          >
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 block">
              {isIncome ? "Payment Received (+)" : "Payment Paid (-)"}
            </span>
            <span
              className={`text-2xl font-black block ${
                isIncome ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isIncome ? "+" : "-"}₹{formatCurrency(entry.amount)}
            </span>
          </div>

          {/* Key Value Details */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            {/* Party Name */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>Party / Customer / Vendor:</span>
              </span>
              <span className="font-black text-slate-900 dark:text-white">
                {entry.partyName || entry.description || "-"}
              </span>
            </div>

            {/* Description */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Description:</span>
              </span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                {entry.description}
              </span>
            </div>

            {/* Category */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>Payment Category:</span>
              </span>
              <span
                className="px-2.5 py-0.5 rounded-lg text-xs font-black border"
                style={{
                  backgroundColor: matchedCol?.bgLightHex || "#eff6ff",
                  color: matchedCol?.textColorHex || "#1e40af",
                  borderColor: matchedCol?.color || "#3b82f6",
                }}
              >
                {entry.paymentType}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Date:</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {entry.date}
              </span>
            </div>

            {/* Reference No */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ref / Cheque No:</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {entry.referenceNo || "N/A"}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>Status:</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-md font-black text-[11px] ${
                  entry.status === "Pending"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {entry.status || "Completed"}
              </span>
            </div>

            {/* Include in Total */}
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                {entry.addToTotal ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Included in Total Sums:</span>
              </span>
              <span
                className={`font-black ${
                  entry.addToTotal ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                }`}
              >
                {entry.addToTotal ? "✓ YES (ON)" : "NO (OFF)"}
              </span>
            </div>
          </div>

          {/* Notes */}
          {entry.notes && (
            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-200 block">Notes:</span>
              <p className="text-slate-700 dark:text-slate-300">{entry.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          {onEdit ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(entry);
              }}
              className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Entry</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
