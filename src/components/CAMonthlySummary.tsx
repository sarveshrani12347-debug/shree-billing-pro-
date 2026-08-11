import React, { useState, useMemo } from "react";
import {
  FileCheck,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Share2,
  Search,
  Filter,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Printer,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Receipt,
  FileCode,
  DollarSign,
  Copy,
  ExternalLink,
  Ban,
  TrendingUp,
  X,
  Mail,
  Send,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useApp } from "../context/AppContext";
import { Invoice, DocumentType, InvoiceStatus } from "../types";
import { formatCurrency } from "../utils/gstUtils";
import { syncInvoiceToCASummary } from "../utils/caSummarySync";

// Financial Month definitions for Indian FY (April to March)
const FINANCIAL_MONTHS = [
  { index: 3, name: "April", code: "04" },
  { index: 4, name: "May", code: "05" },
  { index: 5, name: "June", code: "06" },
  { index: 6, name: "July", code: "07" },
  { index: 7, name: "August", code: "08" },
  { index: 8, name: "September", code: "09" },
  { index: 9, name: "October", code: "10" },
  { index: 10, name: "November", code: "11" },
  { index: 11, name: "December", code: "12" },
  { index: 0, name: "January", code: "01" },
  { index: 1, name: "February", code: "02" },
  { index: 2, name: "March", code: "03" },
];

/**
 * Calculates Indian Financial Year string (e.g. FY 2026–27) for a given year & month index (0-11)
 */
function getFinancialYearStr(year: number, monthIndex: number): string {
  // If month is Jan, Feb, Mar (0, 1, 2)
  if (monthIndex < 3) {
    const startYr = year - 1;
    const endYrShort = String(year).slice(-2);
    return `FY ${startYr}–${endYrShort}`;
  } else {
    const startYr = year;
    const endYrShort = String(year + 1).slice(-2);
    return `FY ${startYr}–${endYrShort}`;
  }
}

export const CAMonthlySummary: React.FC = () => {
  const { invoices, profile, setActiveTab, showToast, logAudit } = useApp();

  // Current system date defaults
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth(); // 0 to 11

  // State for Month Selection
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Custom Date Range Toggle
  const [useCustomRange, setUseCustomRange] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [gstTypeFilter, setGstTypeFilter] = useState<string>("all"); // 'all' | 'intra' | 'inter'
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taxRateFilter, setTaxRateFilter] = useState<string>("all");
  const [gstinFilter, setGstinFilter] = useState<string>("all"); // 'all' | 'registered' | 'unregistered'

  // Count active applied filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (docTypeFilter !== "all") count++;
    if (gstTypeFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (taxRateFilter !== "all") count++;
    if (gstinFilter !== "all") count++;
    if (useCustomRange) count++;
    return count;
  }, [searchTerm, docTypeFilter, gstTypeFilter, statusFilter, taxRateFilter, gstinFilter, useCustomRange]);

  // Reset all search and filter fields
  const handleResetFilters = () => {
    setSearchTerm("");
    setDocTypeFilter("all");
    setGstTypeFilter("all");
    setStatusFilter("all");
    setTaxRateFilter("all");
    setGstinFilter("all");
    setUseCustomRange(false);
    showToast("All filters and search reset", "info");
  };

  // Finalization / Lock State (Stored per business & month/year)
  const [finalizedMonths, setFinalizedMonths] = useState<Record<string, { finalizedAt: string; finalizedBy: string }>>(() => {
    const saved = localStorage.getItem("shree_ca_finalized_months");
    return saved ? JSON.parse(saved) : {};
  });

  const [showFinalizeModal, setShowFinalizeModal] = useState<boolean>(false);
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState<boolean>(false);

  // Manual trigger to re-sync all current period invoices to Firestore
  const handleSyncAllToFirestore = async () => {
    if (periodInvoices.length === 0) {
      showToast("No invoices in selected period to sync", "info");
      return;
    }
    setIsSyncingFirestore(true);
    let synced = 0;
    for (const inv of periodInvoices) {
      const action = inv.status === "cancelled" ? "cancel" : "edit";
      const res = await syncInvoiceToCASummary(inv, action, profile.state);
      if (res.success) synced++;
    }
    setIsSyncingFirestore(false);
    showToast(`Synced ${synced} period invoices to Firestore CA Monthly Summary collection!`, "success");
    logAudit("CA Summary", "Firestore Bulk Sync", `Synced ${synced} invoices to ca_monthly_summaries collection`);
  };

  // Computed FY Label
  const currentFyStr = getFinancialYearStr(selectedYear, selectedMonthIdx);
  const monthObj = FINANCIAL_MONTHS.find((m) => m.index === selectedMonthIdx) || FINANCIAL_MONTHS[0];
  const monthKey = `${selectedYear}-${monthObj.code}`;
  const isFinalized = !!finalizedMonths[monthKey];

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    let newMonthIdx = selectedMonthIdx - 1;
    let newYear = selectedYear;
    if (newMonthIdx < 0) {
      newMonthIdx = 11;
      newYear -= 1;
    }
    setSelectedMonthIdx(newMonthIdx);
    setSelectedYear(newYear);
  };

  const handleNextMonth = () => {
    let newMonthIdx = selectedMonthIdx + 1;
    let newYear = selectedYear;
    if (newMonthIdx > 11) {
      newMonthIdx = 0;
      newYear += 1;
    }
    setSelectedMonthIdx(newMonthIdx);
    setSelectedYear(newYear);
  };

  // Filter invoices belonging to selected period
  const periodInvoices = useMemo(() => {
    return (invoices || []).filter((inv) => {
      if (!inv || !inv.date) return false;
      const invDate = new Date(inv.date);
      if (isNaN(invDate.getTime())) return false;

      if (useCustomRange) {
        const start = new Date(customStartDate + "T00:00:00");
        const end = new Date(customEndDate + "T23:59:59");
        return invDate >= start && invDate <= end;
      } else {
        return invDate.getMonth() === selectedMonthIdx && invDate.getFullYear() === selectedYear;
      }
    });
  }, [invoices, selectedMonthIdx, selectedYear, useCustomRange, customStartDate, customEndDate]);

  // Process Invoices with calculated breakdown
  const processedRecords = useMemo(() => {
    return (periodInvoices || []).map((inv) => {
      const isInterState =
        inv.partyState && profile?.state
          ? inv.partyState.trim().toLowerCase() !== profile.state.trim().toLowerCase()
          : false;

      // Extract taxable, taxes, additional charges
      let taxableAmount = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      if (inv.items && inv.items.length > 0) {
        inv.items.forEach((item) => {
          const itemTaxable = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
          taxableAmount += itemTaxable;

          if (isInterState) {
            igstAmount += item.igstAmount || (itemTaxable * (item.taxRate || 0)) / 100;
          } else {
            cgstAmount += item.cgstAmount || (itemTaxable * (item.taxRate || 0)) / 200;
            sgstAmount += item.sgstAmount || (itemTaxable * (item.taxRate || 0)) / 200;
          }
        });
      } else {
        taxableAmount = inv.subtotal || 0;
        const totalTax = inv.totalTax || 0;
        if (isInterState) {
          igstAmount = totalTax;
        } else {
          cgstAmount = totalTax / 2;
          sgstAmount = totalTax / 2;
        }
      }

      // Additional charges
      const otherCharges = (inv.additionalCharges || []).reduce((sum, c) => sum + (c.amount || 0), 0);
      const totalGst = cgstAmount + sgstAmount + igstAmount;
      const billAmount = inv.totalAmount || taxableAmount + totalGst + otherCharges;

      const hasGstin = !!(inv.partyGstin && inv.partyGstin.trim().length >= 5);
      const gstinDisplay = hasGstin ? inv.partyGstin.trim().toUpperCase() : "Unregistered / GSTIN not available";

      return {
        ...inv,
        isInterState,
        hasGstin,
        gstinDisplay,
        taxableAmount: Number(taxableAmount.toFixed(2)),
        cgstAmount: Number(cgstAmount.toFixed(2)),
        sgstAmount: Number(sgstAmount.toFixed(2)),
        igstAmount: Number(igstAmount.toFixed(2)),
        totalGst: Number(totalGst.toFixed(2)),
        otherCharges: Number(otherCharges.toFixed(2)),
        billAmount: Number(billAmount.toFixed(2)),
      };
    });
  }, [periodInvoices, profile?.state]);

  // Filtered Records based on UI filters & search
  const filteredRecords = useMemo(() => {
    return (processedRecords || []).filter((rec) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = rec.partyName?.toLowerCase().includes(query);
        const matchesInvNo = rec.invoiceNumber?.toLowerCase().includes(query);
        const matchesGstin = rec.partyGstin?.toLowerCase().includes(query);
        if (!matchesName && !matchesInvNo && !matchesGstin) return false;
      }

      // Doc Type
      if (docTypeFilter !== "all" && rec.docType !== docTypeFilter) return false;

      // GST Type (Intra vs Inter)
      if (gstTypeFilter === "intra" && rec.isInterState) return false;
      if (gstTypeFilter === "inter" && !rec.isInterState) return false;

      // Status Filter
      if (statusFilter !== "all" && rec.status !== statusFilter) return false;

      // GSTIN Filter
      if (gstinFilter === "registered" && !rec.hasGstin) return false;
      if (gstinFilter === "unregistered" && rec.hasGstin) return false;

      // Tax Rate Filter
      if (taxRateFilter !== "all") {
        const rateNum = parseFloat(taxRateFilter);
        const hasRate = rec.items?.some((item) => Number(item.taxRate) === rateNum);
        if (!hasRate) return false;
      }

      return true;
    });
  }, [processedRecords, searchTerm, docTypeFilter, gstTypeFilter, statusFilter, gstinFilter, taxRateFilter]);

  // Aggregate Totals (Excludes Cancelled Invoices from active Sales & Tax liability)
  const activeRecords = useMemo(() => {
    return (filteredRecords || []).filter((r) => r.status !== "cancelled");
  }, [filteredRecords]);

  const cancelledRecords = useMemo(() => {
    return (filteredRecords || []).filter((r) => r.status === "cancelled");
  }, [filteredRecords]);

  const creditNotes = useMemo(() => {
    return (activeRecords || []).filter((r) => r.docType === "credit_note");
  }, [activeRecords]);

  const debitNotes = useMemo(() => {
    return (activeRecords || []).filter((r) => r.docType === "debit_note");
  }, [activeRecords]);

  const normalInvoices = useMemo(() => {
    return (activeRecords || []).filter((r) => r.docType !== "credit_note" && r.docType !== "debit_note");
  }, [activeRecords]);

  // Financial Calculations
  const totals = useMemo(() => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalOtherCharges = 0;
    let totalBillAmount = 0;

    activeRecords.forEach((r) => {
      const factor = r.docType === "credit_note" ? -1 : 1;
      totalTaxable += r.taxableAmount * factor;
      totalCgst += r.cgstAmount * factor;
      totalSgst += r.sgstAmount * factor;
      totalIgst += r.igstAmount * factor;
      totalOtherCharges += r.otherCharges * factor;
      totalBillAmount += r.billAmount * factor;
    });

    const totalGst = totalCgst + totalSgst + totalIgst;

    return {
      count: activeRecords.length,
      normalCount: normalInvoices.length,
      creditNoteCount: creditNotes.length,
      debitNoteCount: debitNotes.length,
      cancelledCount: cancelledRecords.length,
      totalTaxable: Number(totalTaxable.toFixed(2)),
      totalCgst: Number(totalCgst.toFixed(2)),
      totalSgst: Number(totalSgst.toFixed(2)),
      totalIgst: Number(totalIgst.toFixed(2)),
      totalGst: Number(totalGst.toFixed(2)),
      totalOtherCharges: Number(totalOtherCharges.toFixed(2)),
      totalBillAmount: Number(totalBillAmount.toFixed(2)),
    };
  }, [activeRecords, normalInvoices, creditNotes, debitNotes, cancelledRecords]);

  // Handle Finalize Month
  const handleConfirmFinalize = () => {
    const updated = {
      ...finalizedMonths,
      [monthKey]: {
        finalizedAt: new Date().toISOString(),
        finalizedBy: profile.name || "Owner",
      },
    };
    setFinalizedMonths(updated);
    localStorage.setItem("shree_ca_finalized_months", JSON.stringify(updated));
    setShowFinalizeModal(false);
    showToast(`Month ${monthObj.name} ${selectedYear} finalized and locked for CA reporting`, "success");
    logAudit("CA Summary", "Finalize Month", `Finalized CA GST Summary for ${monthObj.name} ${selectedYear}`);
  };

  // Handle Reopen Month
  const handleConfirmReopen = () => {
    const updated = { ...finalizedMonths };
    delete updated[monthKey];
    setFinalizedMonths(updated);
    localStorage.setItem("shree_ca_finalized_months", JSON.stringify(updated));
    setShowReopenModal(false);
    showToast(`Month ${monthObj.name} ${selectedYear} unlocked for modifications`, "info");
    logAudit("CA Summary", "Reopen Month", `Reopened CA GST Summary for ${monthObj.name} ${selectedYear}`);
  };

  // Build Excel Workbook Helper
  const buildExcelWorkbook = () => {
    const dataRows = filteredRecords.map((r, index) => ({
      "Sr. No.": index + 1,
      "Invoice No.": r.invoiceNumber,
      "Date": r.date,
      "Document Type": r.docType.toUpperCase().replace("_", " "),
      "Customer Name": r.partyName,
      "GSTIN": r.gstinDisplay,
      "Place of Supply": r.partyState || profile.state || "N/A",
      "GST Type": r.isInterState ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)",
      "Taxable Amount (₹)": r.taxableAmount,
      "CGST (₹)": r.cgstAmount,
      "SGST (₹)": r.sgstAmount,
      "IGST (₹)": r.igstAmount,
      "Total GST (₹)": r.totalGst,
      "Other Charges (₹)": r.otherCharges,
      "Bill Amount (₹)": r.billAmount,
      "Status": r.status.toUpperCase(),
    }));

    if (dataRows.length > 0) {
      dataRows.push({
        "Sr. No.": "TOTAL",
        "Invoice No.": `${totals.count} Invoices`,
        "Date": "-",
        "Document Type": "SUMMARY",
        "Customer Name": "MONTH TOTALS",
        "GSTIN": "-",
        "Place of Supply": "-",
        "GST Type": "-",
        "Taxable Amount (₹)": totals.totalTaxable,
        "CGST (₹)": totals.totalCgst,
        "SGST (₹)": totals.totalSgst,
        "IGST (₹)": totals.totalIgst,
        "Total GST (₹)": totals.totalGst,
        "Other Charges (₹)": totals.totalOtherCharges,
        "Bill Amount (₹)": totals.totalBillAmount,
        "Status": isFinalized ? "LOCKED" : "ACTIVE",
      } as any);
    }

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CA_Monthly_Summary");
    return workbook;
  };

  // Export Excel Functionality
  const handleExportExcel = () => {
    try {
      const workbook = buildExcelWorkbook();
      const fileName = `${profile.name.replace(/[^a-zA-Z0-9]/g, "_")}_CA_GST_Summary_${monthObj.name}_${selectedYear}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      showToast(`Exported Excel summary: ${fileName}`, "success");
      logAudit("CA Summary", "Export Excel", `Exported CA Excel summary for ${monthObj.name} ${selectedYear}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to generate Excel file", "error");
    }
  };

  // Build CSV Content Helper
  const buildCsvContent = (): string => {
    const headers = [
      "Sr. No.",
      "Invoice No.",
      "Date",
      "Doc Type",
      "Customer Name",
      "GSTIN",
      "Place of Supply",
      "Taxable Amount",
      "CGST",
      "SGST",
      "IGST",
      "Total GST",
      "Other Charges",
      "Bill Amount",
      "Status",
    ];

    const csvRows = [headers.join(",")];

    filteredRecords.forEach((r, idx) => {
      const row = [
        idx + 1,
        `"${r.invoiceNumber}"`,
        `"${r.date}"`,
        `"${r.docType}"`,
        `"${r.partyName.replace(/"/g, '""')}"`,
        `"${r.gstinDisplay}"`,
        `"${r.partyState || profile.state}"`,
        r.taxableAmount,
        r.cgstAmount,
        r.sgstAmount,
        r.igstAmount,
        r.totalGst,
        r.otherCharges,
        r.billAmount,
        `"${r.status}"`,
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  };

  // Export CSV Functionality
  const handleExportCsv = () => {
    try {
      const csvString = buildCsvContent();
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${profile.name.replace(/[^a-zA-Z0-9]/g, "_")}_CA_Summary_${monthObj.name}_${selectedYear}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("CSV file downloaded successfully", "success");
      logAudit("CA Summary", "Export CSV", `Exported CSV summary for ${monthObj.name} ${selectedYear}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to export CSV", "error");
    }
  };

  // Build PDF Document Helper
  const buildPdfDoc = () => {
    const doc = new jsPDF("landscape", "mm", "a4");

    // Business Header
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, 297, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(profile.name || "Billing Pro+ Business", 14, 12);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`GSTIN: ${profile.gstin || "N/A"}  |  PAN: ${profile.pan || "N/A"}  |  Ph: ${profile.phone || "N/A"}`, 14, 18);
    doc.text(`Report Period: ${monthObj.name} ${selectedYear} (${currentFyStr})`, 14, 23);

    // Title Banner
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("CA MONTHLY GST & BILL SUMMARY REPORT", 14, 37);

    // Metric Summary Boxes
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const metricBox = (x: number, y: number, w: number, h: number, title: string, value: string, colorRgb: [number, number, number]) => {
      doc.setFillColor(...colorRgb);
      doc.roundedRect(x, y, w, h, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(title, x + 3, y + 5);
      doc.setFontSize(10);
      doc.text(value, x + 3, y + 12);
      doc.setFontSize(8);
    };

    metricBox(14, 42, 42, 16, "INVOICES COUNT", `${totals.count} Bills`, [79, 70, 229]);
    metricBox(60, 42, 44, 16, "TAXABLE VALUE", formatCurrency(totals.totalTaxable), [16, 185, 129]);
    metricBox(108, 42, 44, 16, "CGST + SGST", formatCurrency(totals.totalCgst + totals.totalSgst), [245, 158, 11]);
    metricBox(156, 42, 44, 16, "IGST TOTAL", formatCurrency(totals.totalIgst), [139, 92, 246]);
    metricBox(204, 42, 44, 16, "TOTAL GST", formatCurrency(totals.totalGst), [225, 29, 72]);
    metricBox(252, 42, 31, 16, "BILL TOTAL", formatCurrency(totals.totalBillAmount), [15, 23, 42]);

    // Table Data Preparation
    const tableData = filteredRecords.map((r, i) => [
      i + 1,
      r.invoiceNumber,
      r.date,
      r.partyName,
      r.gstinDisplay.length > 18 ? r.gstinDisplay.slice(0, 18) + "..." : r.gstinDisplay,
      formatCurrency(r.taxableAmount),
      formatCurrency(r.cgstAmount),
      formatCurrency(r.sgstAmount),
      formatCurrency(r.igstAmount),
      formatCurrency(r.totalGst),
      formatCurrency(r.otherCharges),
      formatCurrency(r.billAmount),
      r.status.toUpperCase(),
    ]);

    // Add Totals Footer Row
    tableData.push([
      "TOTAL",
      `${totals.count} Invoices`,
      "-",
      "MONTH TOTALS",
      "-",
      formatCurrency(totals.totalTaxable),
      formatCurrency(totals.totalCgst),
      formatCurrency(totals.totalSgst),
      formatCurrency(totals.totalIgst),
      formatCurrency(totals.totalGst),
      formatCurrency(totals.totalOtherCharges),
      formatCurrency(totals.totalBillAmount),
      isFinalized ? "LOCKED" : "ACTIVE",
    ]);

    autoTable(doc, {
      startY: 63,
      head: [
        [
          "Sr",
          "Invoice No",
          "Date",
          "Customer Name",
          "GSTIN",
          "Taxable (₹)",
          "CGST (₹)",
          "SGST (₹)",
          "IGST (₹)",
          "Total GST",
          "Charges",
          "Bill Amt (₹)",
          "Status",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 24 },
        2: { cellWidth: 20 },
        3: { cellWidth: 42 },
        4: { cellWidth: 38 },
        5: { cellWidth: 22, halign: "right" },
        6: { cellWidth: 18, halign: "right" },
        7: { cellWidth: 18, halign: "right" },
        8: { cellWidth: 18, halign: "right" },
        9: { cellWidth: 20, halign: "right" },
        10: { cellWidth: 16, halign: "right" },
        11: { cellWidth: 24, halign: "right" },
        12: { cellWidth: 18, halign: "center" },
      },
      didParseCell: (data) => {
        // Highlight total row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [15, 23, 42];
        }
      },
    });

    // Footer Notes & Signature Box
    const finalY = (doc as any).lastAutoTable.finalY || 180;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Generated on ${new Date().toLocaleString("en-IN")} by Billing Pro+. This document contains verified monthly GST summary for CA auditing.`,
      14,
      finalY + 12
    );

    // Signature
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`For ${profile.name}`, 220, finalY + 12);
    doc.text("Authorized Signatory / Proprietor", 220, finalY + 22);

    return doc;
  };

  // Export PDF Functionality
  const handleExportPdf = () => {
    try {
      const doc = buildPdfDoc();
      const fileName = `${profile.name.replace(/[^a-zA-Z0-9]/g, "_")}_CA_GST_Summary_${monthObj.name}_${selectedYear}.pdf`;
      doc.save(fileName);

      showToast(`Generated CA PDF summary: ${fileName}`, "success");
      logAudit("CA Summary", "Export PDF", `Exported CA PDF summary for ${monthObj.name} ${selectedYear}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to generate PDF report", "error");
    }
  };

  // Share with CA Functionality
  const handleShareReport = () => {
    setShowShareModal(true);
  };

  // Web Share API with File Attachment (PDF / Excel / CSV)
  const handleShareFile = async (fileType: "pdf" | "excel" | "csv") => {
    const summaryText = `*CA MONTHLY GST & BILL SUMMARY*\n🏢 *${profile.name}* (GSTIN: ${profile.gstin || "N/A"})\n📅 *Period:* ${monthObj.name} ${selectedYear} (${currentFyStr})\n-------------------------------\n🧾 *Total Invoices:* ${totals.count}\n💰 *Taxable Sales:* ${formatCurrency(totals.totalTaxable)}\n🏛️ *CGST:* ${formatCurrency(totals.totalCgst)}\n🏛️ *SGST:* ${formatCurrency(totals.totalSgst)}\n🏛️ *IGST:* ${formatCurrency(totals.totalIgst)}\n✨ *Total GST:* ${formatCurrency(totals.totalGst)}\n💵 *Grand Bill Amount:* ${formatCurrency(totals.totalBillAmount)}\n-------------------------------\n_Generated via Billing Pro+ GST Module_`;

    try {
      let file: File;
      const cleanName = profile.name.replace(/[^a-zA-Z0-9]/g, "_");

      if (fileType === "pdf") {
        const doc = buildPdfDoc();
        const pdfBlob = doc.output("blob");
        const fileName = `${cleanName}_CA_GST_Summary_${monthObj.name}_${selectedYear}.pdf`;
        file = new File([pdfBlob], fileName, { type: "application/pdf" });
      } else if (fileType === "excel") {
        const wb = buildExcelWorkbook();
        const arrayBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const fileName = `${cleanName}_CA_GST_Summary_${monthObj.name}_${selectedYear}.xlsx`;
        file = new File([arrayBuf], fileName, {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
      } else {
        const csvString = buildCsvContent();
        const fileName = `${cleanName}_CA_Summary_${monthObj.name}_${selectedYear}.csv`;
        file = new File([csvString], fileName, { type: "text/csv;charset=utf-8;" });
      }

      if (navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${profile.name} - CA Monthly GST Summary (${fileType.toUpperCase()})`,
            text: summaryText,
            files: [file],
          });
          showToast(`Shared ${fileType.toUpperCase()} report via native share dialog!`, "success");
          logAudit("CA Summary", "Share Report", `Shared CA ${fileType.toUpperCase()} file via Web Share API`);
          return;
        }

        // Fallback to sharing text summary via navigator.share
        await navigator.share({
          title: `${profile.name} - CA Monthly GST Summary`,
          text: summaryText,
        });
        showToast("Summary text shared via system dialog", "success");
        logAudit("CA Summary", "Share Report", "Shared CA report text via Web Share API");
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(summaryText);
        showToast("CA Summary text copied to clipboard! Ready to paste.", "info");
        logAudit("CA Summary", "Share Report", "Copied CA report summary to clipboard");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Web share error:", err);
        showToast("Share cancelled or not supported by browser", "info");
      }
    }
  };

  const handleNativeShare = async () => {
    const summaryText = `*CA MONTHLY GST & BILL SUMMARY*\n🏢 *${profile.name}* (GSTIN: ${profile.gstin || "N/A"})\n📅 *Period:* ${monthObj.name} ${selectedYear} (${currentFyStr})\n-------------------------------\n🧾 *Total Invoices:* ${totals.count}\n💰 *Taxable Sales:* ${formatCurrency(totals.totalTaxable)}\n🏛️ *CGST:* ${formatCurrency(totals.totalCgst)}\n🏛️ *SGST:* ${formatCurrency(totals.totalSgst)}\n🏛️ *IGST:* ${formatCurrency(totals.totalIgst)}\n✨ *Total GST:* ${formatCurrency(totals.totalGst)}\n💵 *Grand Bill Amount:* ${formatCurrency(totals.totalBillAmount)}\n-------------------------------\n_Generated via Billing Pro+ GST Module_`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} - CA Monthly GST Summary`,
          text: summaryText,
        });
        showToast("Summary shared successfully", "success");
        logAudit("CA Summary", "Share Report", "Shared CA report text via Web Share API");
      } catch {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(summaryText);
      showToast("CA Summary text copied to clipboard! Ready to paste on WhatsApp / Email.", "info");
      logAudit("CA Summary", "Share Report", "Copied CA report summary to clipboard");
    }
  };

  const handleShareWhatsApp = () => {
    const summaryText = `*CA MONTHLY GST %26 BILL SUMMARY*%0A🏢 *${encodeURIComponent(profile.name)}* (GSTIN: ${profile.gstin || "N/A"})%0A📅 *Period:* ${monthObj.name} ${selectedYear} (${currentFyStr})%0A-------------------------------%0A🧾 *Total Invoices:* ${totals.count}%0A💰 *Taxable Sales:* ${encodeURIComponent(formatCurrency(totals.totalTaxable))}%0A🏛️ *CGST:* ${encodeURIComponent(formatCurrency(totals.totalCgst))}%0A🏛️ *SGST:* ${encodeURIComponent(formatCurrency(totals.totalSgst))}%0A🏛️ *IGST:* ${encodeURIComponent(formatCurrency(totals.totalIgst))}%0A✨ *Total GST:* ${encodeURIComponent(formatCurrency(totals.totalGst))}%0A💵 *Grand Bill Amount:* ${encodeURIComponent(formatCurrency(totals.totalBillAmount))}%0A-------------------------------%0A_Generated via Billing Pro+ GST Module_`;
    window.open(`https://api.whatsapp.com/send?text=${summaryText}`, "_blank");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`${profile.name} - CA Monthly GST Summary (${monthObj.name} ${selectedYear})`);
    const body = encodeURIComponent(`CA MONTHLY GST & BILL SUMMARY\nBusiness: ${profile.name} (GSTIN: ${profile.gstin || "N/A"})\nPeriod: ${monthObj.name} ${selectedYear} (${currentFyStr})\n\nSUMMARY BREAKDOWN:\n- Total Invoices: ${totals.count}\n- Taxable Sales: ${formatCurrency(totals.totalTaxable)}\n- CGST: ${formatCurrency(totals.totalCgst)}\n- SGST: ${formatCurrency(totals.totalSgst)}\n- IGST: ${formatCurrency(totals.totalIgst)}\n- Total GST: ${formatCurrency(totals.totalGst)}\n- Grand Bill Amount: ${formatCurrency(totals.totalBillAmount)}\n\nReport generated via Billing Pro+ GST Module.`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  return (
    <div className="space-y-6">
      {/* HEADER & PERIOD SELECTOR BAR */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                  <span>CA Monthly GST & Bill Summary</span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 flex items-center gap-1 shadow-2xs"
                    title="CA Monthly Summary collection is automatically synced in Firestore using Invoice ID"
                  >
                    <ShieldCheck className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                    <span>FIRESTORE LIVE SYNCED</span>
                  </span>
                  {isFinalized && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>FINALIZED & LOCKED</span>
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automated GST & sales audit module for accountant sharing, GSTR-1, and GSTR-3B filings
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("invoicing")}
              className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Invoice</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileCode className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleShareReport}
              className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Report</span>
            </button>

            <button
              onClick={handleSyncAllToFirestore}
              disabled={isSyncingFirestore}
              className="px-3 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Sync all period invoices to Firestore CA Monthly Summary collection"
            >
              <ShieldCheck className={`w-4 h-4 ${isSyncingFirestore ? "animate-spin" : ""}`} />
              <span>{isSyncingFirestore ? "Syncing..." : "Sync Firestore"}</span>
            </button>

            {isFinalized ? (
              <button
                onClick={() => setShowReopenModal(true)}
                className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Reopen Month</span>
              </button>
            ) : (
              <button
                onClick={() => setShowFinalizeModal(true)}
                className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Finalize Month</span>
              </button>
            )}
          </div>
        </div>

        {/* PERIOD SELECTOR ROW */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Prev Month Button */}
            <button
              onClick={handlePrevMonth}
              disabled={useCustomRange}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all disabled:opacity-40 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedMonthIdx}
                onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
                disabled={useCustomRange}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer disabled:opacity-50"
              >
                {FINANCIAL_MONTHS.map((m) => (
                  <option key={m.index} value={m.index}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* Financial Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                disabled={useCustomRange}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 cursor-pointer disabled:opacity-50"
              >
                {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((yr) => (
                  <option key={yr} value={yr}>
                    FY {yr - 1}–{String(yr).slice(-2)} / {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Month Button */}
            <button
              onClick={handleNextMonth}
              disabled={useCustomRange}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all disabled:opacity-40 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            {/* Active Period Badge */}
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-black border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
              {useCustomRange ? `Custom Range: ${customStartDate} to ${customEndDate}` : `${monthObj.name} ${selectedYear} | ${currentFyStr}`}
            </span>
          </div>

          {/* CUSTOM DATE RANGE TOGGLE */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomRange}
                onChange={(e) => setUseCustomRange(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-slate-700 dark:text-slate-300">Custom Date Range</span>
            </label>

            {useCustomRange && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUMMARY STATS DASHBOARD CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Invoices Count */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Invoices</span>
            <Receipt className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {totals.normalCount} <span className="text-xs font-bold text-slate-400">bills</span>
          </div>
          {totals.cancelledCount > 0 && (
            <div className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
              <Ban className="w-3 h-3" />
              <span>{totals.cancelledCount} Cancelled</span>
            </div>
          )}
        </div>

        {/* Taxable Sales */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Taxable Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {formatCurrency(totals.totalTaxable)}
          </div>
          <div className="text-[10px] text-slate-400 font-bold">Base Value</div>
        </div>

        {/* CGST + SGST (Intra-State) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>CGST + SGST</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(totals.totalCgst + totals.totalSgst)}
          </div>
          <div className="text-[10px] text-slate-400 font-bold">Intra-State Sales</div>
        </div>

        {/* IGST (Inter-State) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>IGST</span>
            <ShieldCheck className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-lg font-black text-violet-600 dark:text-violet-400">
            {formatCurrency(totals.totalIgst)}
          </div>
          <div className="text-[10px] text-slate-400 font-bold">Inter-State Sales</div>
        </div>

        {/* Total GST */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20 space-y-1">
          <div className="flex items-center justify-between text-indigo-100 text-xs font-bold">
            <span>Total GST</span>
            <FileCode className="w-4 h-4 text-indigo-200" />
          </div>
          <div className="text-xl font-black text-white">{formatCurrency(totals.totalGst)}</div>
          <div className="text-[10px] text-indigo-200 font-bold">CGST + SGST + IGST</div>
        </div>

        {/* Grand Bill Amount */}
        <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Bills</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">{formatCurrency(totals.totalBillAmount)}</div>
          <div className="text-[10px] text-slate-400 font-bold">Grand Bill Revenue</div>
        </div>
      </div>

      {/* CREDIT NOTE & DEBIT NOTE SUMMARY BANNER (IF APPLICABLE) */}
      {(totals.creditNoteCount > 0 || totals.debitNoteCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Adjustments in Period: {totals.creditNoteCount} Credit Note(s) and {totals.debitNoteCount} Debit Note(s) detected.
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-bold">
            <div>Credit Notes: <span className="text-rose-600">{formatCurrency(creditNotes.reduce((sum, c) => sum + c.totalAmount, 0))}</span></div>
            <div>Debit Notes: <span className="text-emerald-600">{formatCurrency(debitNotes.reduce((sum, d) => sum + d.totalAmount, 0))}</span></div>
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS TOOLBAR CONTROLS */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        {/* Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Filter & Search Toolbar
            </h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {activeFilterCount} Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Download filtered report data as Excel spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export to Excel</span>
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset all search queries and active filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Row: Search Bar & Date Range Quick Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 text-xs">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Customer Name, Invoice No, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range Quick Selector / Custom Pickers */}
          <div className="md:col-span-6 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-1.5 px-2 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={useCustomRange}
                onChange={(e) => setUseCustomRange(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                Custom Range
              </span>
            </label>

            {useCustomRange ? (
              <div className="flex items-center gap-1.5 w-full animate-fadeIn">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-[11px]"
                />
                <span className="text-slate-400 font-bold text-[10px]">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-[11px]"
                />
              </div>
            ) : (
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 truncate">
                Active Period: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{monthObj.name} {selectedYear}</span>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Row: Specific GST Types, Tax Rates, Registration & Status Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {/* GST Type Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">GST Supply Type</label>
            <select
              value={gstTypeFilter}
              onChange={(e) => setGstTypeFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="all">All GST Types</option>
              <option value="intra">Intra-State (CGST + SGST)</option>
              <option value="inter">Inter-State (IGST)</option>
            </select>
          </div>

          {/* Tax Rate Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">GST Tax Rate</label>
            <select
              value={taxRateFilter}
              onChange={(e) => setTaxRateFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="all">All Tax Rates</option>
              <option value="0">0% (Exempt)</option>
              <option value="5">5% GST</option>
              <option value="12">12% GST</option>
              <option value="18">18% GST</option>
              <option value="28">28% GST</option>
            </select>
          </div>

          {/* GSTIN Customer Registration Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Customer Type</label>
            <select
              value={gstinFilter}
              onChange={(e) => setGstinFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="all">All Customers</option>
              <option value="registered">B2B (Registered with GSTIN)</option>
              <option value="unregistered">B2C (Unregistered)</option>
            </select>
          </div>

          {/* Doc Type Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Doc Type</label>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="all">All Doc Types</option>
              <option value="invoice">Sales Invoices</option>
              <option value="credit_note">Credit Notes</option>
              <option value="debit_note">Debit Notes</option>
              <option value="quotation">Quotations</option>
              <option value="proforma">Proforma</option>
              <option value="challan">Delivery Challans</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Invoice Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* CA MONTHLY ITEMIZATION TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Itemized Invoice Register ({filteredRecords.length} records)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            Single Source of Truth: Linked directly to Invoice Engine
          </span>
        </div>

        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3 w-10 text-center">Sr</th>
                <th className="py-3 px-3 min-w-[110px]">Invoice No</th>
                <th className="py-3 px-3 min-w-[90px]">Date</th>
                <th className="py-3 px-3 min-w-[150px]">Customer Name</th>
                <th className="py-3 px-3 min-w-[160px]">GSTIN</th>
                <th className="py-3 px-3 text-right min-w-[100px]">Taxable (₹)</th>
                <th className="py-3 px-3 text-right min-w-[80px]">CGST (₹)</th>
                <th className="py-3 px-3 text-right min-w-[80px]">SGST (₹)</th>
                <th className="py-3 px-3 text-right min-w-[80px]">IGST (₹)</th>
                <th className="py-3 px-3 text-right min-w-[90px]">Total GST (₹)</th>
                <th className="py-3 px-3 text-right min-w-[80px]">Charges</th>
                <th className="py-3 px-3 text-right min-w-[110px]">Bill Amount (₹)</th>
                <th className="py-3 px-3 text-center min-w-[90px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <FileCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="font-bold text-sm">No invoices found for the selected period or filters</p>
                    <p className="text-xs mt-1">Try selecting a different month, financial year, or clearing search filters.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const isCancelled = r.status === "cancelled";
                  const isCreditNote = r.docType === "credit_note";
                  const isDebitNote = r.docType === "debit_note";

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isCancelled ? "bg-rose-50/50 dark:bg-rose-950/20 opacity-60 line-through" : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-extrabold text-indigo-600 dark:text-indigo-400">
                        {r.invoiceNumber}
                        {isCreditNote && <span className="ml-1 text-[9px] px-1 bg-rose-100 text-rose-700 rounded">CN</span>}
                        {isDebitNote && <span className="ml-1 text-[9px] px-1 bg-emerald-100 text-emerald-700 rounded">DN</span>}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.date}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white max-w-[180px] truncate">{r.partyName}</td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {r.hasGstin ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
                            {r.partyGstin}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unregistered</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold">{formatCurrency(r.taxableAmount)}</td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(r.cgstAmount)}</td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(r.sgstAmount)}</td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(r.igstAmount)}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-indigo-600 dark:text-indigo-400">{formatCurrency(r.totalGst)}</td>
                      <td className="py-3 px-3 text-right text-slate-500">{formatCurrency(r.otherCharges)}</td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">{formatCurrency(r.billAmount)}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            r.status === "paid"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : r.status === "cancelled"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-xs">
                  <td colSpan={5} className="py-3.5 px-4">
                    MONTH TOTALS ({totals.count} Active Invoices)
                  </td>
                  <td className="py-3.5 px-3 text-right text-emerald-400">{formatCurrency(totals.totalTaxable)}</td>
                  <td className="py-3.5 px-3 text-right text-amber-300">{formatCurrency(totals.totalCgst)}</td>
                  <td className="py-3.5 px-3 text-right text-amber-300">{formatCurrency(totals.totalSgst)}</td>
                  <td className="py-3.5 px-3 text-right text-violet-300">{formatCurrency(totals.totalIgst)}</td>
                  <td className="py-3.5 px-3 text-right text-indigo-300">{formatCurrency(totals.totalGst)}</td>
                  <td className="py-3.5 px-3 text-right text-slate-300">{formatCurrency(totals.totalOtherCharges)}</td>
                  <td className="py-3.5 px-3 text-right text-emerald-300">{formatCurrency(totals.totalBillAmount)}</td>
                  <td className="py-3.5 px-3 text-center">
                    {isFinalized ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px]">LOCKED</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-indigo-500 text-white text-[10px]">ACTIVE</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* FINALIZE CONFIRMATION MODAL */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Finalize & Lock {monthObj.name} {selectedYear}?
                </h3>
                <p className="text-xs text-slate-500">Locking prevents accidental edits during CA filing</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Month & Financial Year:</span>
                <span className="text-indigo-600 dark:text-indigo-400">{monthObj.name} {selectedYear} ({currentFyStr})</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Total Active Invoices:</span>
                <span>{totals.count}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Total Taxable Value:</span>
                <span>{formatCurrency(totals.totalTaxable)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Total GST Amount:</span>
                <span className="text-indigo-600">{formatCurrency(totals.totalGst)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 dark:text-white text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Grand Bill Amount:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.totalBillAmount)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFinalize}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Confirm & Lock Month
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REOPEN CONFIRMATION MODAL */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Reopen {monthObj.name} {selectedYear}?
                </h3>
                <p className="text-xs text-slate-500">Unlocking will allow new invoices or edits for this period</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
              Note: Reopening a previously finalized month will allow you to add or modify invoices. Always notify your accountant if filing was already completed.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowReopenModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReopen}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-extrabold hover:bg-amber-700 text-xs shadow-md shadow-amber-600/20 cursor-pointer"
              >
                Reopen Month
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE REPORT MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Share CA Monthly GST Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    {monthObj.name} {selectedYear} ({currentFyStr}) • {totals.count} Invoices
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Financial Summary Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Taxable Sales:</span>
                <span>{formatCurrency(totals.totalTaxable)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Total GST Liability:</span>
                <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(totals.totalGst)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 dark:text-white text-sm pt-1.5 border-t border-slate-200 dark:border-slate-700">
                <span>Grand Bill Amount:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.totalBillAmount)}</span>
              </div>
            </div>

            {/* Primary Native Platform Share with Files */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Native Web Share API (Attach File to OS Share Dialog)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleShareFile("pdf")}
                  className="py-2.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share PDF</span>
                </button>

                <button
                  onClick={() => handleShareFile("excel")}
                  className="py-2.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Excel</span>
                </button>

                <button
                  onClick={() => handleShareFile("csv")}
                  className="py-2.5 px-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[11px] transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share CSV</span>
                </button>
              </div>

              <button
                onClick={handleNativeShare}
                className="w-full mt-1.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Send className="w-4 h-4 text-indigo-500" />
                <span>Share Text Summary via Native OS Dialog</span>
              </button>
            </div>

            {/* Social & Direct Apps */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>

              <button
                onClick={handleShareEmail}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Share via Email</span>
              </button>
            </div>

            {/* Download Files Quick Launch */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Download & Attach Files</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleExportPdf}
                  className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>PDF Report</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel Sheet</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-teal-600" />
                  <span>CSV File</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
