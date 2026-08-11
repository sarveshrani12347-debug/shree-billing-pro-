import React, { useState, useEffect } from "react";
import { X, Package, CheckCircle, Camera, Scan } from "lucide-react";
import { Product } from "../types";
import { useApp } from "../context/AppContext";
import { COMMON_HSN_CATALOG } from "../utils/gstUtils";
import { GstRateSelect } from "./GstRateSelect";
import { BarcodeScannerModal } from "./BarcodeScannerModal";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
}) => {
  const { addProduct, updateProduct } = useApp();

  const [name, setName] = useState(product?.name || "");
  const [sku, setSku] = useState(product?.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [hsnSac, setHsnSac] = useState(product?.hsnSac || "8471");
  const [category, setCategory] = useState(product?.category || "Electronics");
  const [unit, setUnit] = useState(product?.unit || "Pcs");
  const [purchasePrice, setPurchasePrice] = useState(product?.purchasePrice || 0);
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice || 0);
  const [taxRate, setTaxRate] = useState(product?.taxRate || 18);
  const [stockQuantity, setStockQuantity] = useState(product?.stockQuantity || 10);
  const [reorderLevel, setReorderLevel] = useState(product?.reorderLevel || 5);
  const [description, setDescription] = useState(product?.description || "");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (product) {
      updateProduct({
        ...product,
        name,
        sku,
        hsnSac,
        category,
        unit,
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        taxRate: Number(taxRate),
        stockQuantity: Number(stockQuantity),
        reorderLevel: Number(reorderLevel),
        description,
      });
    } else {
      addProduct({
        name,
        sku,
        hsnSac,
        category,
        unit,
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        taxRate: Number(taxRate),
        stockQuantity: Number(stockQuantity),
        reorderLevel: Number(reorderLevel),
        description,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">
              {product ? "Edit Catalog Item" : "Add New Inventory Product"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Product / Item Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              placeholder="e.g. Dell Latitude 3420 Laptop"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  SKU Code
                </label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Camera className="w-3 h-3" />
                  <span>Scan</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                  title="Scan with camera"
                >
                  <Scan className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                HSN / SAC Code
              </label>
              <select
                value={hsnSac}
                onChange={(e) => {
                  setHsnSac(e.target.value);
                  const found = COMMON_HSN_CATALOG.find((h) => h.code === e.target.value);
                  if (found) setTaxRate(found.defaultTaxRate);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              >
                {COMMON_HSN_CATALOG.map((hsn) => (
                  <option key={hsn.code} value={hsn.code}>
                    {hsn.code} - {hsn.description.substring(0, 25)}... ({hsn.defaultTaxRate}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                placeholder="Electronics, Hardware..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unit (Pcs, Kg, Box, Mtr, Set)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                placeholder="Pcs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-blue-600"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                GST Tax %
              </label>
              <GstRateSelect
                value={taxRate}
                onChange={(rate) => setTaxRate(rate)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Initial Stock Qty
              </label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reorder Threshold Level
              </label>
              <input
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-amber-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description / Specs
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              placeholder="Detailed specifications, warranty or notes..."
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save Item</span>
            </button>
          </div>
        </form>
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectProduct={(prod) => {
          if (prod.sku) setSku(prod.sku);
        }}
      />
    </div>
  );
};
