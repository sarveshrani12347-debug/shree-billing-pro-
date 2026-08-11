import React, { useState } from "react";
import { ShoppingBag, Plus, Search, Calendar, FileText, ArrowUpRight, Filter, Trash2, CheckCircle2, Eye, Printer, Camera, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PurchaseModal } from "./PurchaseModal";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { BillScannerModal } from "./BillScannerModal";
import { Purchase } from "../types";

export const Purchases: React.FC = () => {
  const { purchases, deletePurchase, isBillScannerOpen, setIsBillScannerOpen, t } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPurchasePdf, setSelectedPurchasePdf] = useState<Purchase | null>(null);

  const filtered = purchases.filter(
    (p) =>
      p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPurchaseValue = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalPaidToSuppliers = purchases.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalUnpaidPurchases = purchases.reduce((acc, p) => acc + p.balanceDue, 0);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-amber-500" />
            <span>Stock Purchases</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage stock inward bills from suppliers & wholesale vendors
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsBillScannerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Camera className="w-4 h-4 animate-pulse" />
            <span>AI Bill Scanner</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </button>

          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Purchase</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Purchase Inward
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{totalPurchaseValue.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">across {purchases.length} orders</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Supplier Paid
          </p>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{totalPaidToSuppliers.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">settled payments</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pending Supplier Payable
          </p>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            ₹{totalUnpaidPurchases.toLocaleString("en-IN")}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">due balance</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Purchase # or Supplier Name..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
        />
      </div>

      {/* Purchases List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Purchase Bill #</th>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No purchases recorded yet</p>
                    <p className="text-xs text-slate-500 mt-1">Record purchases to track inventory inward stock</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {p.purchaseNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {p.supplierName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                      ₹{p.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{p.amountPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                      ₹{p.balanceDue.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedPurchasePdf(p)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                          title="Print / Download Purchase Order PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePurchase(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Purchase Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />

      {/* AI Bill Scanner Modal */}
      <BillScannerModal
        isOpen={isBillScannerOpen}
        onClose={() => setIsBillScannerOpen(false)}
      />

      {selectedPurchasePdf && (
        <PdfPreviewModal
          isOpen={!!selectedPurchasePdf}
          onClose={() => setSelectedPurchasePdf(null)}
          docType="purchase_order"
          purchaseData={selectedPurchasePdf}
        />
      )}
    </div>
  );
};
