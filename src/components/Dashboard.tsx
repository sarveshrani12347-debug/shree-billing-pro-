import React from "react";
import {
  TrendingUp,
  CreditCard,
  DollarSign,
  AlertTriangle,
  PlusCircle,
  FileText,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Sparkles,
  ShoppingBag,
  Receipt,
  Package,
  BarChart3,
  Users,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatCurrency } from "../utils/gstUtils";
import { AdBanner } from "./AdBanner";

interface DashboardProps {
  onOpenQuickInvoice: () => void;
  onOpenQuickCash: () => void;
  onOpenPartyModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenQuickInvoice,
  onOpenQuickCash,
  onOpenPartyModal,
}) => {
  const {
    invoices,
    products,
    parties,
    cashbook,
    purchases,
    expenses,
    setActiveTab,
    setIsAIDrawerOpen,
    t,
  } = useApp();

  // Metrics
  const totalRevenue = (invoices || [])
    .filter((inv) => inv.docType === "invoice" && inv.status !== "cancelled")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const totalPurchases = (purchases || []).reduce((acc, p) => acc + p.totalAmount, 0);
  const totalExpenses = (expenses || []).reduce((acc, e) => acc + e.amount, 0);

  const outstandingCollections = (parties || [])
    .filter((p) => p.type === "customer" && p.balanceType === "collect")
    .reduce((acc, curr) => acc + (curr.openingBalance || 0), 0);

  const totalCashIn = (cashbook || []).filter((c) => c.type === "in").reduce((acc, curr) => acc + curr.amount, 0);
  const totalCashOut = (cashbook || []).filter((c) => c.type === "out").reduce((acc, curr) => acc + curr.amount, 0);
  const cashOnHand = totalCashIn - totalCashOut;

  const totalStockAssetValue = (products || []).reduce(
    (acc, p) => acc + p.stockQuantity * p.purchasePrice,
    0
  );

  const lowStockItems = (products || []).filter((p) => p.stockQuantity <= p.reorderLevel);

  return (
    <div className="space-y-6">
      {/* Dashboard Top Advertisement Banner */}
      <AdBanner location="dashboard_banner" />

      {/* 4 Primary Business Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Sales Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              Sales Revenue
            </p>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {invoices.length} Invoices generated
          </p>
        </div>

        {/* Metric 2: Stock Purchases */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              Stock Purchases
            </p>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(totalPurchases)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {purchases.length} Purchase bills from vendors
          </p>
        </div>

        {/* Metric 3: Shop Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              Shop Expenses
            </p>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {expenses.length} Expense vouchers recorded
          </p>
        </div>

        {/* Metric 4: Customer Udhaar Outstanding */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              Customer Dues (Udhaar)
            </p>
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(outstandingCollections)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            To collect from market
          </p>
        </div>
      </div>

      {/* Quick Launch Action Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenQuickInvoice}
          className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Sales Invoice</span>
        </button>

        <button
          onClick={() => setActiveTab("purchases")}
          className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Record Purchase</span>
        </button>

        <button
          onClick={() => setActiveTab("expenses")}
          className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Receipt className="w-4 h-4" />
          <span>Add Shop Expense</span>
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className="p-3.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <BarChart3 className="w-4 h-4" />
          <span>View Reports & GST</span>
        </button>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent GST Sales Invoices */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Recent Sales Invoices
            </h3>
            <button
              onClick={() => setActiveTab("invoicing")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View All Invoices →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Customer Name</th>
                  <th className="px-5 py-3 text-right">Amount (₹)</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {inv.partyName}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-slate-900 dark:text-white">
                      ₹{inv.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Low Stock Widget + AI Assistant launcher */}
        <div className="space-y-6">
          {/* Low Stock Widget */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Low Stock Inventory
                </h3>
              </div>
              <button
                onClick={() => setActiveTab("inventory")}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400"
              >
                Manage Stock
              </button>
            </div>

            <div className="space-y-2">
              {lowStockItems.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                    {p.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-black bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                    {p.stockQuantity} {p.unit} left
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Advisor Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <h3 className="font-extrabold text-sm">AI Shop Business Assistant</h3>
            </div>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Have questions about GSTR-1 filing, GST tax rates, or pricing strategies? Ask our intelligent assistant.
            </p>
            <button
              onClick={() => setIsAIDrawerOpen(true)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
            >
              Launch AI Advisor Chat
            </button>
          </div>
        </div>
      </div>

      {/* Ad Banner Placeholder */}
      <AdBanner location="dashboard" />
    </div>
  );
};
