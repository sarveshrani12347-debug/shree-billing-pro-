import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Tag,
  TrendingUp,
  FileText,
  Camera,
  History,
  Scale,
  Sparkles,
  Layers,
  Minus,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Product } from "../types";
import { formatCurrency } from "../utils/gstUtils";
import { ProductModal } from "./ProductModal";
import { StockAdjustModal } from "./StockAdjustModal";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { SmartUnitModal } from "./SmartUnitModal";
import { StockHistoryModal } from "./StockHistoryModal";
import { BillScannerModal } from "./BillScannerModal";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import { FastStockStepper } from "./FastStockStepper";

export const Inventory: React.FC = () => {
  const {
    products,
    deleteProduct,
    adjustStock,
    updateProduct,
    isBillScannerOpen,
    setIsBillScannerOpen,
    allowNegativeStock,
    toggleAllowNegativeStock,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal controls
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustingProductId, setAdjustingProductId] = useState<string | null>(null);
  const [isStockPdfOpen, setIsStockPdfOpen] = useState(false);
  const [isStockHistoryOpen, setIsStockHistoryOpen] = useState(false);
  const [isSmartUnitOpen, setIsSmartUnitOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [selectedHistoryProdId, setSelectedHistoryProdId] = useState<string | undefined>(undefined);

  // Filter products
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hsnSac.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockCount = products.filter((p) => p.stockQuantity <= p.reorderLevel).length;
  const totalStockValue = products.reduce((acc, curr) => acc + curr.stockQuantity * curr.purchasePrice, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & AI Bill Scan Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>Inventory & Smart Stock Module</span>
            </h2>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 rounded-full">
              Real-time Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            AI Bill Photo Scanner • Smart Units • Reorder Alerts • Stock Movement Ledger
          </p>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Bill Scanner Action */}
          <button
            onClick={() => setIsBillScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4 animate-pulse" />
            <span>AI Bill Photo Scanner</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </button>

          {/* Camera Barcode / SKU Scanner */}
          <button
            onClick={() => setIsBarcodeScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800"
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Live Barcode Scan</span>
          </button>

          {/* Stock History Ledger */}
          <button
            onClick={() => {
              setSelectedHistoryProdId(undefined);
              setIsStockHistoryOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold text-xs transition-colors cursor-pointer border border-purple-200 dark:border-purple-800"
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>Movement Ledger</span>
          </button>

          {/* Smart Unit Conversions */}
          <button
            onClick={() => setIsSmartUnitOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-xs transition-colors cursor-pointer"
          >
            <Scale className="w-4 h-4 text-blue-500" />
            <span>Smart Units</span>
          </button>

          {/* Stock PDF Report */}
          <button
            onClick={() => setIsStockPdfOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>PDF Report</span>
          </button>

          {/* Add Product Manual */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Valuation</span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {formatCurrency(totalStockValue)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Catalog Items</span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {products.length} Products
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Low Stock Alerts</span>
            <p className="text-lg font-extrabold text-amber-600 font-mono mt-0.5">
              {lowStockCount} Items Low
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Negative Stock Control Switch */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Negative Stock Rule</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
              {allowNegativeStock ? "Allowed (<0 Allowed)" : "Blocked (No Negative)"}
            </p>
          </div>
          <button
            onClick={() => toggleAllowNegativeStock(!allowNegativeStock)}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              allowNegativeStock ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                allowNegativeStock ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === "all"
                ? "bg-slate-900 text-white dark:bg-blue-600"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white dark:bg-blue-600"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU, HSN, Name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">SKU Code</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">HSN/SAC</th>
                <th className="p-4 text-right">Purchase Rate</th>
                <th className="p-4 text-right">Selling Price</th>
                <th className="p-4 text-right">Margin %</th>
                <th className="p-4 text-center">Quick Stock Adjustment</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredProducts.map((p) => {
                const isLowStock = p.stockQuantity <= p.reorderLevel;
                const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100).toFixed(1) : 0;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      {p.sku}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {p.category}
                        </span>
                        {p.warehouse && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium">
                            {p.warehouse}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-300">
                      {p.hsnSac} ({p.taxRate}% GST)
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatCurrency(p.purchasePrice)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(p.sellingPrice)}
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      +{margin}%
                    </td>

                    {/* Quick Stock Controls with Fast Long-Press Stepper */}
                    <td className="p-4 text-center">
                      <FastStockStepper
                        product={p}
                        adjustStock={adjustStock}
                        updateProduct={updateProduct}
                        allowNegativeStock={allowNegativeStock}
                      />
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedHistoryProdId(p.id);
                            setIsStockHistoryOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 hover:bg-purple-100"
                          title="View Item History Ledger"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditingProduct(p)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 hover:bg-blue-100"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 hover:bg-red-100"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {(isAddModalOpen || editingProduct) && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {adjustingProductId && (
        <StockAdjustModal
          products={products}
          initialProductId={adjustingProductId}
          onClose={() => setAdjustingProductId(null)}
        />
      )}

      {/* Stock Report PDF Modal */}
      {isStockPdfOpen && (
        <PdfPreviewModal
          isOpen={isStockPdfOpen}
          onClose={() => setIsStockPdfOpen(false)}
          docType="stock_report"
        />
      )}

      {/* Smart Unit System Modal */}
      <SmartUnitModal
        isOpen={isSmartUnitOpen}
        onClose={() => setIsSmartUnitOpen(false)}
      />

      {/* Stock History Ledger Modal */}
      <StockHistoryModal
        isOpen={isStockHistoryOpen}
        onClose={() => setIsStockHistoryOpen(false)}
        selectedProductId={selectedHistoryProdId}
      />

      {/* AI Bill Scanner Modal */}
      <BillScannerModal
        isOpen={isBillScannerOpen}
        onClose={() => setIsBillScannerOpen(false)}
      />

      {/* Camera Live Barcode & SKU Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onSelectProduct={(prod) => {
          setSearchQuery(prod.sku || prod.name);
          setEditingProduct(prod);
        }}
      />
    </div>
  );
};

