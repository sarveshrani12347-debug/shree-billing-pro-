import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Printer,
  ShoppingBag,
  PieChart as PieChartIcon,
  ShieldCheck,
  Award,
  Percent,
  ArrowUpRight,
  Zap,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Building2,
  PhoneCall,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  UserCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { useApp } from "../context/AppContext";
import { Invoice, Purchase, Party } from "../types";
import { CAMonthlySummary } from "./CAMonthlySummary";

const COLORS = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#3B82F6", // Blue
];

export const Reports: React.FC = () => {
  const { invoices, purchases, expenses, products, parties, profile, showToast } = useApp();

  const [reportType, setReportType] = useState<
    | "ca_summary"
    | "monthly_summary"
    | "custom_export"
    | "pnl"
    | "sales"
    | "purchases"
    | "gst"
    | "stock"
    | "customer_dues"
    | "supplier_dues"
    | "expenses"
  >("monthly_summary");

  // Custom Date Range Excel Exporter State
  const [customExportType, setCustomExportType] = useState<"sales" | "purchases" | "pnl">("sales");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [presetSelection, setPresetSelection] = useState<string>("this_month");

  // Period Filters for financial reports: weekly, monthly, yearly, all
  const [salesPeriod, setSalesPeriod] = useState<"weekly" | "monthly" | "yearly" | "all">("monthly");
  const [purchasesPeriod, setPurchasesPeriod] = useState<"weekly" | "monthly" | "yearly" | "all">("monthly");
  const [pnlPeriod, setPnlPeriod] = useState<"weekly" | "monthly" | "yearly" | "all">("monthly");

  // Basic Financial Totals
  const safeInvoices = invoices || [];
  const safePurchases = purchases || [];
  const safeExpenses = expenses || [];
  const safeProducts = products || [];
  const safeParties = parties || [];

  const validInvoices = safeInvoices.filter(
    (i) => i.docType === "invoice" && i.status !== "cancelled"
  );
  const totalSales = validInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPurchases = safePurchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalExpenses = safeExpenses.reduce((acc, e) => acc + e.amount, 0);

  const grossProfit = totalSales - totalPurchases;
  const netProfit = totalSales - totalPurchases - totalExpenses;
  const grossMarginPct = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : "0.0";
  const netMarginPct = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0.0";
  const avgInvoiceVal = validInvoices.length > 0 ? Math.round(totalSales / validInvoices.length) : 0;

  const totalStockValue = safeProducts.reduce((acc, p) => acc + p.stockQuantity * p.purchasePrice, 0);

  // Customer Dues
  const totalCustomerDue = safeParties
    .filter((p) => p.type === "customer" && p.balanceType === "collect")
    .reduce((acc, p) => acc + p.openingBalance, 0);

  // GST Summary
  const gstCollected = validInvoices.reduce((acc, i) => acc + i.totalTax, 0);
  const gstInputCredit = safePurchases.reduce((acc, p) => acc + (p.totalTax || 0), 0);
  const netGstPayable = Math.max(0, gstCollected - gstInputCredit);

  // ==========================================
  // 1. SUPPLIER DUES (PAYABLE OUTSTANDING)
  // ==========================================
  interface SupplierDueRecord {
    id: string;
    supplierName: string;
    phone: string;
    gstin?: string;
    state?: string;
    openingBalanceDue: number;
    purchasesTotal: number;
    amountPaid: number;
    purchasesDue: number;
    totalDue: number;
    billCount: number;
  }

  const vendorParties = safeParties.filter((p) => p.type === "vendor");

  const supplierDuesMap: Record<string, SupplierDueRecord> = {};

  // First seed from vendor parties list
  vendorParties.forEach((vendor) => {
    const openingDue = vendor.balanceType === "pay" ? vendor.openingBalance : 0;
    supplierDuesMap[vendor.name.toLowerCase()] = {
      id: vendor.id,
      supplierName: vendor.name,
      phone: vendor.phone || "N/A",
      gstin: vendor.gstin || "",
      state: vendor.state || profile.state,
      openingBalanceDue: openingDue,
      purchasesTotal: 0,
      amountPaid: 0,
      purchasesDue: 0,
      totalDue: openingDue,
      billCount: 0,
    };
  });

  // Calculate from Purchases
  purchases.forEach((pur) => {
    const key = pur.supplierName.toLowerCase().trim();
    const purTotal = pur.totalAmount || 0;
    const purPaid = pur.amountPaid ?? purTotal;
    const purDue = pur.balanceDue ?? Math.max(0, purTotal - purPaid);

    if (!supplierDuesMap[key]) {
      supplierDuesMap[key] = {
        id: pur.partyId || `supp-${pur.id}`,
        supplierName: pur.supplierName,
        phone: pur.supplierPhone || "N/A",
        gstin: pur.supplierGstin || "",
        state: profile.state,
        openingBalanceDue: 0,
        purchasesTotal: 0,
        amountPaid: 0,
        purchasesDue: 0,
        totalDue: 0,
        billCount: 0,
      };
    }

    supplierDuesMap[key].purchasesTotal += purTotal;
    supplierDuesMap[key].amountPaid += purPaid;
    supplierDuesMap[key].purchasesDue += purDue;
    supplierDuesMap[key].billCount += 1;
    supplierDuesMap[key].totalDue += purDue;
  });

  let supplierDuesList = Object.values(supplierDuesMap).sort((a, b) => b.totalDue - a.totalDue);

  // Fallback seed data if no vendor or purchase exist yet for demonstration
  if (supplierDuesList.length === 0) {
    supplierDuesList = [
      {
        id: "v1",
        supplierName: "Mahaveer Wholesalers & Distributors",
        phone: "9825098765",
        gstin: "24AAACM1234F1Z2",
        state: "Gujarat",
        openingBalanceDue: 12500,
        purchasesTotal: 85000,
        amountPaid: 70000,
        purchasesDue: 15000,
        totalDue: 27500,
        billCount: 4,
      },
      {
        id: "v2",
        supplierName: "Apex FMCG Agencies Pvt Ltd",
        phone: "9898011223",
        gstin: "24AABCA9988H1Z5",
        state: "Gujarat",
        openingBalanceDue: 5000,
        purchasesTotal: 42000,
        amountPaid: 35000,
        purchasesDue: 7000,
        totalDue: 12000,
        billCount: 3,
      },
      {
        id: "v3",
        supplierName: "Shree Ram Packaging Traders",
        phone: "9712345678",
        gstin: "24ABCPT5544K1Z9",
        state: "Gujarat",
        openingBalanceDue: 0,
        purchasesTotal: 18500,
        amountPaid: 14000,
        purchasesDue: 45000,
        totalDue: 4500,
        billCount: 2,
      },
    ];
  }

  const totalSupplierPayableDue = supplierDuesList.reduce((sum, s) => sum + s.totalDue, 0);
  const totalSuppliersWithDues = supplierDuesList.filter((s) => s.totalDue > 0).length;

  // ==========================================
  // 2. PERIOD FILTERING & EXPORT LOGIC FOR SALES, PURCHASES, & P&L
  // ==========================================
  const now = new Date();

  const filterByPeriod = (dateStr: string, period: "weekly" | "monthly" | "yearly" | "all") => {
    if (period === "all" || !dateStr) return true;
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }
    }
    if (isNaN(d.getTime())) return true;

    const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);

    if (period === "weekly") {
      return diffDays <= 7 && diffDays >= -1;
    } else if (period === "monthly") {
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    } else if (period === "yearly") {
      return d.getFullYear() === now.getFullYear();
    }
    return true; // all
  };

  const getPeriodLabel = (period: "weekly" | "monthly" | "yearly" | "all") => {
    switch (period) {
      case "weekly":
        return "Weekly (Last 7 Days)";
      case "monthly":
        return `Monthly (${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()})`;
      case "yearly":
        return `Yearly (${now.getFullYear()})`;
      default:
        return "All Time Ledger";
    }
  };

  // --- A. Sales Period Calculations ---
  const periodFilteredInvoices = validInvoices.filter((inv) => filterByPeriod(inv.date, salesPeriod));
  const periodTotalSales = periodFilteredInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const periodTotalTax = periodFilteredInvoices.reduce((sum, i) => sum + i.totalTax, 0);

  // --- B. Purchases Period Calculations ---
  const periodFilteredPurchases = purchases.filter((pur) => filterByPeriod(pur.date, purchasesPeriod));
  const periodPurchasesTotal = periodFilteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const periodPurchasesTax = periodFilteredPurchases.reduce((sum, p) => sum + (p.totalTax || 0), 0);

  // --- C. Profit & Loss (P&L) Period Calculations ---
  const pnlFilteredInvoices = validInvoices.filter((inv) => filterByPeriod(inv.date, pnlPeriod));
  const pnlFilteredPurchases = purchases.filter((pur) => filterByPeriod(pur.date, pnlPeriod));
  const pnlFilteredExpenses = expenses.filter((exp) => filterByPeriod(exp.date, pnlPeriod));

  const pnlTotalSales = pnlFilteredInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const pnlTotalPurchases = pnlFilteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const pnlTotalExpenses = pnlFilteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // ==========================================
  // 3. CUSTOM DATE-RANGE EXCEL EXPORTER LOGIC
  // ==========================================
  const handleApplyDatePreset = (preset: "today" | "this_week" | "this_month" | "last_month" | "this_fy" | "all_time") => {
    setPresetSelection(preset);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "this_week") {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      setStartDate(weekAgo.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === "last_month") {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(firstDayLastMonth.toISOString().slice(0, 10));
      setEndDate(lastDayLastMonth.toISOString().slice(0, 10));
    } else if (preset === "this_fy") {
      const currentYear = today.getFullYear();
      const fyStartYear = today.getMonth() >= 3 ? currentYear : currentYear - 1;
      setStartDate(`${fyStartYear}-04-01`);
      setEndDate(todayStr);
    } else if (preset === "all_time") {
      setStartDate("");
      setEndDate("");
    }
  };

  const filterByCustomDateRange = (dateStr: string) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return false;

    let targetDate: Date | null = null;
    if (dateStr.includes("T")) {
      targetDate = new Date(dateStr);
    } else {
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          targetDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      } else {
        targetDate = new Date(dateStr);
      }
    }

    if (!targetDate || isNaN(targetDate.getTime())) return true;

    const targetTime = targetDate.setHours(0, 0, 0, 0);

    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        if (targetTime < start.getTime()) return false;
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        if (targetTime > end.getTime()) return false;
      }
    }

    return true;
  };

  const filteredCustomSales = validInvoices.filter((i) => filterByCustomDateRange(i.date));
  const filteredCustomPurchases = purchases.filter((p) => filterByCustomDateRange(p.date));
  const filteredCustomExpenses = expenses.filter((e) => filterByCustomDateRange(e.date));

  const customSalesTotal = filteredCustomSales.reduce((acc, i) => acc + i.totalAmount, 0);
  const customPurchasesTotal = filteredCustomPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const customExpensesTotal = filteredCustomExpenses.reduce((acc, e) => acc + e.amount, 0);
  const customNetProfit = customSalesTotal - customPurchasesTotal - customExpensesTotal;

  const handleDownloadCustomExcel = () => {
    const dateRangeLabel = startDate && endDate ? `${startDate}_to_${endDate}` : "All_Time";
    const workbook = XLSX.utils.book_new();

    if (customExportType === "sales") {
      const filtered = filteredCustomSales;
      const dataRows = filtered.map((inv, index) => ({
        "S.No": index + 1,
        "Invoice Number": inv.invoiceNumber,
        "Invoice Date": inv.date,
        "Customer Name": inv.partyName || "Walk-in Customer",
        "Customer Phone": inv.partyPhone || "-",
        "Customer GSTIN": inv.partyGstin || "-",
        "Payment Mode": inv.paymentMode || "Cash",
        "Status": inv.status ? inv.status.toUpperCase() : "PAID",
        "Subtotal (₹)": inv.subtotal || inv.totalAmount,
        "Tax Amount (₹)": inv.totalTax || 0,
        "Total Amount (₹)": inv.totalAmount || 0,
        "Amount Paid (₹)": inv.amountPaid ?? inv.totalAmount,
        "Balance Due (₹)": inv.balanceDue ?? 0,
      }));

      const totalTax = filtered.reduce((acc, i) => acc + (i.totalTax || 0), 0);
      const totalAmount = filtered.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
      const totalPaid = filtered.reduce((acc, i) => acc + (i.amountPaid ?? i.totalAmount), 0);
      const totalDue = filtered.reduce((acc, i) => acc + (i.balanceDue ?? 0), 0);

      dataRows.push({
        "S.No": 0,
        "Invoice Number": "TOTAL SUMMARY",
        "Invoice Date": "",
        "Customer Name": `Total Invoices: ${filtered.length}`,
        "Customer Phone": "",
        "Customer GSTIN": "",
        "Payment Mode": "",
        "Status": "",
        "Subtotal (₹)": totalAmount - totalTax,
        "Tax Amount (₹)": totalTax,
        "Total Amount (₹)": totalAmount,
        "Amount Paid (₹)": totalPaid,
        "Balance Due (₹)": totalDue,
      });

      const sheet = XLSX.utils.json_to_sheet(dataRows);
      sheet["!cols"] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 14 },
        { wch: 28 },
        { wch: 16 },
        { wch: 18 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(workbook, sheet, "Sales Report");
      XLSX.writeFile(workbook, `Sales_Report_${dateRangeLabel}.xlsx`);
      if (showToast) showToast(`Exported ${filtered.length} Sales records to Excel`, "success");
    } else if (customExportType === "purchases") {
      const filtered = filteredCustomPurchases;
      const dataRows = filtered.map((pur, index) => ({
        "S.No": index + 1,
        "Purchase Bill Number": pur.purchaseNumber,
        "Purchase Date": pur.date,
        "Supplier Name": pur.supplierName,
        "Supplier Phone": pur.supplierPhone || "-",
        "Supplier GSTIN": pur.supplierGstin || "-",
        "Payment Mode": pur.paymentMode || "Cash",
        "Subtotal (₹)": pur.subtotal || pur.totalAmount,
        "Tax Amount / ITC (₹)": pur.totalTax || 0,
        "Total Billed (₹)": pur.totalAmount || 0,
        "Amount Paid (₹)": pur.amountPaid ?? pur.totalAmount,
        "Balance Due (₹)": pur.balanceDue ?? 0,
      }));

      const totalTax = filtered.reduce((acc, p) => acc + (p.totalTax || 0), 0);
      const totalAmount = filtered.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
      const totalPaid = filtered.reduce((acc, p) => acc + (p.amountPaid ?? p.totalAmount), 0);
      const totalDue = filtered.reduce((acc, p) => acc + (p.balanceDue ?? 0), 0);

      dataRows.push({
        "S.No": 0,
        "Purchase Bill Number": "TOTAL SUMMARY",
        "Purchase Date": "",
        "Supplier Name": `Total Bills: ${filtered.length}`,
        "Supplier Phone": "",
        "Supplier GSTIN": "",
        "Payment Mode": "",
        "Subtotal (₹)": totalAmount - totalTax,
        "Tax Amount / ITC (₹)": totalTax,
        "Total Billed (₹)": totalAmount,
        "Amount Paid (₹)": totalPaid,
        "Balance Due (₹)": totalDue,
      });

      const sheet = XLSX.utils.json_to_sheet(dataRows);
      sheet["!cols"] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 14 },
        { wch: 28 },
        { wch: 16 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(workbook, sheet, "Purchase Report");
      XLSX.writeFile(workbook, `Purchase_Report_${dateRangeLabel}.xlsx`);
      if (showToast) showToast(`Exported ${filtered.length} Purchase records to Excel`, "success");
    } else if (customExportType === "pnl") {
      const filteredSales = filteredCustomSales;
      const filteredPurchases = filteredCustomPurchases;
      const filteredExpenses = filteredCustomExpenses;

      const totalSalesAmt = filteredSales.reduce((acc, i) => acc + i.totalAmount, 0);
      const totalPurchasesAmt = filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
      const totalExpensesAmt = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

      const grossProfitAmt = totalSalesAmt - totalPurchasesAmt;
      const netProfitAmt = totalSalesAmt - totalPurchasesAmt - totalExpensesAmt;

      const grossMargin = totalSalesAmt > 0 ? ((grossProfitAmt / totalSalesAmt) * 100).toFixed(1) : "0.0";
      const netMargin = totalSalesAmt > 0 ? ((netProfitAmt / totalSalesAmt) * 100).toFixed(1) : "0.0";

      // Sheet 1: Executive Summary
      const summaryRows = [
        {
          "Financial Line Item": "Gross Sales Revenue (+)",
          "Record Count / Margin Details": `${filteredSales.length} Sales Invoices`,
          "Amount (INR)": totalSalesAmt,
        },
        {
          "Financial Line Item": "Direct Stock Purchases Cost (-)",
          "Record Count / Margin Details": `${filteredPurchases.length} Purchase Bills`,
          "Amount (INR)": -totalPurchasesAmt,
        },
        {
          "Financial Line Item": "Gross Operating Profit (=)",
          "Record Count / Margin Details": `Gross Profit Margin: ${grossMargin}%`,
          "Amount (INR)": grossProfitAmt,
        },
        {
          "Financial Line Item": "Shop Operating Expenses (-)",
          "Record Count / Margin Details": `${filteredExpenses.length} Expense Logs`,
          "Amount (INR)": -totalExpensesAmt,
        },
        {
          "Financial Line Item": "ESTIMATED NET OPERATING PROFIT (=)",
          "Record Count / Margin Details": `Net Operating Margin: ${netMargin}%`,
          "Amount (INR)": netProfitAmt,
        },
      ];

      const pnlSheet = XLSX.utils.json_to_sheet(summaryRows);
      pnlSheet["!cols"] = [{ wch: 42 }, { wch: 32 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(workbook, pnlSheet, "P&L Financial Statement");

      // Sheet 2: Sales Breakdown
      if (filteredSales.length > 0) {
        const salesRows = filteredSales.map((inv, idx) => ({
          "S.No": idx + 1,
          "Invoice #": inv.invoiceNumber,
          "Date": inv.date,
          "Customer": inv.partyName,
          "Total Amount (₹)": inv.totalAmount,
          "Tax (₹)": inv.totalTax || 0,
        }));
        const salesSheet = XLSX.utils.json_to_sheet(salesRows);
        salesSheet["!cols"] = [{ wch: 6 }, { wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(workbook, salesSheet, "Sales Breakdown");
      }

      // Sheet 3: Purchases Breakdown
      if (filteredPurchases.length > 0) {
        const purRows = filteredPurchases.map((pur, idx) => ({
          "S.No": idx + 1,
          "Bill #": pur.purchaseNumber,
          "Date": pur.date,
          "Supplier": pur.supplierName,
          "Total Billed (₹)": pur.totalAmount,
          "Tax (₹)": pur.totalTax || 0,
        }));
        const purSheet = XLSX.utils.json_to_sheet(purRows);
        purSheet["!cols"] = [{ wch: 6 }, { wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(workbook, purSheet, "Purchases Breakdown");
      }

      // Sheet 4: Expenses Breakdown
      if (filteredExpenses.length > 0) {
        const expRows = filteredExpenses.map((exp, idx) => ({
          "S.No": idx + 1,
          "Date": exp.date,
          "Category": exp.category,
          "Payment Mode": exp.paymentMode,
          "Notes": exp.notes || "-",
          "Amount (₹)": exp.amount,
        }));
        const expSheet = XLSX.utils.json_to_sheet(expRows);
        expSheet["!cols"] = [{ wch: 6 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 30 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(workbook, expSheet, "Expenses Breakdown");
      }

      XLSX.writeFile(workbook, `PnL_Financial_Report_${dateRangeLabel}.xlsx`);
      if (showToast) showToast(`Exported Profit & Loss Statement to Excel`, "success");
    }
  };

  const pnlGrossProfit = pnlTotalSales - pnlTotalPurchases;
  const pnlNetProfit = pnlTotalSales - pnlTotalPurchases - pnlTotalExpenses;
  const pnlGrossMarginPct = pnlTotalSales > 0 ? ((pnlGrossProfit / pnlTotalSales) * 100).toFixed(1) : "0.0";
  const pnlNetMarginPct = pnlTotalSales > 0 ? ((pnlNetProfit / pnlTotalSales) * 100).toFixed(1) : "0.0";

  // ==========================================
  // EXPORT HANDLERS: EXCEL & PDF
  // ==========================================

  // --- 1. Sales Exports ---
  const exportSalesExcel = () => {
    const label = getPeriodLabel(salesPeriod);
    const exportData = periodFilteredInvoices.map((inv, idx) => ({
      "S.No": idx + 1,
      "Invoice Number": inv.invoiceNumber,
      "Invoice Date": inv.date,
      "Customer Name": inv.partyName,
      "Customer Phone": inv.partyPhone || "-",
      "Payment Mode": inv.paymentMode || "Cash",
      "Invoice Status": inv.status.toUpperCase(),
      "Tax Amount (₹)": inv.totalTax || 0,
      "Subtotal (₹)": inv.subtotal || inv.totalAmount,
      "Total Amount (₹)": inv.totalAmount || 0,
      "Amount Paid (₹)": inv.amountPaid || inv.totalAmount,
      "Balance Due (₹)": inv.balanceDue || 0,
    }));

    exportData.push({
      "S.No": 0,
      "Invoice Number": "TOTAL",
      "Invoice Date": "",
      "Customer Name": `Count: ${periodFilteredInvoices.length} Invoices`,
      "Customer Phone": "",
      "Payment Mode": "",
      "Invoice Status": "",
      "Tax Amount (₹)": periodTotalTax,
      "Subtotal (₹)": periodTotalSales - periodTotalTax,
      "Total Amount (₹)": periodTotalSales,
      "Amount Paid (₹)": periodTotalSales,
      "Balance Due (₹)": 0,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 14 },
      { wch: 28 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Summary");
    const fileName = `Sales_Report_${salesPeriod}_${now.toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportSalesPdf = () => {
    const label = getPeriodLabel(salesPeriod);
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(profile.name || "Shree Shop Management System", 14, 12);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${profile.address || ""}, ${profile.city || ""} | GSTIN: ${profile.gstin || "N/A"}`,
      14,
      18
    );
    doc.text(`Contact: ${profile.phone || "N/A"}`, 14, 23);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`SALES PERFORMANCE REPORT - ${label.toUpperCase()}`, 14, 36);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated Date: ${now.toLocaleDateString("en-IN")}`, 14, 41);

    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, 45, 182, 16, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Sales Revenue: Rs. ${periodTotalSales.toLocaleString("en-IN")}`, 18, 52);
    doc.text(`Total Invoices: ${periodFilteredInvoices.length}`, 100, 52);
    doc.text(`Total Tax Collected: Rs. ${periodTotalTax.toLocaleString("en-IN")}`, 145, 52);

    let y = 69;
    doc.setFillColor(99, 102, 241); // indigo-600
    doc.rect(14, y - 5, 182, 7, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("INV #", 16, y);
    doc.text("DATE", 42, y);
    doc.text("CUSTOMER NAME", 68, y);
    doc.text("MODE", 128, y);
    doc.text("TAX (Rs.)", 152, y);
    doc.text("TOTAL (Rs.)", 175, y);

    y += 6;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");

    periodFilteredInvoices.forEach((inv) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(inv.invoiceNumber, 16, y);
      doc.text(inv.date, 42, y);
      doc.text((inv.partyName || "Walk-in Customer").slice(0, 24), 68, y);
      doc.text(inv.paymentMode || "Cash", 128, y);
      doc.text((inv.totalTax || 0).toLocaleString("en-IN"), 152, y);
      doc.setFont("helvetica", "bold");
      doc.text(inv.totalAmount.toLocaleString("en-IN"), 175, y);
      doc.setFont("helvetica", "normal");
      y += 6;
    });

    doc.setLineWidth(0.4);
    doc.line(14, y, 196, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL:", 68, y);
    doc.text(`Rs. ${periodTotalSales.toLocaleString("en-IN")}`, 175, y);

    const fileName = `Sales_Report_${salesPeriod}_${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  // --- 2. Purchases Exports ---
  const exportPurchasesExcel = () => {
    const label = getPeriodLabel(purchasesPeriod);
    const exportData = periodFilteredPurchases.map((pur, idx) => ({
      "S.No": idx + 1,
      "Purchase Bill #": pur.purchaseNumber,
      "Purchase Date": pur.date,
      "Supplier Name": pur.supplierName,
      "Supplier Phone": pur.supplierPhone || "-",
      "GSTIN": pur.supplierGstin || "-",
      "Tax Amount (₹)": pur.totalTax || 0,
      "Total Billed (₹)": pur.totalAmount || 0,
      "Amount Paid (₹)": pur.amountPaid ?? pur.totalAmount,
      "Balance Due (₹)": pur.balanceDue ?? 0,
    }));

    exportData.push({
      "S.No": 0,
      "Purchase Bill #": "TOTAL",
      "Purchase Date": "",
      "Supplier Name": `Count: ${periodFilteredPurchases.length} Purchase Bills`,
      "Supplier Phone": "",
      "GSTIN": "",
      "Tax Amount (₹)": periodPurchasesTax,
      "Total Billed (₹)": periodPurchasesTotal,
      "Amount Paid (₹)": periodFilteredPurchases.reduce((s, p) => s + (p.amountPaid ?? p.totalAmount), 0),
      "Balance Due (₹)": periodFilteredPurchases.reduce((s, p) => s + (p.balanceDue ?? 0), 0),
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 14 },
      { wch: 28 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Purchases Summary");
    const fileName = `Purchases_Report_${purchasesPeriod}_${now.toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportPurchasesPdf = () => {
    const label = getPeriodLabel(purchasesPeriod);
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    doc.setFillColor(217, 119, 6); // amber-600
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(profile.name || "Shree Shop Management System", 14, 12);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${profile.address || ""}, ${profile.city || ""} | GSTIN: ${profile.gstin || "N/A"}`,
      14,
      18
    );
    doc.text(`Contact: ${profile.phone || "N/A"}`, 14, 23);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`STOCK PURCHASES EXPENDITURE REPORT - ${label.toUpperCase()}`, 14, 36);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated Date: ${now.toLocaleDateString("en-IN")}`, 14, 41);

    doc.setFillColor(254, 243, 199); // amber-100
    doc.roundedRect(14, 45, 182, 16, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Purchases: Rs. ${periodPurchasesTotal.toLocaleString("en-IN")}`, 18, 52);
    doc.text(`Total Bills: ${periodFilteredPurchases.length}`, 105, 52);
    doc.text(`Total Tax (ITC): Rs. ${periodPurchasesTax.toLocaleString("en-IN")}`, 148, 52);

    let y = 69;
    doc.setFillColor(217, 119, 6);
    doc.rect(14, y - 5, 182, 7, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("BILL #", 16, y);
    doc.text("DATE", 45, y);
    doc.text("SUPPLIER NAME", 72, y);
    doc.text("TAX (Rs.)", 145, y);
    doc.text("TOTAL (Rs.)", 172, y);

    y += 6;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");

    periodFilteredPurchases.forEach((pur) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(pur.purchaseNumber, 16, y);
      doc.text(pur.date, 45, y);
      doc.text((pur.supplierName || "Supplier").slice(0, 28), 72, y);
      doc.text((pur.totalTax || 0).toLocaleString("en-IN"), 145, y);
      doc.setFont("helvetica", "bold");
      doc.text(pur.totalAmount.toLocaleString("en-IN"), 172, y);
      doc.setFont("helvetica", "normal");
      y += 6;
    });

    doc.setLineWidth(0.4);
    doc.line(14, y, 196, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL PURCHASES:", 72, y);
    doc.text(`Rs. ${periodPurchasesTotal.toLocaleString("en-IN")}`, 172, y);

    const fileName = `Purchases_Report_${purchasesPeriod}_${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  // --- 3. Profit & Loss (P&L) Exports ---
  const exportPnlExcel = () => {
    const label = getPeriodLabel(pnlPeriod);
    const exportData = [
      {
        "Financial Parameter": "Total Gross Sales Revenue (+)",
        "Details / Record Count": `${pnlFilteredInvoices.length} Invoices Issued`,
        "Amount (₹)": pnlTotalSales,
      },
      {
        "Financial Parameter": "Less: Direct Stock Purchases Cost (-)",
        "Details / Record Count": `${pnlFilteredPurchases.length} Purchase Bills`,
        "Amount (₹)": -pnlTotalPurchases,
      },
      {
        "Financial Parameter": "Gross Operating Profit (=)",
        "Details / Record Count": `Gross Profit Margin: ${pnlGrossMarginPct}%`,
        "Amount (₹)": pnlGrossProfit,
      },
      {
        "Financial Parameter": "Less: Shop Operating Expenses (-)",
        "Details / Record Count": `${pnlFilteredExpenses.length} Expense Logs`,
        "Amount (₹)": -pnlTotalExpenses,
      },
      {
        "Financial Parameter": "ESTIMATED NET OPERATING PROFIT (=)",
        "Details / Record Count": `Net Profit Margin: ${pnlNetMarginPct}%`,
        "Amount (₹)": pnlNetProfit,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [{ wch: 42 }, { wch: 32 }, { wch: 22 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "P&L Statement");
    const fileName = `Profit_Loss_Report_${pnlPeriod}_${now.toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportPnlPdf = () => {
    const label = getPeriodLabel(pnlPeriod);
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    doc.setFillColor(16, 185, 129); // emerald-600
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(profile.name || "Shree Shop Management System", 14, 12);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${profile.address || ""}, ${profile.city || ""} | GSTIN: ${profile.gstin || "N/A"}`,
      14,
      18
    );
    doc.text(`Contact: ${profile.phone || "N/A"}`, 14, 23);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`PROFIT & LOSS (P&L) FINANCIAL STATEMENT - ${label.toUpperCase()}`, 14, 36);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated Date: ${now.toLocaleDateString("en-IN")}`, 14, 41);

    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(14, 45, 182, 20, 2, 2, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`Net Operating Profit: Rs. ${pnlNetProfit.toLocaleString("en-IN")} (${pnlNetMarginPct}% Net Margin)`, 18, 53);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Gross Sales: Rs. ${pnlTotalSales.toLocaleString("en-IN")} | Purchases: Rs. ${pnlTotalPurchases.toLocaleString("en-IN")} | Expenses: Rs. ${pnlTotalExpenses.toLocaleString("en-IN")}`,
      18,
      60
    );

    let y = 75;
    doc.setFillColor(15, 23, 42);
    doc.rect(14, y - 5, 182, 7, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("FINANCIAL PARAMETER", 18, y);
    doc.text("DETAILS / MARGIN", 110, y);
    doc.text("AMOUNT (INR)", 165, y);

    y += 8;

    const rows = [
      { label: "(+) Total Gross Sales Revenue", note: `${pnlFilteredInvoices.length} Invoices Issued`, amount: `Rs. ${pnlTotalSales.toLocaleString("en-IN")}`, color: [16, 185, 129], bold: false },
      { label: "(-) Stock Purchases Cost", note: `${pnlFilteredPurchases.length} Purchase Bills`, amount: `- Rs. ${pnlTotalPurchases.toLocaleString("en-IN")}`, color: [217, 119, 6], bold: false },
      { label: "(=) Gross Profit Margin", note: `Gross Margin: ${pnlGrossMarginPct}%`, amount: `Rs. ${pnlGrossProfit.toLocaleString("en-IN")}`, color: [79, 70, 229], bold: true },
      { label: "(-) Shop Operating Expenses", note: `${pnlFilteredExpenses.length} Expense Logs`, amount: `- Rs. ${pnlTotalExpenses.toLocaleString("en-IN")}`, color: [225, 29, 72], bold: false },
      { label: "(=) ESTIMATED NET OPERATING PROFIT", note: `Net Profit Margin: ${pnlNetMarginPct}%`, amount: `Rs. ${pnlNetProfit.toLocaleString("en-IN")}`, color: [16, 185, 129], bold: true, bg: [236, 253, 245] },
    ];

    rows.forEach((r) => {
      if (r.bg) {
        doc.setFillColor(r.bg[0], r.bg[1], r.bg[2]);
        doc.rect(14, y - 5, 182, 8, "F");
      }
      doc.setFont("helvetica", r.bold ? "bold" : "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(r.label, 18, y);
      doc.setTextColor(100, 116, 139);
      doc.text(r.note, 110, y);
      doc.setTextColor(r.color[0], r.color[1], r.color[2]);
      doc.text(r.amount, 165, y);
      y += 9;
    });

    const fileName = `Profit_Loss_Report_${pnlPeriod}_${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  const exportSupplierDuesExcel = () => {
    const exportData = supplierDuesList.map((supp, idx) => ({
      "S.No": idx + 1,
      "Supplier Name": supp.supplierName,
      "Phone Number": supp.phone,
      "GSTIN": supp.gstin || "-",
      "State": supp.state || "-",
      "Bill Count": supp.billCount,
      "Opening Balance Due (₹)": supp.openingBalanceDue,
      "Purchases Total (₹)": supp.purchasesTotal,
      "Amount Paid (₹)": supp.amountPaid,
      "Purchases Outstanding (₹)": supp.purchasesDue,
      "Total Payable Due (₹)": supp.totalDue,
    }));

    exportData.push({
      "S.No": 0,
      "Supplier Name": "TOTAL PAYABLE OUTSTANDING",
      "Phone Number": "",
      "GSTIN": "",
      "State": "",
      "Bill Count": supplierDuesList.reduce((acc, s) => acc + s.billCount, 0),
      "Opening Balance Due (₹)": supplierDuesList.reduce((acc, s) => acc + s.openingBalanceDue, 0),
      "Purchases Total (₹)": supplierDuesList.reduce((acc, s) => acc + s.purchasesTotal, 0),
      "Amount Paid (₹)": supplierDuesList.reduce((acc, s) => acc + s.amountPaid, 0),
      "Purchases Outstanding (₹)": supplierDuesList.reduce((acc, s) => acc + s.purchasesDue, 0),
      "Total Payable Due (₹)": totalSupplierPayableDue,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Supplier Dues");
    XLSX.writeFile(workbook, `Supplier_Dues_Report_${now.toISOString().slice(0, 10)}.xlsx`);
  };

  const exportSupplierDuesPdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // Business Header
    doc.setFillColor(225, 29, 72); // rose-600
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(profile.name || "Shree Shop Management System", 14, 12);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${profile.address || ""}, ${profile.city || ""} | GSTIN: ${profile.gstin || "N/A"}`,
      14,
      18
    );

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("SUPPLIER PAYABLE OUTSTANDING (UDHAAR DUES) REPORT", 14, 36);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated Date: ${now.toLocaleDateString("en-IN")}`, 14, 41);

    // Summary Box
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14, 45, 182, 16, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Payable Dues: Rs. ${totalSupplierPayableDue.toLocaleString("en-IN")}`, 18, 52);
    doc.text(`Suppliers with Dues: ${totalSuppliersWithDues}`, 120, 52);

    let y = 69;
    doc.setFillColor(225, 29, 72);
    doc.rect(14, y - 5, 182, 7, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("SUPPLIER NAME", 16, y);
    doc.text("PHONE", 85, y);
    doc.text("BILLS", 125, y);
    doc.text("PAID (Rs.)", 145, y);
    doc.text("DUE AMOUNT (Rs.)", 170, y);

    y += 6;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");

    supplierDuesList.forEach((supp) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(supp.supplierName.slice(0, 32), 16, y);
      doc.text(supp.phone, 85, y);
      doc.text(supp.billCount.toString(), 125, y);
      doc.text(supp.amountPaid.toLocaleString("en-IN"), 145, y);
      doc.setFont("helvetica", "bold");
      doc.text(supp.totalDue.toLocaleString("en-IN"), 170, y);
      doc.setFont("helvetica", "normal");
      y += 6;
    });

    doc.setLineWidth(0.4);
    doc.line(14, y, 196, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL SUPPLIER PAYABLE DUES:", 85, y);
    doc.text(`Rs. ${totalSupplierPayableDue.toLocaleString("en-IN")}`, 170, y);

    doc.save(`Supplier_Dues_Report_${now.toISOString().slice(0, 10)}.pdf`);
  };

  // Top Selling Categories Data calculation
  const categoryStats: Record<string, { category: string; sales: number; units: number; itemsCount: number }> = {};
  validInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const matched = products.find(
        (p) => p.id === item.productId || p.name.toLowerCase() === item.itemDescription.toLowerCase()
      );
      const cat = matched?.category?.trim() || "General / Uncategorized";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { category: cat, sales: 0, units: 0, itemsCount: 0 };
      }
      categoryStats[cat].sales += item.totalAmount || item.quantity * item.unitPrice;
      categoryStats[cat].units += item.quantity || 1;
      categoryStats[cat].itemsCount += 1;
    });
  });

  let categoryData = Object.values(categoryStats).sort((a, b) => b.sales - a.sales);
  if (categoryData.length === 0) {
    categoryData = [
      { category: "Groceries & Staples", sales: 42000, units: 180, itemsCount: 24 },
      { category: "Dairy & Packaged Food", sales: 28000, units: 140, itemsCount: 18 },
      { category: "Personal & Home Care", sales: 18500, units: 95, itemsCount: 12 },
      { category: "Beverages & Cold Drinks", sales: 12500, units: 110, itemsCount: 15 },
    ];
  }
  const categoryTotalSum = categoryData.reduce((sum, c) => sum + c.sales, 0);

  // 6-Month Trend Data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyTrendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const mLabel = `${monthNames[d.getMonth()]} '${d.getFullYear().toString().slice(-2)}`;

    const mInvoices = invoices.filter((inv) => {
      if (inv.docType !== "invoice" || inv.status === "cancelled") return false;
      const invDate = new Date(inv.date);
      return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
    });
    const sales = mInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    const mPurchases = purchases.filter((pur) => {
      const pDate = new Date(pur.date);
      return pDate.getMonth() === d.getMonth() && pDate.getFullYear() === d.getFullYear();
    });
    const purCost = mPurchases.reduce((sum, pur) => sum + pur.totalAmount, 0);

    const mExpenses = expenses.filter((exp) => {
      const eDate = new Date(exp.date);
      return eDate.getMonth() === d.getMonth() && eDate.getFullYear() === d.getFullYear();
    });
    const expCost = mExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const profit = sales - purCost - expCost;

    return {
      month: mLabel,
      Sales: sales,
      Costs: purCost + expCost,
      Profit: Math.max(0, profit),
    };
  });

  if (monthlyTrendData.every((m) => m.Sales === 0) && totalSales > 0) {
    monthlyTrendData[5].Sales = totalSales;
    monthlyTrendData[5].Costs = totalPurchases + totalExpenses;
    monthlyTrendData[5].Profit = Math.max(0, netProfit);
  }

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Business Intelligence & Analytics Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual Analytics, Sales Period Exports (Weekly/Monthly/Yearly PDF & Excel) & Supplier Dues
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Screen</span>
          </button>
        </div>
      </div>

      {/* Report Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 print:hidden">
        {[
          { id: "ca_summary", label: "📑 CA Monthly Summary (GSTR-1 & Sales)" },
          { id: "monthly_summary", label: "Monthly Performance Summary" },
          { id: "custom_export", label: "📊 Excel Date-Range Exporter (.xlsx)" },
          { id: "sales", label: "Sales Summary (Weekly/Monthly/Yearly Export)" },
          { id: "supplier_dues", label: "Supplier Dues (Payable Outstanding)" },
          { id: "customer_dues", label: "Customer Udhaar Dues" },
          { id: "pnl", label: "Profit & Loss (P&L)" },
          { id: "purchases", label: "Purchase Summary" },
          { id: "gst", label: "GST Tax Return (GSTR-1/3B)" },
          { id: "stock", label: "Stock Valuation" },
          { id: "expenses", label: "Expense Breakdown" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              reportType === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Report Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-8">
        {/* Printable Business Header */}
        <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {profile.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {profile.address}, {profile.city}, {profile.state}
          </p>
          <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            GSTIN: {profile.gstin}
          </p>
          <div className="inline-block mt-3 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {reportType === "ca_summary" && "CA Monthly GST & Sales Reporting Module"}
            {reportType === "monthly_summary" && "Monthly Executive Performance Summary & Visual Analytics"}
            {reportType === "custom_export" && "Custom Date-Range Excel (.xlsx) Report Exporter"}
            {reportType === "sales" && `Sales Revenue Ledger (${getPeriodLabel(salesPeriod)})`}
            {reportType === "supplier_dues" && "Supplier Payable Outstanding (Udhaar Dues) Report"}
            {reportType === "pnl" && "Profit & Loss Financial Statement"}
            {reportType === "purchases" && "Stock Purchases Ledger Report"}
            {reportType === "gst" && "GST Monthly Tax Summary (GSTR-3B & GSTR-1)"}
            {reportType === "stock" && "Inventory Stock Valuation Report"}
            {reportType === "customer_dues" && "Customer Udhaar Due Outstanding Report"}
            {reportType === "expenses" && "Operating Expenses Ledger"}
          </div>
        </div>

        {/* TAB: CA MONTHLY SUMMARY */}
        {reportType === "ca_summary" && <CAMonthlySummary />}

        {/* TAB: CUSTOM DATE RANGE EXCEL EXPORTER (.xlsx) */}
        {reportType === "custom_export" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header / Intro Banner */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm uppercase tracking-wider">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Custom Date Range Excel Exporter (.xlsx)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Select your desired report type (Sales, Purchase, or P&L) and specify a custom date range to download complete, formatted Excel spreadsheets.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadCustomExcel}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download .xlsx Excel File</span>
              </button>
            </div>

            {/* Step 1 & Step 2 Controls Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Step 1: Select Report Type */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Select Report Type
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "sales",
                      label: "Sales Report",
                      desc: "Invoices, revenue, customer tax & payment status",
                      icon: TrendingUp,
                      color: "text-indigo-600 dark:text-indigo-400",
                      borderColor: "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30",
                    },
                    {
                      id: "purchases",
                      label: "Purchase Report",
                      desc: "Stock purchase bills, supplier GST & ITC tax",
                      icon: ShoppingBag,
                      color: "text-amber-600 dark:text-amber-400",
                      borderColor: "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30",
                    },
                    {
                      id: "pnl",
                      label: "P&L Statement",
                      desc: "Revenue, purchase costs, expenses & net margin",
                      icon: BarChart3,
                      color: "text-emerald-600 dark:text-emerald-400",
                      borderColor: "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30",
                    },
                  ].map((typeItem) => {
                    const IconComp = typeItem.icon;
                    const isSelected = customExportType === typeItem.id;
                    return (
                      <button
                        key={typeItem.id}
                        type="button"
                        onClick={() => setCustomExportType(typeItem.id as any)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? `${typeItem.borderColor} shadow-sm ring-2 ring-emerald-500/30`
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <IconComp className={`w-5 h-5 ${typeItem.color}`} />
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {isSelected && "✓"}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {typeItem.label}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {typeItem.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Date Range */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Select Date Range
                  </h3>
                </div>

                {/* Date Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "today", label: "Today" },
                    { id: "this_week", label: "This Week" },
                    { id: "this_month", label: "This Month" },
                    { id: "last_month", label: "Last Month" },
                    { id: "this_fy", label: "This FY (2025-26)" },
                    { id: "all_time", label: "All Time" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyDatePreset(preset.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        presetSelection === preset.id
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Inputs */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPresetSelection("custom");
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPresetSelection("custom");
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Real-Time Preview & Summary Before Export */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Export Preview & Data Summary
                  </h3>
                </div>

                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Range: {startDate || "Start"} → {endDate || "Today"}
                </span>
              </div>

              {/* Dynamic Summary Cards based on customExportType */}
              {customExportType === "sales" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Matching Invoices
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {filteredCustomSales.length} Bills
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Total Sales Value
                    </p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                      ₹{filteredCustomSales.reduce((acc, i) => acc + i.totalAmount, 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Tax Output Collected
                    </p>
                    <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                      ₹{filteredCustomSales.reduce((acc, i) => acc + (i.totalTax || 0), 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}

              {customExportType === "purchases" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Matching Purchase Bills
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {filteredCustomPurchases.length} Bills
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Total Purchase Expenditure
                    </p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                      ₹{filteredCustomPurchases.reduce((acc, p) => acc + p.totalAmount, 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Input Tax Credit (ITC)
                    </p>
                    <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                      ₹{filteredCustomPurchases.reduce((acc, p) => acc + (p.totalTax || 0), 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}

              {customExportType === "pnl" && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      (+) Sales Revenue
                    </p>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                      ₹{filteredCustomSales.reduce((acc, i) => acc + i.totalAmount, 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      (-) Purchases Cost
                    </p>
                    <p className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1">
                      ₹{filteredCustomPurchases.reduce((acc, p) => acc + p.totalAmount, 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                    <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      (-) Operating Expenses
                    </p>
                    <p className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1">
                      ₹{filteredCustomExpenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      (=) Net Profit
                    </p>
                    <p className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                      ₹{customNetProfit.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleDownloadCustomExcel}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Download Custom Excel Spreadsheet (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MONTHLY PERFORMANCE SUMMARY WITH RECHARTS */}
        {reportType === "monthly_summary" && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Executive Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                    Total Sales Revenue
                  </span>
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  ₹{totalSales.toLocaleString("en-IN")}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 font-medium">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {validInvoices.length} Invoices
                  </span>
                  <span>• Avg ₹{avgInvoiceVal.toLocaleString("en-IN")}/bill</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                    Net Profit Margin
                  </span>
                  <Percent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {netMarginPct}%
                </h3>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
                  <span>Net Profit:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{netProfit.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    Gross Margin
                  </span>
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  {grossMarginPct}%
                </h3>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
                  <span>Gross Profit:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    ₹{grossProfit.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                    Top Category
                  </span>
                  <ShoppingBag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2 truncate">
                  {categoryData[0]?.category || "General"}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
                  <span>Share of Sales:</span>
                  <span className="font-extrabold text-purple-600 dark:text-purple-400">
                    {categoryTotalSum > 0
                      ? ((categoryData[0]?.sales / categoryTotalSum) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: 6-Month Sales vs Costs vs Profit Trend */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span>Revenue & Profit Trends (6 Months)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Comparison of monthly total sales revenue vs total operating costs & net profit
                    </p>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip
                        formatter={(value: any) => [`₹${Number(value || 0).toLocaleString("en-IN")}`, ""]}
                        contentStyle={{ borderRadius: "12px", fontSize: "12px", backgroundColor: "#0F172A", color: "#FFF" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="Sales" fill="#6366F1" radius={[4, 4, 0, 0]} name="Sales Revenue" />
                      <Bar dataKey="Costs" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Purchases & Expenses" />
                      <Bar dataKey="Profit" fill="#10B981" radius={[4, 4, 0, 0]} name="Net Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Top Selling Product Categories (Donut / Pie Chart) */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-emerald-600" />
                      <span>Top-Selling Product Categories</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Sales distribution by merchandise category
                    </p>
                  </div>
                </div>

                <div className="h-72 w-full flex items-center justify-center pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="sales"
                        nameKey="category"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`₹${Number(value || 0).toLocaleString("en-IN")}`, "Sales Value"]}
                        contentStyle={{ borderRadius: "12px", fontSize: "12px", backgroundColor: "#0F172A", color: "#FFF" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Area Chart: Monthly Net Cumulative Revenue Growth */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Monthly Sales & Profit Margin Area Trajectory</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Visual curve showing revenue expansion alongside net profitability over 6 months
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip
                      formatter={(value: any) => [`₹${Number(value || 0).toLocaleString("en-IN")}`, ""]}
                      contentStyle={{ borderRadius: "12px", fontSize: "12px", backgroundColor: "#0F172A", color: "#FFF" }}
                    />
                    <Area type="monotone" dataKey="Sales" stroke="#6366F1" fillOpacity={1} fill="url(#colorSales)" name="Sales Revenue" />
                    <Area type="monotone" dataKey="Profit" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" name="Net Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Performance Breakdown Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Product Category Revenue & Margin Share</span>
              </h3>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-4 text-center">Items Sold (Qty)</th>
                      <th className="py-3 px-4 text-right">Revenue (INR)</th>
                      <th className="py-3 px-4 text-right">Category Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {categoryData.map((cat, idx) => {
                      const share = categoryTotalSum > 0 ? ((cat.sales / categoryTotalSum) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={cat.category} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span>{cat.category}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                            {cat.units} units
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                            ₹{cat.sales.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-600 dark:text-slate-300">
                            <div className="flex items-center justify-end gap-2">
                              <span>{share}%</span>
                              <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, Number(share))}%`,
                                    backgroundColor: COLORS[idx % COLORS.length],
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SALES SUMMARY WITH PERIOD FILTERS (WEEKLY, MONTHLY, YEARLY) & PDF/EXCEL EXPORT */}
        {reportType === "sales" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Sales Period Control Toolbar & Export Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Select Time Period:
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  {[
                    { id: "weekly", label: "Weekly (Last 7 Days)" },
                    { id: "monthly", label: "Monthly (This Month)" },
                    { id: "yearly", label: "Yearly (This Year)" },
                    { id: "all", label: "All Time" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSalesPeriod(p.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        salesPeriod === p.id
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons for PDF and Excel Export */}
              <div className="flex items-center gap-2">
                <button
                  onClick={exportSalesExcel}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel (.xlsx)</span>
                </button>

                <button
                  onClick={exportSalesPdf}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF (.pdf)</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Period Revenue ({getPeriodLabel(salesPeriod)})
                </p>
                <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  ₹{periodTotalSales.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {periodFilteredInvoices.length} Invoices Issued
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Total Tax Collected
                </p>
                <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                  ₹{periodTotalTax.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  GST Tax Output Liability
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Average Sale Per Invoice
                </p>
                <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                  ₹
                  {periodFilteredInvoices.length > 0
                    ? Math.round(periodTotalSales / periodFilteredInvoices.length).toLocaleString("en-IN")
                    : 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Average Order Value</p>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4 text-right">Tax (₹)</th>
                    <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {periodFilteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No sales recorded for this timeframe ({getPeriodLabel(salesPeriod)}).
                      </td>
                    </tr>
                  ) : (
                    periodFilteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {inv.partyName || "Walk-in Customer"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{inv.date}</td>
                        <td className="py-3.5 px-4 text-slate-500">{inv.paymentMode || "Cash"}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                          ₹{(inv.totalTax || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                          ₹{inv.totalAmount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SUPPLIER DUES (PAYABLE OUTSTANDING) */}
        {reportType === "supplier_dues" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Toolbar with Excel and PDF Export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span>Supplier Payable Outstanding (Udhaar Dues)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track vendor opening payables + unpaid stock purchase bills
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportSupplierDuesExcel}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>

                <button
                  onClick={exportSupplierDuesPdf}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 tracking-wider">
                    Total Supplier Payable Due
                  </span>
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-2">
                  ₹{totalSupplierPayableDue.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Total Outstanding Money Owed to Vendors
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    Suppliers with Dues
                  </span>
                  <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-2">
                  {totalSuppliersWithDues} Vendors
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pending Payment Accounts
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                    Average Due Per Supplier
                  </span>
                  <CreditCard className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  ₹
                  {totalSuppliersWithDues > 0
                    ? Math.round(totalSupplierPayableDue / totalSuppliersWithDues).toLocaleString("en-IN")
                    : 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Average Vendor Balance</p>
              </div>
            </div>

            {/* Supplier Dues Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                    <th className="py-3 px-4">Supplier / Vendor Name</th>
                    <th className="py-3 px-4">Mobile Phone</th>
                    <th className="py-3 px-4 text-center">Purchases Count</th>
                    <th className="py-3 px-4 text-right">Total Billed (₹)</th>
                    <th className="py-3 px-4 text-right">Amount Paid (₹)</th>
                    <th className="py-3 px-4 text-right">Payable Due (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {supplierDuesList.map((supp) => {
                    const isDue = supp.totalDue > 0;
                    return (
                      <tr key={supp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex flex-col">
                            <span>{supp.supplierName}</span>
                            {supp.gstin && (
                              <span className="text-[10px] font-mono text-slate-400">
                                GSTIN: {supp.gstin}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                          {supp.phone}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {supp.billCount} Bills
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                          ₹{supp.purchasesTotal.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{supp.amountPaid.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                          ₹{supp.totalDue.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isDue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                              <AlertCircle className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Settled</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* P&L Statement View */}
        {reportType === "pnl" && (
          <div className="space-y-6 animate-fadeIn">
            {/* P&L Period Toolbar & Export Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Filter P&L Period:
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  {[
                    { id: "weekly", label: "Weekly (Last 7 Days)" },
                    { id: "monthly", label: "Monthly (This Month)" },
                    { id: "yearly", label: "Yearly (This Year)" },
                    { id: "all", label: "All Time" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPnlPeriod(p.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        pnlPeriod === p.id
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons for PDF and Excel Export */}
              <div className="flex items-center gap-2">
                <button
                  onClick={exportPnlExcel}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel (.xlsx)</span>
                </button>

                <button
                  onClick={exportPnlPdf}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF (.pdf)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  (+) Gross Revenue ({getPeriodLabel(pnlPeriod)})
                </p>
                <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  ₹{pnlTotalSales.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">{pnlFilteredInvoices.length} Sales Invoices</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  (-) Stock Purchases Cost
                </p>
                <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                  ₹{pnlTotalPurchases.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">{pnlFilteredPurchases.length} Purchase Bills</p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  (-) Shop Expenses
                </p>
                <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                  ₹{pnlTotalExpenses.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">{pnlFilteredExpenses.length} Expense Logs</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40">
                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  (=) Net Business Profit
                </p>
                <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                  ₹{pnlNetProfit.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Margin: {pnlNetMarginPct}%</p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                    <th className="py-3 px-4">Financial Parameter ({getPeriodLabel(pnlPeriod)})</th>
                    <th className="py-3 px-4 text-center">Record Details</th>
                    <th className="py-3 px-4 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  <tr>
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-bold">
                      (+) Total Gross Sales Revenue
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {pnlFilteredInvoices.length} Invoices Issued
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 font-bold">
                      ₹{pnlTotalSales.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-bold">
                      Less: Direct Stock Purchases Cost
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {pnlFilteredPurchases.length} Vendor Bills
                    </td>
                    <td className="py-3.5 px-4 text-right text-amber-600 font-bold">
                      - ₹{pnlTotalPurchases.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="py-3.5 px-4 text-slate-900 dark:text-white font-extrabold">
                      (=) Gross Operating Profit Margin
                    </td>
                    <td className="py-3.5 px-4 text-center text-indigo-600 dark:text-indigo-400 font-bold">
                      Gross Margin: {pnlGrossMarginPct}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-indigo-600 dark:text-indigo-400 font-extrabold">
                      ₹{pnlGrossProfit.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-bold">
                      Less: Shop Operating Expenses (Rent, Salary, Power)
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {pnlFilteredExpenses.length} Expense Logs
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-600 font-bold">
                      - ₹{pnlTotalExpenses.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/60 dark:bg-emerald-950/40 text-sm font-black">
                    <td className="py-4 px-4 text-slate-900 dark:text-white">
                      (=) ESTIMATED NET OPERATING PROFIT
                    </td>
                    <td className="py-4 px-4 text-center text-emerald-700 dark:text-emerald-300 font-bold">
                      Net Profit Margin: {pnlNetMarginPct}%
                    </td>
                    <td className="py-4 px-4 text-right text-emerald-600 dark:text-emerald-400">
                      ₹{pnlNetProfit.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Purchase Summary View */}
        {reportType === "purchases" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Purchases Period Toolbar & Export Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Select Purchase Period:
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  {[
                    { id: "weekly", label: "Weekly (Last 7 Days)" },
                    { id: "monthly", label: "Monthly (This Month)" },
                    { id: "yearly", label: "Yearly (This Year)" },
                    { id: "all", label: "All Time" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPurchasesPeriod(p.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        purchasesPeriod === p.id
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={exportPurchasesExcel}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel (.xlsx)</span>
                </button>

                <button
                  onClick={exportPurchasesPdf}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF (.pdf)</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Period Expenditure ({getPeriodLabel(purchasesPeriod)})
                </p>
                <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                  ₹{periodPurchasesTotal.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">{periodFilteredPurchases.length} Vendor Bills</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Input Tax Credit (ITC Tax)
                </p>
                <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                  ₹{periodPurchasesTax.toLocaleString("en-IN")}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">GST Input Tax Credit</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Average Bill Amount
                </p>
                <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  ₹
                  {periodFilteredPurchases.length > 0
                    ? Math.round(periodPurchasesTotal / periodFilteredPurchases.length).toLocaleString("en-IN")
                    : 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Average Purchase Order</p>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                    <th className="py-3 px-4">Purchase Bill #</th>
                    <th className="py-3 px-4">Supplier / Vendor Name</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Tax Amount (₹)</th>
                    <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {periodFilteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No purchase bills found for this period ({getPeriodLabel(purchasesPeriod)}).
                      </td>
                    </tr>
                  ) : (
                    periodFilteredPurchases.map((pur) => (
                      <tr key={pur.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {pur.purchaseNumber}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {pur.supplierName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{pur.date}</td>
                        <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-400">
                          ₹{(pur.totalTax || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                          ₹{pur.totalAmount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GST Tax Summary View */}
        {reportType === "gst" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Output GST Collected (Sales)
                </p>
                <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                  ₹{gstCollected.toLocaleString("en-IN")}
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Input Tax Credit - ITC (Purchases)
                </p>
                <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  ₹{gstInputCredit.toLocaleString("en-IN")}
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Estimated Net GST Payable
                </p>
                <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                  ₹{netGstPayable.toLocaleString("en-IN")}
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-5 h-5" />
                <span>GST Tax Compliance Ready</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                You can export this tax summary directly or use it for filing GSTR-1 (Outward Sales Supply) and GSTR-3B monthly return computation.
              </p>
            </div>
          </div>
        )}

        {/* Stock Valuation View */}
        {reportType === "stock" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Total Inventory Asset Value
                </p>
                <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                  ₹{totalStockValue.toLocaleString("en-IN")}
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {products.length} Products Cataloged
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-center">Stock Qty</th>
                  <th className="py-2.5 px-3 text-right">Cost Price (₹)</th>
                  <th className="py-2.5 px-3 text-right">Asset Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {p.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-white">
                      {p.stockQuantity} {p.unit}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      ₹{p.purchasePrice.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                      ₹{(p.stockQuantity * p.purchasePrice).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Customer Dues View */}
        {reportType === "customer_dues" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Total Market Udhaar / Customer Outstanding
              </p>
              <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                ₹{totalCustomerDue.toLocaleString("en-IN")}
              </h3>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Mobile Phone</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {parties
                  .filter((p) => p.type === "customer" && p.openingBalance > 0)
                  .map((cust) => (
                    <tr key={cust.id}>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {cust.name}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">{cust.phone}</td>
                      <td className="py-3 px-3 text-slate-500">{cust.state}</td>
                      <td className="py-3 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                        ₹{cust.openingBalance.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Operating Expenses View */}
        {reportType === "expenses" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Total Operating Expenses
                </p>
                <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                  ₹{totalExpenses.toLocaleString("en-IN")}
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {expenses.length} Expense Logs
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {exp.category}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{exp.date}</td>
                    <td className="py-3 px-3 text-slate-500">{exp.paymentMode}</td>
                    <td className="py-3 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                      ₹{exp.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Signature */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end text-xs text-slate-400">
          <div>
            <p>Generated by: Shree Shop Management System</p>
            <p>Date: {now.toLocaleDateString("en-IN")}</p>
          </div>
          <div className="text-center">
            <div className="h-10 border-b border-slate-400 w-32 mb-1" />
            <p className="font-bold text-slate-700 dark:text-slate-300">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
