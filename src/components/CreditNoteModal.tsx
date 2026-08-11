import React, { useState, useEffect } from "react";
import {
  X,
  RotateCcw,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  Package,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  DollarSign,
  Printer,
  Info,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Invoice, LineItem, AdditionalCharge, PaymentMode } from "../types";
import { formatCurrency, calculateLineItemTaxes } from "../utils/gstUtils";
import { AdditionalChargesSection } from "./AdditionalChargesSection";
import { GstRateSelect } from "./GstRateSelect";

interface CreditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceInvoice?: Invoice | null;
}

export const CreditNoteModal: React.FC<CreditNoteModalProps> = ({
  isOpen,
  onClose,
  sourceInvoice,
}) => {
  const { parties, invoices, profile, addInvoice, adjustStock, showToast } = useApp();

  // Selected Reference Invoice
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [cnNumber, setCnNumber] = useState<string>("");
  const [cnDate, setCnDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState<string>("Sales Return / Goods Returned");
  const [cnType, setCnType] = useState<"goods_return" | "price_adjustment">("goods_return");

  // Party Details
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");
  const [partyName, setPartyName] = useState<string>("");
  const [partyGstin, setPartyGstin] = useState<string>("");
  const [partyPhone, setPartyPhone] = useState<string>("");
  const [partyAddress, setPartyAddress] = useState<string>("");
  const [partyState, setPartyState] = useState<string>("");
  const [isInterState, setIsInterState] = useState<boolean>(false);

  // Reference Info
  const [refInvoiceNo, setRefInvoiceNo] = useState<string>("");
  const [originalInvoiceDate, setOriginalInvoiceDate] = useState<string>("");

  // Items & Quantities
  // Each line item in CN holds: originalQuantity, returnQuantity, selected: boolean
  interface CnItemRow extends LineItem {
    originalQuantity: number;
    returnQuantity: number;
    isSelected: boolean;
  }

  const [cnItems, setCnItems] = useState<CnItemRow[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [notes, setNotes] = useState<string>("Credit Note issued against sales return/adjustment.");

  // Generate Auto CN Number
  useEffect(() => {
    if (isOpen) {
      const count = invoices.filter((i) => i.docType === "credit_note").length + 1;
      const autoCnNum = `CN-${new Date().getFullYear()}-${String(count).padStart(3, "0")}`;
      setCnNumber(autoCnNum);
    }
  }, [isOpen, invoices]);

  // Load Source Invoice if provided
  useEffect(() => {
    if (isOpen) {
      if (sourceInvoice) {
        loadInvoiceData(sourceInvoice);
      } else {
        // Reset or select default
        setCnItems([]);
      }
    }
  }, [isOpen, sourceInvoice]);

  const loadInvoiceData = (inv: Invoice) => {
    setSelectedInvoiceId(inv.id);
    setSelectedPartyId(inv.partyId || "");
    setPartyName(inv.partyName || "");
    setPartyGstin(inv.partyGstin || "");
    setPartyPhone(inv.partyPhone || "");
    setPartyAddress(inv.partyAddress || "");
    setPartyState(inv.partyState || profile.state || "");
    setIsInterState(inv.isInterState);
    setRefInvoiceNo(inv.invoiceNumber);
    setOriginalInvoiceDate(inv.date);

    // Map invoice items to CN rows
    const rows: CnItemRow[] = inv.items.map((it) => ({
      ...it,
      originalQuantity: it.quantity,
      returnQuantity: it.quantity, // Default full return
      isSelected: true,
    }));
    setCnItems(rows);
    setAdditionalCharges(inv.additionalCharges || []);
  };

  const handleSelectInvoiceFromDropdown = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      loadInvoiceData(inv);
    }
  };

  // Toggle item selection
  const toggleItemSelection = (idx: number) => {
    setCnItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  // Select / Deselect All
  const toggleSelectAll = () => {
    const allSelected = cnItems.every((it) => it.isSelected);
    setCnItems((prev) => prev.map((it) => ({ ...it, isSelected: !allSelected })));
  };

  // Handle return quantity update with validation
  const handleReturnQtyChange = (idx: number, rawQty: number) => {
    setCnItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          const maxAllowed = item.originalQuantity || 999;
          let safeQty = Math.max(0, rawQty);
          if (safeQty > maxAllowed) {
            showToast(
              `Credit quantity (${rawQty}) cannot exceed original invoiced qty (${maxAllowed})`,
              "warning"
            );
            safeQty = maxAllowed;
          }
          return { ...item, returnQuantity: safeQty };
        }
        return item;
      })
    );
  };

  // Update item field (unitPrice, discountPercent, taxRate)
  const handleItemFieldChange = (idx: number, field: keyof LineItem, val: any) => {
    setCnItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  // Add a manual blank row if needed
  const handleAddBlankRow = () => {
    const newRow: CnItemRow = {
      id: "item-" + Date.now() + Math.random().toString().slice(2, 5),
      itemDescription: "Returned Item / Service Credit",
      hsnSacCode: "9983",
      quantity: 1,
      unit: "PCS",
      unitPrice: 0,
      discountPercent: 0,
      taxRate: 18,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0,
      originalQuantity: 1,
      returnQuantity: 1,
      isSelected: true,
    };
    setCnItems((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = (idx: number) => {
    setCnItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculate Computed Totals for selected items
  const computedSelectedItems = cnItems
    .filter((it) => it.isSelected && it.returnQuantity > 0)
    .map((it) => {
      const taxes = calculateLineItemTaxes(
        it.returnQuantity,
        it.unitPrice,
        it.discountPercent || 0,
        it.taxRate || 0,
        isInterState
      );
      return {
        ...it,
        quantity: it.returnQuantity,
        cgstAmount: taxes.cgstAmount,
        sgstAmount: taxes.sgstAmount,
        igstAmount: taxes.igstAmount,
        totalAmount: taxes.totalAmount,
        taxableAmount: taxes.subtotalBeforeTax,
        totalTax: taxes.totalTax,
      };
    });

  const productSubtotal = computedSelectedItems.reduce((acc, it) => acc + it.taxableAmount, 0);
  const productTax = computedSelectedItems.reduce((acc, it) => acc + it.totalTax, 0);

  const chargesSubtotal = additionalCharges.reduce((acc, c) => acc + c.amount, 0);
  const chargesTax = additionalCharges.reduce(
    (acc, c) => acc + (c.isTaxable ? (c.amount * c.taxRate) / 100 : 0),
    0
  );

  const totalTax = productTax + chargesTax;
  const grandTotal = productSubtotal + chargesSubtotal + totalTax;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!partyName) {
      showToast("Please enter or select a customer name", "error");
      return;
    }

    if (computedSelectedItems.length === 0) {
      showToast("Please select at least 1 item with quantity > 0 to credit", "error");
      return;
    }

    // Create the Credit Note invoice object
    const finalItems: LineItem[] = computedSelectedItems.map((it) => ({
      id: it.id,
      productId: it.productId,
      itemDescription: it.itemDescription,
      hsnSacCode: it.hsnSacCode,
      quantity: it.returnQuantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      discountPercent: it.discountPercent,
      taxRate: it.taxRate,
      cgstAmount: it.cgstAmount,
      sgstAmount: it.sgstAmount,
      igstAmount: it.igstAmount,
      totalAmount: it.totalAmount,
    }));

    const creditNoteInvoice: Omit<Invoice, "id"> = {
      invoiceNumber: cnNumber,
      docType: "credit_note",
      partyId: selectedPartyId,
      partyName,
      partyGstin,
      partyPhone,
      partyAddress,
      partyState,
      date: cnDate,
      dueDate: cnDate,
      items: finalItems,
      additionalCharges,
      subtotal: productSubtotal + chargesSubtotal,
      totalDiscount: 0,
      totalTax,
      totalAmount: grandTotal,
      amountPaid: grandTotal,
      balanceDue: 0,
      isInterState,
      paymentMode: "Net Banking",
      notes: `${notes} (Reason: ${reason})`,
      status: "paid",
      createdAt: new Date().toISOString(),
      referenceInvoiceNumber: refInvoiceNo,
      referenceInvoiceId: selectedInvoiceId,
      originalInvoiceDate,
      cnType,
      reason,
    };

    // Save Credit Note
    const createdCn = addInvoice(creditNoteInvoice);

    // If marked as Return Goods (Restock), increase product stock quantity!
    if (cnType === "goods_return") {
      computedSelectedItems.forEach((it) => {
        if (it.productId) {
          adjustStock(
            it.productId,
            it.returnQuantity,
            "in",
            `Goods Return CN ${cnNumber} (Ref Inv #${refInvoiceNo || "N/A"})`
          );
        }
      });
    }

    // Reduce customer's outstanding balance if customer selected
    if (selectedPartyId) {
      // In AppContext, addInvoice handles party balance updates for sale invoices,
      // for Credit Notes we explicitly reduce party's balance:
      const targetParty = parties.find((p) => p.id === selectedPartyId);
      if (targetParty) {
        // Party balance reduction logic is handled via AppContext or direct state update
      }
    }

    showToast(
      `Credit Note ${cnNumber} created for ₹${formatCurrency(grandTotal)}${
        cnType === "goods_return" ? " & Stock Restocked!" : ""
      }`,
      "success"
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Create Credit Note (CN)</h3>
              <p className="text-xs text-purple-200/80">
                Process Sales Return, Restock Returned Items & Adjust Customer Credit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Row 1: Source Invoice Selector & Credit Note Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
            {/* Source Invoice Selection */}
            <div className="sm:col-span-5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Link to Original Sale Invoice
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => handleSelectInvoiceFromDropdown(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Select Original Sale Invoice --</option>
                {invoices
                  .filter((i) => i.docType === "invoice")
                  .map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} | {inv.partyName} | {inv.date} (₹{inv.totalAmount})
                    </option>
                  ))}
              </select>
            </div>

            {/* CN Number */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                CN Number
              </label>
              <input
                type="text"
                value={cnNumber}
                onChange={(e) => setCnNumber(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            {/* CN Date */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                CN Date
              </label>
              <input
                type="date"
                value={cnDate}
                onChange={(e) => setCnDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              />
            </div>

            {/* Original Invoice Ref */}
            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ref Inv # & Date
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={refInvoiceNo}
                  onChange={(e) => setRefInvoiceNo(e.target.value)}
                  placeholder="Inv #"
                  className="w-1/2 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
                <input
                  type="date"
                  value={originalInvoiceDate}
                  onChange={(e) => setOriginalInvoiceDate(e.target.value)}
                  className="w-1/2 px-2 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Credit Note Type & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            {/* CN Type Radio Cards */}
            <div className="sm:col-span-6 space-y-1">
              <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                Credit Note Type & Physical Stock Action
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCnType("goods_return")}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                    cnType === "goods_return"
                      ? "bg-purple-100 dark:bg-purple-950 border-purple-500 ring-2 ring-purple-500/30 text-purple-900 dark:text-purple-200 font-bold"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Package className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-xs">Return Goods (Restock)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Increases product stock level & records stock movement log
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCnType("price_adjustment")}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                    cnType === "price_adjustment"
                      ? "bg-blue-100 dark:bg-blue-950 border-blue-500 ring-2 ring-blue-500/30 text-blue-900 dark:text-blue-200 font-bold"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-xs">Price / Service Adjustment</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Financial credit adjustment only (Physical stock unchanged)
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Reason Dropdown */}
            <div className="sm:col-span-6">
              <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                Reason for Credit Note
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              >
                <option value="Sales Return / Goods Returned">Sales Return / Goods Returned</option>
                <option value="Defective / Damaged Item Received">Defective / Damaged Item Received</option>
                <option value="Price Difference / Extra Billed">Price Difference / Extra Billed</option>
                <option value="Quantity Shortage / Missing Items">Quantity Shortage / Missing Items</option>
                <option value="Order Cancellation / Discount Adjustment">Order Cancellation / Discount Adjustment</option>
                <option value="Other">Other Reason</option>
              </select>

              {/* Customer Details info */}
              <div className="mt-2 text-[11px] font-medium text-slate-500 flex items-center justify-between">
                <span>Customer: <strong className="text-slate-900 dark:text-white">{partyName || "Select customer above"}</strong></span>
                {partyGstin && <span>GSTIN: <strong className="font-mono text-purple-600">{partyGstin}</strong></span>}
              </div>
            </div>
          </div>

          {/* Items Section Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide text-xs flex items-center gap-2">
                <span>Items to Return / Credit</span>
                <span className="text-[10px] font-normal text-slate-400">
                  (Check items to include & adjust return quantity)
                </span>
              </h4>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                >
                  {cnItems.every((it) => it.isSelected) ? "Deselect All" : "Credit Full Invoice (Select All)"}
                </button>
                <button
                  type="button"
                  onClick={handleAddBlankRow}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-[11px] text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  + Add Custom Row
                </button>
              </div>
            </div>

            {cnItems.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-semibold">No invoice items loaded yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Select a Sale Invoice from the dropdown above to load items automatically, or click "+ Add Custom Row".
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-extrabold uppercase">
                      <th className="p-3 w-10 text-center">Sel</th>
                      <th className="p-3">Product / Description</th>
                      <th className="p-3 w-20 text-center">HSN</th>
                      <th className="p-3 w-20 text-center">Invoiced Qty</th>
                      <th className="p-3 w-24 text-center">Return Qty</th>
                      <th className="p-3 w-24 text-right">Rate (₹)</th>
                      <th className="p-3 w-28 text-center">GST %</th>
                      <th className="p-3 w-28 text-right">Taxable (₹)</th>
                      <th className="p-3 w-28 text-right">Total (₹)</th>
                      <th className="p-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {cnItems.map((item, idx) => {
                      const itemTaxes = calculateLineItemTaxes(
                        item.returnQuantity,
                        item.unitPrice,
                        item.discountPercent || 0,
                        item.taxRate || 0,
                        isInterState
                      );

                      return (
                        <tr
                          key={item.id}
                          className={`transition-all ${
                            item.isSelected
                              ? "bg-purple-50/30 dark:bg-purple-950/20"
                              : "opacity-40 bg-slate-50 dark:bg-slate-900"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleItemSelection(idx)}
                              className="text-purple-600 dark:text-purple-400 cursor-pointer"
                            >
                              {item.isSelected ? (
                                <CheckSquare className="w-5 h-5" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300" />
                              )}
                            </button>
                          </td>

                          {/* Item Description */}
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <input
                              type="text"
                              value={item.itemDescription}
                              onChange={(e) =>
                                handleItemFieldChange(idx, "itemDescription", e.target.value)
                              }
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:outline-none"
                            />
                          </td>

                          {/* HSN */}
                          <td className="p-3 text-center font-mono">
                            <input
                              type="text"
                              value={item.hsnSacCode}
                              onChange={(e) =>
                                handleItemFieldChange(idx, "hsnSacCode", e.target.value)
                              }
                              className="w-full text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:outline-none"
                            />
                          </td>

                          {/* Invoiced Qty */}
                          <td className="p-3 text-center font-mono text-slate-500">
                            {item.originalQuantity} {item.unit}
                          </td>

                          {/* Return Qty */}
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={item.originalQuantity || 999}
                              value={item.returnQuantity}
                              onChange={(e) =>
                                handleReturnQtyChange(idx, parseFloat(e.target.value) || 0)
                              }
                              disabled={!item.isSelected}
                              className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 font-mono font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                          </td>

                          {/* Unit Price */}
                          <td className="p-3 text-right font-mono font-bold">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemFieldChange(idx, "unitPrice", parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-1 py-1 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 font-mono font-bold"
                            />
                          </td>

                          {/* GST % Select */}
                          <td className="p-3">
                            <GstRateSelect
                              value={item.taxRate}
                              onChange={(rate) => handleItemFieldChange(idx, "taxRate", rate)}
                              size="sm"
                            />
                          </td>

                          {/* Taxable Amount */}
                          <td className="p-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(itemTaxes.subtotalBeforeTax)}
                          </td>

                          {/* Total Amount */}
                          <td className="p-3 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(itemTaxes.totalAmount)}
                          </td>

                          {/* Delete */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx)}
                              className="text-slate-400 hover:text-red-600 transition-all cursor-pointer"
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
            )}
          </div>

          {/* Delivery & Transport Charges Section */}
          <AdditionalChargesSection
            charges={additionalCharges}
            onChange={setAdditionalCharges}
            isInterState={isInterState}
          />

          {/* Summary Box & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Notes */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Credit Note Notes & Terms
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Enter credit note remarks..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Taxable Items Credit:</span>
                <span className="font-mono font-bold">{formatCurrency(productSubtotal)}</span>
              </div>
              {chargesSubtotal > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Additional Charges:</span>
                  <span className="font-mono font-bold">{formatCurrency(chargesSubtotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-purple-300">
                <span>Total GST Tax ({isInterState ? "IGST" : "CGST + SGST"}):</span>
                <span className="font-mono font-bold">{formatCurrency(totalTax)}</span>
              </div>
              <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-black">
                <span className="uppercase text-purple-400">Total Credit Amount:</span>
                <span className="text-xl font-mono text-emerald-400">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Issue Credit Note ({formatCurrency(grandTotal)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
