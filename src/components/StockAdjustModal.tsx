import React, { useState } from "react";
import { X, ArrowDownRight, ArrowUpRight, CheckCircle } from "lucide-react";
import { Product } from "../types";
import { useApp } from "../context/AppContext";

interface StockAdjustModalProps {
  products: Product[];
  initialProductId?: string;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  products,
  initialProductId,
  onClose,
}) => {
  const { adjustStock } = useApp();

  const [selectedId, setSelectedId] = useState(initialProductId || products[0]?.id || "");
  const [type, setType] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState<number>(5);
  const [reason, setReason] = useState<string>("New Purchase Stock Received");

  const selectedProduct = products.find((p) => p.id === selectedId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || quantity <= 0) return;

    adjustStock(selectedId, quantity, type, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold ${
                type === "in" ? "bg-emerald-600" : "bg-red-600"
              }`}
            >
              {type === "in" ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold">Quick Stock Adjustment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update warehouse inventory quantity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* In vs Out Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setType("in");
                setReason("New Purchase Stock Received");
              }}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                type === "in"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Stock In (+)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType("out");
                setReason("Damaged / Internal Consumption");
              }}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                type === "out"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Stock Out (-)</span>
            </button>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Item / Product
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current Stock: {p.stockQuantity} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-slate-500">Current Stock Level:</span>
              <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                {selectedProduct.stockQuantity} {selectedProduct.unit}
              </span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Quantity to {type === "in" ? "Add (+)" : "Remove (-)"}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold font-mono text-lg text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Reference
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              placeholder="e.g. PO #1092 restock or Damage correction"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-white font-bold flex items-center gap-1.5 shadow-md ${
                type === "in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Stock {type === "in" ? "In" : "Out"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
