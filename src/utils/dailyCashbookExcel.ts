import * as XLSX from "xlsx";
import { DailyCashEntry, BusinessProfile, CustomCashColumn } from "../types";

export interface ExcelExportOptions {
  dateFilterLabel?: string;
  columnsConfig?: CustomCashColumn[];
  openingBalance?: number;
  actualCash?: number;
}

export function exportDailyCashBookExcel(
  entries: DailyCashEntry[],
  profile: BusinessProfile,
  options: ExcelExportOptions = {}
) {
  const {
    dateFilterLabel = "All Transactions",
    columnsConfig = [],
    openingBalance = 0,
    actualCash,
  } = options;

  // Build row data
  const dataRows = entries.map((e, idx) => ({
    "Sr. No.": idx + 1,
    Date: e.date,
    "Party / Customer / Vendor": e.partyName || e.description || "-",
    Description: e.description || "-",
    Category: e.paymentType,
    "Ref / Payment No.": e.referenceNo || "-",
    Type: e.direction === "income" ? "Income (+)" : "Expense (-)",
    "Amount (INR)": e.direction === "income" ? e.amount : -e.amount,
    Status: e.status || "Completed",
    "Included in Total": e.addToTotal ? "✓ ON" : "OFF",
    Notes: e.notes || "",
  }));

  // Calculate Category Totals for active columns
  const categoryTotals: Record<string, number> = {};
  columnsConfig.forEach((col) => {
    categoryTotals[col.name] = 0;
  });

  let totalReceived = 0;
  let totalPaid = 0;

  entries.forEach((e) => {
    if (e.addToTotal) {
      const val = e.direction === "income" ? e.amount : -e.amount;
      categoryTotals[e.paymentType] = (categoryTotals[e.paymentType] || 0) + val;

      if (e.direction === "income") {
        totalReceived += e.amount;
      } else {
        totalPaid += e.amount;
      }
    }
  });

  const netTotal = totalReceived - totalPaid;
  const expectedClosing = openingBalance + netTotal;
  const finalActual = actualCash !== undefined ? actualCash : expectedClosing;
  const difference = finalActual - expectedClosing;

  // Create worksheet with header title rows first
  const worksheet = XLSX.utils.aoa_to_sheet([
    [profile.name || "Shree Technofab ERP Pro"],
    [`DAILY CASH BOOK REPORT - ${dateFilterLabel}`],
    [`Generated: ${new Date().toLocaleString("en-IN")}`],
    [],
  ]);

  // Add JSON data rows starting at cell A5
  XLSX.utils.sheet_add_json(worksheet, dataRows, { origin: "A5" });

  // Add Summary Breakdown Rows at bottom
  const summaryStartRow = dataRows.length + 8;
  const summaryData = [
    [],
    ["SUMMARY BREAKDOWN & BALANCES"],
    ["Category / Metric", "Amount (INR)"],
    ...Object.keys(categoryTotals).map((cat) => [cat, categoryTotals[cat]]),
    [],
    ["Opening Balance", openingBalance],
    ["Total Received (+)", totalReceived],
    ["Total Paid (-)", totalPaid],
    ["Expected Closing Balance", expectedClosing],
    ["Actual Physical Cash", finalActual],
    ["Difference (Shortage/Surplus)", difference],
  ];

  XLSX.utils.sheet_add_aoa(worksheet, summaryData, { origin: `A${summaryStartRow}` });

  // Set column widths
  worksheet["!cols"] = [
    { wch: 8 },  // Sr. No.
    { wch: 14 }, // Date
    { wch: 28 }, // Party
    { wch: 30 }, // Description
    { wch: 20 }, // Category
    { wch: 18 }, // Ref No
    { wch: 14 }, // Type
    { wch: 16 }, // Amount
    { wch: 14 }, // Status
    { wch: 18 }, // Included
    { wch: 30 }, // Notes
  ];

  // Create Workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Cash Book");

  const cleanDate = new Date().toISOString().slice(0, 10);
  const fileName = `Daily_Cash_Book_${cleanDate}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
