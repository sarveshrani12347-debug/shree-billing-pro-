import React, { useState } from "react";
import { X, Plus, Trash2, ShoppingBag, Calculator, Calendar, User, Tag } from "lucide-react";
import { useApp } from "../context/AppContext";
import { LineItem, PaymentMode, Party, Product } from "../types";
import { calculateLineItemTaxes } from "../utils/gstUtils";
import { GstRateSelect } from "./GstRateSelect";

export const PurchaseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { parties, products, profile, addPurchase, showToast } = useApp();

  const suppliers = parties.filter((p) => p.type === "vendor" || p.type === "customer");

  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || "");
  const [purchaseNumber, setPurchaseNumber] = useState(`PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Net Banking");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(false);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<LineItem[]>([
    {
      id: "item-" + Date.now(),
      productId: products[0]?.id || "",
      itemDescription: products[0]?.name || "Item Purchase",
      hsnSacCode: products[0]?.hsnSac || "8471",
      quantity: 1,
      unit: products[0]?.unit || "Pcs",
      unitPrice: products[0]?.purchasePrice || 1000,
      discountPercent: 0,
      taxRate: products[0]?.taxRate || 18,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0,
    },
  ]);

  if (!isOpen) return null;

  const currentSupplier = parties.find((p) => p.id === selectedSupplierId);
  const isInterState = currentSupplier && profile.state
    ? currentSupplier.state.toLowerCase() !== profile.state.toLowerCase()
    : false;

  const updateItem = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    if (field === "productId") {
      const prod = products.find((p) => p.id === val);
      if (prod) {
        item.itemDescription = prod.name;
        item.hsnSacCode = prod.hsnSac;
        item.unit = prod.unit;
        item.unitPrice = prod.purchasePrice;
        item.taxRate = prod.taxRate;
      }
    }

    // Recalculate item totals
    const taxes = calculateLineItemTaxes(
      item.quantity,
      item.unitPrice,
      item.discountPercent || 0,
      item.taxRate || 0,
      isInterState,
      isTaxInclusive
    );

    item.cgstAmount = taxes.cgstAmount;
    item.sgstAmount = taxes.sgstAmount;
    item.igstAmount = taxes.igstAmount;
    item.totalAmount = taxes.totalAmount;

    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    const firstProd = products[0];
    const taxes = calculateLineItemTaxes(
      1,
      firstProd?.purchasePrice || 1000,
      0,
      firstProd?.taxRate || 18,
      isInterState,
      isTaxInclusive
    );
    setItems((prev) => [
      ...prev,
      {
        id: "item-" + Date.now() + Math.random().toString().slice(2, 5),
        productId: firstProd?.id || "",
        itemDescription: firstProd?.name || "New Item",
        hsnSacCode: firstProd?.hsnSac || "8471",
        quantity: 1,
        unit: firstProd?.unit || "Pcs",
        unitPrice: firstProd?.purchasePrice || 1000,
        discountPercent: 0,
        taxRate: firstProd?.taxRate || 18,
        cgstAmount: taxes.cgstAmount,
        sgstAmount: taxes.sgstAmount,
        igstAmount: taxes.igstAmount,
        totalAmount: taxes.totalAmount,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      showToast("Purchase bill must contain at least one product", "warning");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Compute Grand totals dynamically
  const computedItems = items.map((it) => {
    const taxes = calculateLineItemTaxes(
      it.quantity,
      it.unitPrice,
      it.discountPercent || 0,
      it.taxRate || 0,
      isInterState,
      isTaxInclusive
    );
    return {
      ...it,
      cgstAmount: taxes.cgstAmount,
      sgstAmount: taxes.sgstAmount,
      igstAmount: taxes.igstAmount,
      totalAmount: taxes.totalAmount,
      taxableAmount: taxes.subtotalBeforeTax,
      totalTax: taxes.totalTax,
    };
  });

  const subtotal = computedItems.reduce((acc, it) => acc + it.taxableAmount, 0);
  const totalTax = computedItems.reduce((acc, it) => acc + it.totalTax, 0);
  const grandTotal = computedItems.reduce((acc, it) => acc + it.totalAmount, 0);
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addPurchase({
      purchaseNumber,
      partyId: selectedSupplierId,
      supplierName: currentSupplier?.name || "General Supplier",
      supplierGstin: currentSupplier?.gstin,
      supplierPhone: currentSupplier?.phone,
      date,
      items,
      subtotal,
      totalDiscount: 0,
      totalTax,
      totalAmount: grandTotal,
      amountPaid,
      balanceDue,
      paymentMode,
      notes,
      createdAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Record New Stock Purchase
              </h2>
              <p className="text-xs text-slate-500">
                Inward stock from supplier • Increases stock quantity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier & Header details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Supplier / Vendor
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Order / Bill #
              </label>
              <input
                type="text"
                value={purchaseNumber}
                onChange={(e) => setPurchaseNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          {/* Product Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Purchased Products / Items
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-md hover:bg-amber-600 transition-all flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="py-2.5 px-2">Item Name</th>
                    <th className="py-2.5 px-2 w-20">Qty</th>
                    <th className="py-2.5 px-2 w-24">Cost Price (₹)</th>
                    <th className="py-2.5 px-2 w-20">GST %</th>
                    <th className="py-2.5 px-2 w-28 text-right">Total (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2 px-2">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(idx, "productId", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.stockQuantity})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 text-center"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                        />
                      </td>

                      <td className="py-2 px-2 w-36">
                        <GstRateSelect
                          value={item.taxRate}
                          onChange={(rate) => updateItem(idx, "taxRate", rate)}
                          size="sm"
                        />
                      </td>

                      <td className="py-2 px-2 text-right font-bold text-slate-900 dark:text-white">
                        ₹{item.totalAmount.toLocaleString("en-IN")}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Grand Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  <option value="Net Banking">Net Banking / NEFT</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Paid to Supplier (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Purchase Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Vendor delivery challan ref #8821"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            {/* Calculations Card */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-800/60 border border-amber-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Items Subtotal:</span>
                <span className="font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total Input Tax (GST):</span>
                <span className="font-semibold">₹{totalTax.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-amber-200 dark:border-slate-700">
                <span>Grand Purchase Total:</span>
                <span className="text-amber-600 dark:text-amber-400">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold pt-1">
                <span>Remaining Payable (Credit):</span>
                <span>₹{balanceDue.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Save & Increase Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
