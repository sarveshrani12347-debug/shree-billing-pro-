import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DailyCashEntry, BusinessProfile, CustomCashColumn, ClosedCashDay } from "../types";
import { formatCurrency } from "./gstUtils";

export interface CashBookPDFOptions {
  reportTitle?: string;
  dateFilterLabel?: string;
  selectedCategories?: string[]; // category names to include
  includeNotes?: boolean;
  includeTotalsSummary?: boolean;
  includeOpeningClosing?: boolean;
  openingBalance?: number;
  actualCashCount?: number;
  closedDayInfo?: ClosedCashDay;
  columnsConfig?: CustomCashColumn[];
  action?: "download" | "preview" | "print";
  orientation?: "portrait" | "landscape";
}

function hexToRgb(hex: string): [number, number, number] {
  if (!hex) return [30, 41, 59];
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [30, 41, 59];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export async function generateDailyCashBookPDF(
  entries: DailyCashEntry[],
  profile: BusinessProfile,
  options: CashBookPDFOptions = {}
): Promise<string> {
  const {
    reportTitle = "DAILY CASH BOOK",
    dateFilterLabel = "All Transactions",
    selectedCategories = [],
    includeNotes = true,
    includeTotalsSummary = true,
    includeOpeningClosing = true,
    openingBalance = 0,
    actualCashCount,
    closedDayInfo,
    columnsConfig = [],
    action = "download",
    orientation = "portrait",
  } = options;

  // Filter entries if specific categories selected
  const filteredEntries = selectedCategories.length > 0
    ? entries.filter((e) => selectedCategories.includes(e.paymentType))
    : entries;

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: orientation,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. White Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Top Accent Header Bar (Slate / Purple gradient simulation)
  doc.setFillColor(124, 58, 237); // Purple accent
  doc.rect(14, 12, 4, 22, "F");

  // Business Name & Profile Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Dark slate
  doc.text(profile.name || "Shree Technofab ERP Pro", 22, 18);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const contactLine = `GSTIN: ${profile.gstin || "N/A"} | Ph: ${profile.phone || "N/A"} | Email: ${profile.email || "N/A"}`;
  doc.text(contactLine, 22, 23);
  doc.text(
    profile.address ? `${profile.address}, ${profile.city || ""} ${profile.state || ""}` : "India",
    22,
    28
  );

  // Document Badge on Top Right
  const badgeWidth = orientation === "landscape" ? 70 : 60;
  const badgeX = pageWidth - 14 - badgeWidth;
  doc.setFillColor(15, 23, 42); // Dark navy badge
  doc.roundedRect(badgeX, 12, badgeWidth, 22, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(reportTitle.toUpperCase(), badgeX + badgeWidth / 2, 20, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(dateFilterLabel, badgeX + badgeWidth / 2, 25, { align: "center" });
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, badgeX + badgeWidth / 2, 29, { align: "center" });

  let y = 40;

  // 2. Active Category Totals Grid
  if (includeTotalsSummary) {
    // Map active categories
    const activeCols = columnsConfig.length > 0 ? columnsConfig : [
      { id: "c1", name: "Cheque Entry", color: "#2563eb", bgLightHex: "#eff6ff", textColorHex: "#1e40af", enabled: true },
      { id: "c2", name: "Cash Entry", color: "#059669", bgLightHex: "#ecfdf5", textColorHex: "#065f46", enabled: true },
      { id: "c3", name: "GPay Payment", color: "#7c3aed", bgLightHex: "#faf5ff", textColorHex: "#6b21a8", enabled: true },
      { id: "c4", name: "GST GPay", color: "#d97706", bgLightHex: "#fffbeb", textColorHex: "#92400e", enabled: true },
      { id: "c5", name: "Vendor Payment", color: "#e11d48", bgLightHex: "#fff1f2", textColorHex: "#9f1239", enabled: true },
    ];

    const enabledCols = activeCols.filter((c) => c.enabled);
    const numCols = enabledCols.length;

    if (numCols > 0) {
      const availWidth = pageWidth - 28;
      const gap = 2;
      const cardW = (availWidth - (numCols - 1) * gap) / numCols;

      enabledCols.forEach((col, idx) => {
        const cx = 14 + idx * (cardW + gap);
        const colRgb = hexToRgb(col.color);

        // Header strip for category
        doc.setFillColor(colRgb[0], colRgb[1], colRgb[2]);
        doc.roundedRect(cx, y, cardW, 6, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        doc.text(col.name.toUpperCase(), cx + cardW / 2, y + 4.2, { align: "center" });

        // Sum for this category (where addToTotal is ON)
        const catTotal = filteredEntries
          .filter((e) => e.paymentType === col.name && e.addToTotal)
          .reduce((sum, e) => sum + (e.direction === "income" ? e.amount : -e.amount), 0);

        // Card body
        const bgRgb = hexToRgb(col.bgLightHex || "#f8fafc");
        doc.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
        doc.setDrawColor(colRgb[0], colRgb[1], colRgb[2]);
        doc.roundedRect(cx, y + 6, cardW, 11, 1, 1, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        if (catTotal < 0) {
          doc.setTextColor(220, 38, 38); // Red for negative
          doc.text(`-${formatCurrency(Math.abs(catTotal))}`, cx + cardW / 2, y + 13.5, { align: "center" });
        } else {
          const textRgb = hexToRgb(col.textColorHex || col.color);
          doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
          doc.text(`₹${formatCurrency(catTotal)}`, cx + cardW / 2, y + 13.5, { align: "center" });
        }
      });

      y += 21;
    }
  }

  // Calculate Overall Period Totals
  const includedEntries = filteredEntries.filter((e) => e.addToTotal);
  const totalReceived = includedEntries
    .filter((e) => e.direction === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = includedEntries
    .filter((e) => e.direction === "expense")
    .reduce((sum, e) => sum + e.amount, 0);
  const netTotal = totalReceived - totalPaid;

  const currentOpening = closedDayInfo ? closedDayInfo.openingBalance : openingBalance;
  const expectedClosing = currentOpening + netTotal;
  const actualClosing = closedDayInfo ? closedDayInfo.actualCash : (actualCashCount !== undefined ? actualCashCount : expectedClosing);
  const difference = actualClosing - expectedClosing;

  // Executive Summary Banner
  if (includeOpeningClosing) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, pageWidth - 28, 12, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    const boxSectionW = (pageWidth - 28) / 6;
    let bx = 14;

    // 1. Opening
    doc.text("Opening", bx + 3, y + 4.5);
    doc.setFont("helvetica", "bold");
    doc.text(`₹${formatCurrency(currentOpening)}`, bx + 3, y + 9.5);
    bx += boxSectionW;

    // 2. Received
    doc.setTextColor(37, 99, 235); // Blue
    doc.text("Received (+)", bx + 3, y + 4.5);
    doc.text(`+₹${formatCurrency(totalReceived)}`, bx + 3, y + 9.5);
    bx += boxSectionW;

    // 3. Paid
    doc.setTextColor(220, 38, 38); // Red
    doc.text("Paid (-)", bx + 3, y + 4.5);
    doc.text(`-₹${formatCurrency(totalPaid)}`, bx + 3, y + 9.5);
    bx += boxSectionW;

    // 4. Expected
    doc.setTextColor(15, 23, 42);
    doc.text("Expected", bx + 3, y + 4.5);
    doc.text(`₹${formatCurrency(expectedClosing)}`, bx + 3, y + 9.5);
    bx += boxSectionW;

    // 5. Actual
    doc.setTextColor(5, 150, 105); // Emerald
    doc.text("Actual Cash", bx + 3, y + 4.5);
    doc.text(`₹${formatCurrency(actualClosing)}`, bx + 3, y + 9.5);
    bx += boxSectionW;

    // 6. Diff
    if (difference === 0) {
      doc.setTextColor(22, 163, 74); // Green
      doc.text("Diff (Exact)", bx + 3, y + 4.5);
      doc.text(`₹0 ✓`, bx + 3, y + 9.5);
    } else if (difference < 0) {
      doc.setTextColor(220, 38, 38); // Red
      doc.text("Diff (Short)", bx + 3, y + 4.5);
      doc.text(`-₹${formatCurrency(Math.abs(difference))}`, bx + 3, y + 9.5);
    } else {
      doc.setTextColor(37, 99, 235); // Blue
      doc.text("Diff (Surplus)", bx + 3, y + 4.5);
      doc.text(`+₹${formatCurrency(difference)}`, bx + 3, y + 9.5);
    }

    y += 16;
  }

  // 3. Transactions Table
  const tableHeaders = [
    "#",
    "Date",
    "Party / Customer / Vendor",
    "Description",
    "Category",
    "Ref / Payment No.",
    "Type",
    "Amount (₹)",
    "Status",
    "Total?",
  ];

  if (includeNotes) {
    tableHeaders.push("Notes");
  }

  const tableBody = filteredEntries.map((e, idx) => {
    const isIncome = e.direction === "income";
    const amtStr = `${isIncome ? "+" : "-"}${formatCurrency(e.amount)}`;
    const statusStr = e.status || "Completed";
    const includedStr = e.addToTotal ? "✓ ON" : "OFF";

    const row = [
      (idx + 1).toString(),
      e.date,
      e.partyName || e.description || "-",
      e.description || "-",
      e.paymentType,
      e.referenceNo || "-",
      isIncome ? "Income (+)" : "Expense (-)",
      amtStr,
      statusStr,
      includedStr,
    ];

    if (includeNotes) {
      row.push(e.notes || "-");
    }

    return row;
  });

  autoTable(doc, {
    startY: y,
    head: [tableHeaders],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42], // Slate Navy header
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    didParseCell: (data) => {
      // Type & Amount colors
      if (data.section === "body" && data.column.index === 7) {
        const rawVal = data.cell.raw as string;
        if (rawVal.startsWith("-")) {
          data.cell.styles.textColor = [220, 38, 38]; // Red for negative
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [37, 99, 235]; // Blue for positive
          data.cell.styles.fontStyle = "bold";
        }
      }

      // Included in total status
      if (data.section === "body" && data.column.index === 9) {
        const rawVal = data.cell.raw as string;
        if (rawVal.includes("OFF")) {
          data.cell.styles.textColor = [148, 163, 184]; // Gray
        } else {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald check
          data.cell.styles.fontStyle = "bold";
        }
      }

      // Category color matching
      if (data.section === "body" && data.column.index === 4) {
        const catName = data.cell.raw as string;
        const matchedCol = columnsConfig.find((c) => c.name === catName);
        if (matchedCol) {
          const rgb = hexToRgb(matchedCol.textColorHex || matchedCol.color);
          data.cell.styles.textColor = rgb;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer & Page numbers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);

    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    doc.text(
      `Generated from ${profile.name || "Shree Technofab ERP"} | ${new Date().toLocaleString("en-IN")}`,
      14,
      pageHeight - 7
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: "right" });
  }

  const cleanDate = new Date().toISOString().slice(0, 10);
  const fileName = `Daily_Cash_Book_${cleanDate}.pdf`;

  if (action === "print") {
    doc.autoPrint();
    const pdfBlobUrl = doc.output("bloburl");
    window.open(pdfBlobUrl, "_blank");
    return pdfBlobUrl.toString();
  } else if (action === "preview") {
    const pdfBlobUrl = doc.output("bloburl");
    return pdfBlobUrl.toString();
  } else {
    doc.save(fileName);
    return fileName;
  }
}
