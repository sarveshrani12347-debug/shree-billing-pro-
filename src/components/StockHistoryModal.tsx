import React, { useState } from "react";
import {
  X,
  History,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Eye,
  Download,
  Calendar,
  Package,
} from "lucide-react";
import { useApp } from "../context/AppContext";

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductId?: string;
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  isOpen,
  onClose,
  selectedProductId,
}) => {
  const { stockHistory, products } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [prodFilter, setProdFilter] = useState<string>(selectedProductId || "all");
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredHistory = stockHistory.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.referenceNo && item.referenceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.partyName && item.partyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesProd = prodFilter === "all" || item.productId === prodFilter;

    return matchesSearch && matchesType && matchesProd;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Inventory Movement Ledger</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete audit trail of stock increases, bill scans, sales, and manual adjustments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, bill #, vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs py-1.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="all">All Movement Types</option>
              <option value="bill_scan">AI Bill Scans</option>
              <option value="purchase">Purchases</option>
              <option value="sale">Sales / Invoices</option>
              <option value="adjustment_in">Stock In (+)</option>
              <option value="adjustment_out">Stock Out (-)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={prodFilter}
              onChange={(e) => setProdFilter(e.target.value)}
              className="w-full text-xs py-1.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="all">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Table */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No stock movements found</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search terms or filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {filteredHistory.map((mov) => {
                const isPositive = mov.qtyChange > 0;
                return (
                  <div
                    key={mov.id}
                    className="p-3.5 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                          isPositive
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold">{mov.productName}</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                            {mov.sku}
                          </span>
                          {mov.type === "bill_scan" && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                              AI Bill Scan
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {mov.date}
                          </span>
                          {mov.referenceNo && (
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Ref: {mov.referenceNo}
                            </span>
                          )}
                          {mov.partyName && (
                            <span>Vendor/Party: {mov.partyName}</span>
                          )}
                        </div>

                        {mov.remarks && (
                          <p className="text-xs text-slate-500 italic mt-0.5">
                            "{mov.remarks}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <div
                          className={`text-sm font-extrabold ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {mov.qtyChange} {mov.unit}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Current Stock: <span className="font-bold">{mov.newStock} {mov.unit}</span>
                        </div>
                      </div>

                      {/* Original Photo / PDF preview button if available */}
                      {mov.billPhotoUrl ? (
                        <button
                          onClick={() => setPreviewPhotoUrl(mov.billPhotoUrl || null)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Bill Photo
                        </button>
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing {filteredHistory.length} movement records
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Bill Photo Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden p-4">
            <div className="flex justify-between items-center mb-3 text-white">
              <span className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> Original Purchase Bill Photo
              </span>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex justify-center bg-black rounded-xl p-2">
              <img
                src={previewPhotoUrl}
                alt="Original Bill"
                className="max-w-full h-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <a
                href={previewPhotoUrl}
                download="Scanned_Purchase_Bill.jpg"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Photo
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
