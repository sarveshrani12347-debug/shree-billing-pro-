import React, { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Printer,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Building2,
  Tag,
  ArrowRight,
  Calculator,
  ListPlus,
  RotateCcw,
  ArrowRightLeft,
  Truck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { AdBanner } from "./AdBanner";
import {
  DocumentType,
  Invoice,
  LineItem,
  AdditionalCharge,
  PaymentMode,
  InvoiceStatus,
} from "../types";
import {
  formatCurrency,
  COMMON_HSN_CATALOG,
  calculateLineItemTaxes,
  calculateAdditionalChargeTaxes,
} from "../utils/gstUtils";
import { GstRateSelect } from "./GstRateSelect";
import { AdditionalChargesSection } from "./AdditionalChargesSection";
import { CreditNoteModal } from "./CreditNoteModal";

export const Invoicing: React.FC = () => {
  const {
    invoices,
    addInvoice,
    deleteInvoice,
    parties,
    products,
    profile,
    setPrintingInvoice,
    showToast,
  } = useApp();

  // Filters & Search
  const [docFilter, setDocFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCnModalOpen, setIsCnModalOpen] = useState<boolean>(false);
  const [cnSourceInvoice, setCnSourceInvoice] = useState<Invoice | null>(null);

  // Form Fields for New Invoice
  const [docType, setDocType] = useState<DocumentType>("invoice");
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    `${profile.invoicePrefix || "SB-2026-"}${String(invoices.length + 1).padStart(3, "0")}`
  );
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [notes, setNotes] = useState<string>("Thank you for your business!");
  const [terms, setTerms] = useState<string>(profile.termsAndConditions || "");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(false);

  // Line items & Additional charges state
  const [items, setItems] = useState<LineItem[]>([
    {
      id: "item-init-1",
      itemDescription: "Dell Latitude 3420 Business Laptop i5 11th Gen",
      hsnSacCode: "8471",
      quantity: 1,
      unit: "Pcs",
      unitPrice: 56000,
      discountPercent: 0,
      taxRate: 18,
      cgstAmount: 5040,
      sgstAmount: 5040,
      igstAmount: 0,
      totalAmount: 66080,
    },
  ]);

  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);

  // Selected party object
  const selectedParty = parties.find((p) => p.id === selectedPartyId);
  const isInterState = selectedParty
    ? selectedParty.state.toLowerCase() !== profile.state.toLowerCase()
    : false;

  // Filtered Document list
  const filteredInvoices = (invoices || []).filter((inv) => {
    const matchesFilter = docFilter === "all" || inv.docType === docFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.partyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate Form Totals dynamically
  const computedItems = items.map((curr) => {
    const taxes = calculateLineItemTaxes(
      curr.quantity,
      curr.unitPrice,
      curr.discountPercent,
      curr.taxRate,
      isInterState,
      isTaxInclusive
    );
    return {
      ...curr,
      cgstAmount: taxes.cgstAmount,
      sgstAmount: taxes.sgstAmount,
      igstAmount: taxes.igstAmount,
      totalAmount: taxes.totalAmount,
      taxableAmount: taxes.subtotalBeforeTax,
      totalTax: taxes.totalTax,
    };
  });

  const productSubtotal = computedItems.reduce((acc, curr) => acc + curr.taxableAmount, 0);

  const totalDiscount = items.reduce((acc, curr) => {
    return acc + (curr.quantity * curr.unitPrice * curr.discountPercent) / 100;
  }, 0);

  const productTax = computedItems.reduce((acc, curr) => acc + curr.totalTax, 0);

  const chargesSubtotal = additionalCharges.reduce((acc, c) => acc + c.amount, 0);
  const chargesTax = additionalCharges.reduce((acc, c) => {
    const t = calculateAdditionalChargeTaxes(c.amount, c.isTaxable, c.taxRate, isInterState);
    return acc + t.totalTax;
  }, 0);

  const subtotal = productSubtotal + chargesSubtotal;
  const totalTax = productTax + chargesTax;
  const grandTotal = subtotal + totalTax;
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  // Line Item Handlers
  const handleAddItem = () => {
    const newItem: LineItem = {
      id: "line-" + Date.now(),
      itemDescription: "",
      hsnSacCode: "8471",
      quantity: 1,
      unit: "Pcs",
      unitPrice: 0,
      discountPercent: 0,
      taxRate: 18,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      showToast("Document must contain at least one line item", "warning");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSelectProductForLine = (lineId: string, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === lineId) {
          const taxes = calculateLineItemTaxes(
            item.quantity,
            prod.sellingPrice,
            item.discountPercent,
            prod.taxRate,
            isInterState,
            isTaxInclusive
          );
          return {
            ...item,
            productId: prod.id,
            itemDescription: prod.name,
            hsnSacCode: prod.hsnSac,
            unit: prod.unit,
            unitPrice: prod.sellingPrice,
            taxRate: prod.taxRate,
            cgstAmount: taxes.cgstAmount,
            sgstAmount: taxes.sgstAmount,
            igstAmount: taxes.igstAmount,
            totalAmount: taxes.totalAmount,
          };
        }
        return item;
      })
    );
  };

  const handleLineChange = (
    id: string,
    field: keyof LineItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          const qty = Number(updated.quantity) || 0;
          const price = Number(updated.unitPrice) || 0;
          const disc = Number(updated.discountPercent) || 0;
          const rate = Number(updated.taxRate) || 0;

          const taxes = calculateLineItemTaxes(qty, price, disc, rate, isInterState, isTaxInclusive);
          return {
            ...updated,
            cgstAmount: taxes.cgstAmount,
            sgstAmount: taxes.sgstAmount,
            igstAmount: taxes.igstAmount,
            totalAmount: taxes.totalAmount,
          };
        }
        return item;
      })
    );
  };

  const handleHsnAutoMap = (lineId: string, code: string) => {
    const found = COMMON_HSN_CATALOG.find((h) => h.code === code);
    if (found) {
      handleLineChange(lineId, "taxRate", found.defaultTaxRate);
      handleLineChange(lineId, "hsnSacCode", found.code);
      showToast(`Auto-mapped HSN ${found.code} (${found.defaultTaxRate}% GST)`);
    }
  };

  // Submit Invoice Creation
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParty) {
      showToast("Please select or add a Customer/Vendor party", "error");
      return;
    }

    if (items.length === 0 || grandTotal <= 0) {
      showToast("Invoice must have items and valid total > 0", "error");
      return;
    }

    let status: InvoiceStatus = "unpaid";
    if (amountPaid >= grandTotal) {
      status = "paid";
    } else if (amountPaid > 0) {
      status = "partially_paid";
    }

    const created = addInvoice({
      invoiceNumber,
      docType,
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      partyGstin: selectedParty.gstin,
      partyPhone: selectedParty.phone,
      partyAddress: selectedParty.address,
      partyState: selectedParty.state,
      date,
      dueDate,
      items,
      additionalCharges,
      subtotal: Number(subtotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalAmount: Number(grandTotal.toFixed(2)),
      amountPaid: Number(amountPaid.toFixed(2)),
      balanceDue: Number(balanceDue.toFixed(2)),
      isInterState,
      paymentMode,
      notes,
      terms,
      status,
      createdAt: new Date().toISOString(),
    });

    setIsCreateModalOpen(false);
    setPrintingInvoice(created); // Automatically open print preview
  };

  // Convert Quotation to Invoice (carrying forward all items & additional charges!)
  const handleConvertQuotationToInvoice = (quotation: Invoice) => {
    const invCount = invoices.filter((i) => i.docType === "invoice").length + 1;
    const newInvNum = `${profile.invoicePrefix || "SB-2026-"}${String(invCount).padStart(3, "0")}`;

    const newInvoiceData: Omit<Invoice, "id"> = {
      invoiceNumber: newInvNum,
      docType: "invoice",
      partyId: quotation.partyId,
      partyName: quotation.partyName,
      partyGstin: quotation.partyGstin,
      partyPhone: quotation.partyPhone,
      partyAddress: quotation.partyAddress,
      partyState: quotation.partyState,
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      items: quotation.items,
      additionalCharges: quotation.additionalCharges || [],
      subtotal: quotation.subtotal,
      totalDiscount: quotation.totalDiscount,
      totalTax: quotation.totalTax,
      totalAmount: quotation.totalAmount,
      amountPaid: 0,
      balanceDue: quotation.totalAmount,
      isInterState: quotation.isInterState,
      paymentMode: "UPI",
      notes: `Converted from Quotation #${quotation.invoiceNumber}. ${quotation.notes || ""}`,
      terms: quotation.terms,
      status: "unpaid",
      createdAt: new Date().toISOString(),
    };

    const createdInv = addInvoice(newInvoiceData);
    showToast(
      `Quotation ${quotation.invoiceNumber} successfully converted to GST Invoice ${newInvNum}! (All charges carried forward)`,
      "success"
    );
    setPrintingInvoice(createdInv);
  };

  return (
    <div className="space-y-6">
      {/* Invoice Screen Sponsored Banner */}
      <AdBanner location="invoice_screen" />

      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>GST Invoicing & Documents</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate Invoices, Quotations, Proforma Invoices, Delivery Challans & Credit Notes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setCnSourceInvoice(null);
              setIsCnModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>+ Create Credit Note (CN)</span>
          </button>

          <button
            onClick={() => {
              setInvoiceNumber(
                `${profile.invoicePrefix || "SB-2026-"}${String(invoices.length + 1).padStart(3, "0")}`
              );
              setIsCreateModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Create Document</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Document Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Docs" },
            { id: "invoice", label: "GST Invoice" },
            { id: "quotation", label: "Quotation" },
            { id: "proforma", label: "Proforma" },
            { id: "challan", label: "Challan" },
            { id: "credit_note", label: "Credit Note" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDocFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                docFilter === tab.id
                  ? "bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doc # or party name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">Document #</th>
                <th className="p-4">Type</th>
                <th className="p-4">Date</th>
                <th className="p-4">Party Name</th>
                <th className="p-4 text-right">Taxable</th>
                <th className="p-4 text-right">GST Tax</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-8 text-slate-500 dark:text-slate-400">
                    No documents found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {inv.docType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-mono">{inv.date}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{inv.partyName}</p>
                      {inv.partyGstin && (
                        <p className="text-[10px] font-mono text-slate-400">GST: {inv.partyGstin}</p>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatCurrency(inv.subtotal)}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatCurrency(inv.totalTax)}
                    </td>
                    <td className="p-4 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === "paid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : inv.status === "partially_paid"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {inv.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.docType === "quotation" && (
                          <button
                            onClick={() => handleConvertQuotationToInvoice(inv)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-[10px] transition-colors cursor-pointer"
                            title="Convert Quotation to Tax Invoice (Carries forward all charges)"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Convert to Invoice</span>
                          </button>
                        )}

                        {inv.docType === "invoice" && (
                          <button
                            onClick={() => {
                              setCnSourceInvoice(inv);
                              setIsCnModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-colors cursor-pointer"
                            title="Issue Credit Note / Return Goods against this invoice"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setPrintingInvoice(inv)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Print / View Document PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                          title="Delete Document"
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

      {/* CREATE NEW DOCUMENT DRAWER / MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 sm:p-8 my-auto border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Generate New GST Document</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Automatic HSN tax calculations & inter-state IGST mapping
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              {/* Row 1: Document Type & Document Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Document Type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="invoice">GST Tax Invoice</option>
                    <option value="quotation">Sales Quotation</option>
                    <option value="proforma">Proforma Invoice</option>
                    <option value="challan">Delivery Challan</option>
                    <option value="credit_note">Credit Note</option>
                    <option value="debit_note">Debit Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice / Document #
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Party (Customer / Vendor)
                  </label>
                  <select
                    value={selectedPartyId}
                    onChange={(e) => setSelectedPartyId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Choose Party --</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.state}) - GST: {p.gstin || "URP"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Dates, Payment Mode, Tax Mode & Supply Type Indicator */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="UPI">UPI Payment</option>
                    <option value="Cash">Cash</option>
                    <option value="Net Banking">Net Banking / NEFT</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Tax Pricing
                  </label>
                  <select
                    value={isTaxInclusive ? "inclusive" : "exclusive"}
                    onChange={(e) => setIsTaxInclusive(e.target.value === "inclusive")}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="exclusive">Tax Exclusive (+ GST)</option>
                    <option value="inclusive">Tax Inclusive (Incl. GST)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    GST Supply Type
                  </label>
                  <div
                    className={`px-2 py-1.5 rounded-lg font-bold text-center text-[11px] truncate ${
                      isInterState
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                    title={isInterState ? "Inter-State Transaction (IGST)" : "Intra-State Transaction (CGST + SGST)"}
                  >
                    {isInterState ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)"}
                  </div>
                </div>
              </div>

              {/* Line Items Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-blue-500" />
                    <span>Document Line Items</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                        {/* Item Description / Product Select */}
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
                            Item Description
                          </label>
                          <input
                            type="text"
                            value={item.itemDescription}
                            onChange={(e) =>
                              handleLineChange(item.id, "itemDescription", e.target.value)
                            }
                            placeholder="Type or pick product below..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                            required
                          />
                          {/* Quick Product Auto-Fill Dropdown */}
                          <select
                            onChange={(e) => handleSelectProductForLine(item.id, e.target.value)}
                            className="w-full mt-1 text-[11px] bg-transparent text-blue-600 dark:text-blue-400 font-medium cursor-pointer focus:outline-none"
                          >
                            <option value="">-- Quick Pick Product Catalog --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.stockQuantity} {p.unit}) - ₹{p.sellingPrice}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* HSN / SAC Code */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
                            HSN/SAC
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={item.hsnSacCode}
                              onChange={(e) =>
                                handleLineChange(item.id, "hsnSacCode", e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                            />
                          </div>
                        </div>

                        {/* Qty & Unit */}
                        <div className="sm:col-span-2 flex gap-1">
                          <div className="w-1/2">
                            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
                              Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleLineChange(item.id, "quantity", Number(e.target.value))
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-center"
                            />
                          </div>
                          <div className="w-1/2">
                            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) =>
                                handleLineChange(item.id, "unit", e.target.value)
                              }
                              className="w-full px-1.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center"
                            />
                          </div>
                        </div>

                        {/* Unit Price (₹) */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
                            Rate (₹)
                          </label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleLineChange(item.id, "unitPrice", Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-right"
                          />
                        </div>

                        {/* Tax Rate % */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
                            GST %
                          </label>
                          <GstRateSelect
                            value={item.taxRate}
                            onChange={(rate) =>
                              handleLineChange(item.id, "taxRate", rate)
                            }
                            size="sm"
                          />
                        </div>

                        {/* Action Delete Line */}
                        <div className="sm:col-span-1 flex items-end justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Line Item Tax Calculated Footer */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex gap-2">
                          {COMMON_HSN_CATALOG.slice(0, 3).map((hsn) => (
                            <button
                              key={hsn.code}
                              type="button"
                              onClick={() => handleHsnAutoMap(item.id, hsn.code)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-100"
                            >
                              HSN {hsn.code} ({hsn.defaultTaxRate}%)
                            </button>
                          ))}
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Line Total: {formatCurrency(item.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery / Transport Charges Section */}
              <AdditionalChargesSection
                charges={additionalCharges}
                onChange={setAdditionalCharges}
                isInterState={isInterState}
              />

              {/* Summary Calculations Footer */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Products Subtotal:</span>
                  <span className="font-mono font-bold">{formatCurrency(productSubtotal)}</span>
                </div>
                {chargesSubtotal > 0 && (
                  <div className="flex justify-between text-purple-600 dark:text-purple-400">
                    <span>Delivery / Transport Charges:</span>
                    <span className="font-mono font-bold">{formatCurrency(chargesSubtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>GST Tax Total ({isInterState ? "IGST" : "CGST + SGST"}):</span>
                  <span className="font-mono font-bold">{formatCurrency(totalTax)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Grand Total (₹):</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                      Amount Received / Advance (₹)
                    </label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-slate-400 mb-0.5">
                      Remaining Balance Due
                    </span>
                    <span className="text-base font-mono font-extrabold text-red-600 dark:text-red-400 block mt-1">
                      {formatCurrency(balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save & Print Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CREDIT NOTE MODAL */}
      <CreditNoteModal
        isOpen={isCnModalOpen}
        onClose={() => {
          setIsCnModalOpen(false);
          setCnSourceInvoice(null);
        }}
        sourceInvoice={cnSourceInvoice}
      />
    </div>
  );
};
