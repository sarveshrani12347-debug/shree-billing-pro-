import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import {
  Invoice,
  Purchase,
  Party,
  BusinessProfile,
  PdfSettings,
  RecipeBOM,
  ProductionBatch,
  CashEntry,
} from "../types";
import { formatCurrency, numberToIndianWords } from "./gstUtils";

// Default PDF settings
export const defaultPdfSettings: PdfSettings = {
  pdfThemeColor: "#0f172a", // Slate-900
  headerStyle: "modern",
  showLogo: true,
  showGstin: true,
  showBankDetails: true,
  showUpiQr: true,
  showTerms: true,
  showSignature: true,
  showShipTo: false,
  showHsn: true,
  footerText: "This is a computer generated document and does not require physical signature.",
};

// Helper to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "");
  let num = parseInt(cleanHex, 16);
  if (isNaN(num)) num = 0x0f172a;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Generate UPI QR Code as Data URL
export async function getUpiQrDataUrl(
  upiId: string,
  payeeName: string,
  amount: number
): Promise<string | null> {
  if (!upiId) return null;
  try {
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      payeeName || "Business"
    )}&am=${amount || 0}&cu=INR`;
    return await QRCode.toDataURL(upiUri, { width: 140, margin: 1 });
  } catch (err) {
    console.error("Failed to generate UPI QR code:", err);
    return null;
  }
}

// Format Date safely
function formatDateStr(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

// Helper to sanitize filename
function sanitizeFileName(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-]/g, "_");
}

// Helper to execute output action (download, preview blob url, print, share)
async function handlePdfAction(
  doc: jsPDF,
  fileName: string,
  action: "download" | "preview" | "print" | "share" = "download"
): Promise<string> {
  if (action === "download") {
    doc.save(fileName);
    return "";
  } else if (action === "print") {
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    return blobUrl;
  } else if (action === "share") {
    const blob = doc.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: fileName,
          text: `Document ${fileName} from Billing Pro+`,
          files: [file],
        });
        return "";
      } catch (err) {
        console.log("Share cancelled or failed, falling back to download", err);
      }
    }
    // Fallback if Web Share fails or not supported
    doc.save(fileName);
    return "";
  } else {
    // 'preview' or 'blob'
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }
}

// Add Standard Header on Document
function drawBusinessHeader(
  doc: jsPDF,
  profile: BusinessProfile,
  settings: PdfSettings,
  docTitle: string
) {
  const rgb = hexToRgb(settings.pdfThemeColor || profile.themeColor || "#0f172a");

  // Header Banner Background
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.rect(0, 0, 210, 32, "F");

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(profile.name || "BILLING PRO+", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const addressLine = [profile.address, profile.city, profile.state]
    .filter(Boolean)
    .join(", ");
  doc.text(addressLine || "GST Registered Business", 14, 18);

  const contactLine = [
    profile.gstin ? `GSTIN: ${profile.gstin}` : null,
    profile.phone ? `Phone: ${profile.phone}` : null,
    profile.email ? `Email: ${profile.email}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  doc.text(contactLine || "Contact Business for queries", 14, 23);

  // Document Badge on Right Header
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(145, 6, 51, 20, 2, 2, "F");
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(docTitle.toUpperCase(), 170.5, 18, { align: "center" });

  // Reset text color
  doc.setTextColor(30, 41, 59);
}

// Add Footers to all pages
function addFooters(doc: jsPDF, profile: BusinessProfile, settings: PdfSettings) {
  const totalPages = (doc as any).internal.getNumberOfPages();
  const footerText =
    settings.footerText ||
    "This is a computer generated document and does not require physical signature.";

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(14, 283, 196, 283);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(footerText, 14, 288);
    doc.text(`Page ${i} of ${totalPages}`, 196, 288, { align: "right" });
  }
}

// ==========================================
// 1. GENERATE INVOICE / QUOTATION / CHALLAN PDF
// ==========================================
export async function generateInvoicePDF(
  invoice: Invoice,
  profile: BusinessProfile,
  action: "download" | "preview" | "print" | "share" = "download",
  overrideTitle?: string,
  extraChallanInfo?: { vehicleNo?: string; transporter?: string; driverName?: string }
): Promise<string> {
  const settings: PdfSettings = profile.pdfSettings || defaultPdfSettings;
  const rgb = hexToRgb(settings.pdfThemeColor || profile.themeColor || "#0f172a");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  let title = overrideTitle || "TAX INVOICE";
  if (!overrideTitle) {
    if (invoice.docType === "quotation") title = "QUOTATION";
    else if (invoice.docType === "proforma") title = "PROFORMA INVOICE";
    else if (invoice.docType === "challan") title = "DELIVERY CHALLAN";
    else if (invoice.docType === "credit_note") title = "CREDIT NOTE";
    else if (invoice.docType === "debit_note") title = "DEBIT NOTE";
  }

  // Draw Header
  drawBusinessHeader(doc, profile, settings, title);

  // Metadata Block (Doc #, Date, Due Date, Place of Supply)
  let y = 38;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 18, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);

  doc.text("DOCUMENT NO.", 18, y + 5);
  doc.text("DATE", 65, y + 5);
  doc.text("DUE DATE", 110, y + 5);
  doc.text("PLACE OF SUPPLY", 155, y + 5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);

  doc.text(invoice.invoiceNumber || "-", 18, y + 12);
  doc.text(formatDateStr(invoice.date), 65, y + 12);
  doc.text(formatDateStr(invoice.dueDate), 110, y + 12);
  doc.text(invoice.partyState || profile.state || "State", 155, y + 12);

  y += 24;

  // Bill To / Ship To Section
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text("BILLED TO / CUSTOMER DETAILS", 14, y);

  if (extraChallanInfo) {
    doc.text("DISPATCH & TRANSPORT DETAILS", 110, y);
  } else {
    doc.text("PAYMENT & STATUS", 110, y);
  }

  y += 4;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.partyName || "Cash Customer", 14, y);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  if (invoice.partyAddress) doc.text(`Address: ${invoice.partyAddress}`, 14, y + 5);
  if (invoice.partyGstin) doc.text(`GSTIN: ${invoice.partyGstin}`, 14, y + 9.5);
  if (invoice.partyPhone) doc.text(`Phone: ${invoice.partyPhone}`, 14, y + 14);

  // Right column (Payment status or Transport info)
  if (extraChallanInfo) {
    if (extraChallanInfo.vehicleNo) doc.text(`Vehicle No: ${extraChallanInfo.vehicleNo}`, 110, y + 5);
    if (extraChallanInfo.transporter) doc.text(`Transporter: ${extraChallanInfo.transporter}`, 110, y + 9.5);
    if (extraChallanInfo.driverName) doc.text(`Driver Name: ${extraChallanInfo.driverName}`, 110, y + 14);
  } else {
    doc.text(`Payment Mode: ${invoice.paymentMode || "Cash"}`, 110, y + 5);
    doc.text(`Tax Structure: ${invoice.isInterState ? "IGST (Inter-State)" : "CGST + SGST (Intra-State)"}`, 110, y + 9.5);
    doc.text(`Status: ${(invoice.status || "unpaid").toUpperCase().replace("_", " ")}`, 110, y + 14);
  }

  y += 22;

  // Table of Items
  const tableHeaders = [
    "#",
    "Product Description",
    "HSN/SAC",
    "Qty",
    "Rate (₹)",
    "Disc %",
    "Tax %",
    "Total (₹)",
  ];

  const tableBody = invoice.items.map((item, idx) => [
    (idx + 1).toString(),
    item.itemDescription,
    item.hsnSacCode || "-",
    `${item.quantity} ${item.unit || "Pcs"}`,
    formatCurrency(item.unitPrice),
    `${item.discountPercent || 0}%`,
    `${item.taxRate || 0}%`,
    formatCurrency(item.totalAmount),
  ]);

  autoTable(doc, {
    startY: y,
    head: [tableHeaders],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: rgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 58 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 16, halign: "right" },
      6: { cellWidth: 16, halign: "right" },
      7: { cellWidth: 22, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 6;

  // Check if new page needed for totals
  if (finalY > 220) {
    doc.addPage();
    finalY = 20;
  }

  // Summary & Calculation Box
  const summaryX = 105;
  const hasCharges = invoice.additionalCharges && invoice.additionalCharges.length > 0;
  const chargesTotalAmt = hasCharges ? invoice.additionalCharges!.reduce((sum, c) => sum + c.amount, 0) : 0;
  
  // Calculate dynamic height for box
  let boxHeight = 44;
  if (hasCharges) boxHeight += invoice.additionalCharges!.length * 4.5;
  if (invoice.roundOff) boxHeight += 4.5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, finalY, 91, boxHeight, 2, 2, "FD");

  let sy = finalY + 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  doc.text("Product Subtotal:", summaryX + 4, sy);
  doc.text(formatCurrency(invoice.subtotal), 190, sy, { align: "right" });

  if (invoice.totalDiscount > 0) {
    sy += 4.5;
    doc.text("Item Discount:", summaryX + 4, sy);
    doc.text(`- ${formatCurrency(invoice.totalDiscount)}`, 190, sy, { align: "right" });
  }

  // Render Additional Charges (Delivery, Freight, Packing, etc.)
  if (hasCharges) {
    invoice.additionalCharges!.forEach((chg) => {
      sy += 4.5;
      doc.text(`${chg.name}${chg.isTaxable ? " (+GST)" : " (Exempt)"}:`, summaryX + 4, sy);
      doc.text(formatCurrency(chg.amount), 190, sy, { align: "right" });
    });
  }

  sy += 4.5;
  if (!invoice.isInterState) {
    doc.text("CGST Tax:", summaryX + 4, sy);
    doc.text(formatCurrency(invoice.totalTax / 2), 190, sy, { align: "right" });
    sy += 4.5;
    doc.text("SGST Tax:", summaryX + 4, sy);
    doc.text(formatCurrency(invoice.totalTax / 2), 190, sy, { align: "right" });
  } else {
    doc.text("IGST Tax:", summaryX + 4, sy);
    doc.text(formatCurrency(invoice.totalTax), 190, sy, { align: "right" });
  }

  if (invoice.roundOff) {
    sy += 4.5;
    doc.text("Round Off:", summaryX + 4, sy);
    doc.text(`${invoice.roundOff >= 0 ? "+" : ""}${formatCurrency(invoice.roundOff)}`, 190, sy, { align: "right" });
  }

  sy += 5.5;
  doc.setLineWidth(0.3);
  doc.setDrawColor(148, 163, 184);
  doc.line(summaryX + 4, sy - 2, 192, sy - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text("Grand Total:", summaryX + 4, sy + 2);
  doc.text(formatCurrency(invoice.totalAmount), 190, sy + 2, { align: "right" });

  sy += 5.5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Amount Paid:", summaryX + 4, sy + 2);
  doc.text(formatCurrency(invoice.amountPaid || 0), 190, sy + 2, { align: "right" });

  sy += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text("Balance Due:", summaryX + 4, sy + 2);
  doc.text(formatCurrency(invoice.balanceDue || 0), 190, sy + 2, { align: "right" });

  // Amount in Words
  let leftY = finalY;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, leftY, 92, 16, 2, 2, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("AMOUNT IN WORDS", 18, leftY + 4);

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const words = numberToIndianWords(invoice.totalAmount);
  doc.text(words, 18, leftY + 9, { maxWidth: 84 });

  leftY += 20;

  // Bank & UPI Details
  if (settings.showBankDetails && profile.bankName) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text("OUR BANK & PAYMENT DETAILS", 14, leftY);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);

    doc.text(`Bank: ${profile.bankName}`, 14, leftY + 4);
    doc.text(`A/C No: ${profile.accountNumber}`, 14, leftY + 8);
    doc.text(`IFSC: ${profile.ifscCode} | Branch: ${profile.branchName || "Main"}`, 14, leftY + 12);
    if (profile.upiId) doc.text(`UPI ID: ${profile.upiId}`, 14, leftY + 16);

    // UPI QR Code
    if (settings.showUpiQr && profile.upiId) {
      const qrDataUrl = await getUpiQrDataUrl(profile.upiId, profile.name, invoice.totalAmount);
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, "PNG", 75, leftY + 1, 22, 22);
      }
    }
  }

  // Terms & Conditions and Signature
  let bottomY = Math.max(leftY + 26, finalY + 48);

  if (bottomY > 235) {
    doc.addPage();
    bottomY = 20;
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text("TERMS & CONDITIONS", 14, bottomY);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const termsText = invoice.terms || profile.termsAndConditions || "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if bill is not paid on due date.";
  doc.text(termsText, 14, bottomY + 4, { maxWidth: 110 });

  // Authorized Signatory
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`For ${profile.name || "Business"}`, 196, bottomY, { align: "right" });

  doc.setLineWidth(0.3);
  doc.setDrawColor(148, 163, 184);
  doc.line(145, bottomY + 16, 196, bottomY + 16);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("AUTHORIZED SIGNATORY", 170.5, bottomY + 20, { align: "center" });

  // Add footers
  addFooters(doc, profile, settings);

  const fileName = `${sanitizeFileName(title)}_${sanitizeFileName(invoice.invoiceNumber)}_${sanitizeFileName(invoice.partyName)}.pdf`;
  return await handlePdfAction(doc, fileName, action);
}

// ==========================================
// 2. GENERATE PURCHASE ORDER PDF
// ==========================================
export async function generatePurchaseOrderPDF(
  purchase: Purchase,
  profile: BusinessProfile,
  action: "download" | "preview" | "print" | "share" = "download"
): Promise<string> {
  const settings: PdfSettings = profile.pdfSettings || defaultPdfSettings;
  const rgb = hexToRgb("#d97706"); // Amber theme for purchases

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  drawBusinessHeader(doc, profile, settings, "PURCHASE ORDER");

  let y = 38;

  // Metadata
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(14, y, 182, 18, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 83, 9);

  doc.text("PURCHASE ORDER NO.", 18, y + 5);
  doc.text("ORDER DATE", 70, y + 5);
  doc.text("SUPPLIER GSTIN", 115, y + 5);
  doc.text("PAYMENT MODE", 155, y + 5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);

  doc.text(purchase.purchaseNumber || "-", 18, y + 12);
  doc.text(formatDateStr(purchase.date), 70, y + 12);
  doc.text(purchase.supplierGstin || "URP Vendor", 115, y + 12);
  doc.text(purchase.paymentMode || "Credit", 155, y + 12);

  y += 24;

  // Supplier info
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 83, 9);
  doc.text("VENDOR / SUPPLIER DETAILS", 14, y);

  y += 4;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(purchase.supplierName || "Vendor", 14, y);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  if (purchase.supplierPhone) doc.text(`Phone: ${purchase.supplierPhone}`, 14, y + 5);

  y += 14;

  // Table
  const tableHeaders = ["#", "Material / Item Description", "HSN/SAC", "Qty", "Rate (₹)", "Tax %", "Total (₹)"];
  const tableBody = purchase.items.map((item, idx) => [
    (idx + 1).toString(),
    item.itemDescription,
    item.hsnSacCode || "-",
    `${item.quantity} ${item.unit || "Pcs"}`,
    formatCurrency(item.unitPrice),
    `${item.taxRate || 0}%`,
    formatCurrency(item.totalAmount),
  ]);

  autoTable(doc, {
    startY: y,
    head: [tableHeaders],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: rgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 70 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 16, halign: "right" },
      6: { cellWidth: 24, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Summary box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(110, finalY, 86, 28, 2, 2, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  doc.text("Subtotal:", 114, finalY + 6);
  doc.text(formatCurrency(purchase.subtotal), 190, finalY + 6, { align: "right" });

  doc.text("Input Tax (GST):", 114, finalY + 11);
  doc.text(formatCurrency(purchase.totalTax), 190, finalY + 11, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(180, 83, 9);
  doc.text("Total Purchase Value:", 114, finalY + 18);
  doc.text(formatCurrency(purchase.totalAmount), 190, finalY + 18, { align: "right" });

  addFooters(doc, profile, settings);

  const fileName = `PurchaseOrder_${sanitizeFileName(purchase.purchaseNumber)}_${sanitizeFileName(purchase.supplierName)}.pdf`;
  return await handlePdfAction(doc, fileName, action);
}

// ==========================================
// 3. GENERATE RECIPE / BOM PDF
// ==========================================
export async function generateRecipeBOMPDF(
  recipe: RecipeBOM,
  profile: BusinessProfile,
  action: "download" | "preview" | "print" | "share" = "download"
): Promise<string> {
  const settings: PdfSettings = profile.pdfSettings || defaultPdfSettings;
  const rgb = hexToRgb("#4f46e5"); // Indigo theme

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  drawBusinessHeader(doc, profile, settings, "RECIPE / BOM SHEET");

  let y = 38;

  // Recipe Details Banner
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.roundedRect(14, y, 182, 20, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229);
  doc.text(`PRODUCT: ${recipe.productName.toUpperCase()}`, 18, y + 6);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`SKU: ${recipe.sku || "N/A"} | Recipe Version: ${recipe.version || "1.0"}`, 18, y + 12);
  doc.text(`Batch Production Quantity: ${recipe.batchSize} ${recipe.unit || "Pcs"}`, 18, y + 16);

  y += 26;

  // Raw Materials Table
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229);
  doc.text("RAW MATERIALS & BILL OF MATERIALS (BOM) BREAKDOWN", 14, y);

  y += 4;
  const tableHeaders = ["#", "Raw Material Name", "SKU", "Required Qty", "Rate (₹)", "Wastage %", "Total Cost (₹)"];
  const tableBody = recipe.items.map((item, idx) => [
    (idx + 1).toString(),
    item.materialName,
    item.sku || "-",
    `${item.requiredQty} ${item.unit}`,
    formatCurrency(item.unitRate),
    `${item.wastagePercent || 0}%`,
    formatCurrency(item.cost),
  ]);

  autoTable(doc, {
    startY: y,
    head: [tableHeaders],
    body: tableBody,
    theme: "striped",
    headStyles: { fillColor: rgb, textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 60 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 24, halign: "center" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 28, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Cost Analysis Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, finalY, 182, 34, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("PRODUCTION COST & MARGIN ANALYSIS", 18, finalY + 6);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  doc.text(`Raw Materials Cost: Rs. ${formatCurrency(recipe.rawMaterialCost)}`, 18, finalY + 12);
  doc.text(`Packaging Cost: Rs. ${formatCurrency(recipe.packagingCost)}`, 18, finalY + 17);
  doc.text(`Labour Expenses: Rs. ${formatCurrency(recipe.labourCost)}`, 18, finalY + 22);
  doc.text(`Other Overhead Expenses: Rs. ${formatCurrency(recipe.otherCost)}`, 18, finalY + 27);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229);
  doc.text(`Total Batch Cost: Rs. ${formatCurrency(recipe.totalProductionCost)}`, 105, finalY + 12);
  doc.text(`Cost Per Unit: Rs. ${formatCurrency(recipe.costPerUnit)}`, 105, finalY + 17);
  doc.text(`Suggested Selling Price: Rs. ${formatCurrency(recipe.suggestedSellingPrice)}`, 105, finalY + 22);

  doc.setTextColor(16, 185, 129); // emerald
  doc.text(`Estimated Profit Margin: ${recipe.marginPercent}%`, 105, finalY + 27);

  addFooters(doc, profile, settings);

  const fileName = `Recipe_BOM_${sanitizeFileName(recipe.productName)}_${sanitizeFileName(recipe.version)}.pdf`;
  return await handlePdfAction(doc, fileName, action);
}

// ==========================================
// 4. GENERATE PRODUCTION BATCH PDF
// ==========================================
export async function generateProductionBatchPDF(
  batch: ProductionBatch,
  profile: BusinessProfile,
  action: "download" | "preview" | "print" | "share" = "download"
): Promise<string> {
  const settings: PdfSettings = profile.pdfSettings || defaultPdfSettings;
  const rgb = hexToRgb("#059669"); // Emerald theme

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  drawBusinessHeader(doc, profile, settings, "PRODUCTION BATCH REPORT");

  let y = 38;

  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14, y, 182, 22, 2, 2, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(5, 150, 105);
  doc.text(`BATCH #: ${batch.batchNumber}`, 18, y + 6);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Recipe / BOM Name: ${batch.recipeName} (Ver: ${batch.recipeVersion})`, 18, y + 12);
  doc.text(`Production Date: ${formatDateStr(batch.productionDate)} | Operator: ${batch.operatorName}`, 18, y + 17);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Quantity Produced: ${batch.producedQuantity} ${batch.unit}`, 115, y + 12);
  doc.text(`Total Batch Cost: Rs. ${formatCurrency(batch.totalCost)}`, 115, y + 17);

  y += 28;

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 30, 2, 2, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(5, 150, 105);
  doc.text("COST BREAKDOWN SUMMARY", 18, y + 6);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Raw Materials Cost: Rs. ${formatCurrency(batch.rawMaterialCost)}`, 18, y + 13);
  doc.text(`Overhead & Labor Costs: Rs. ${formatCurrency(batch.otherExpenses)}`, 18, y + 19);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Unit Cost Price: Rs. ${formatCurrency(batch.costPerUnit)} / ${batch.unit}`, 110, y + 13);
  doc.text(`Batch Status: ${(batch.status || "completed").toUpperCase()}`, 110, y + 19);

  addFooters(doc, profile, settings);

  const fileName = `ProductionBatch_${sanitizeFileName(batch.batchNumber)}.pdf`;
  return await handlePdfAction(doc, fileName, action);
}

// ==========================================
// 5. GENERATE PARTY LEDGER PDF
// ==========================================
export async function generatePartyLedgerPDF(
  party: Party,
  invoices: Invoice[],
  purchases: Purchase[],
  profile: BusinessProfile,
  action: "download" | "preview" | "print" | "share" = "download"
): Promise<string> {
  const settings: PdfSettings = profile.pdfSettings || defaultPdfSettings;
  const rgb = hexToRgb(settings.pdfThemeColor || profile.themeColor || "#0f172a");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  drawBusinessHeader(doc, profile, settings, "CUSTOMER / PARTY LEDGER");

  let y = 38;

  // Party Banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 182, 20, 2, 2, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`PARTY NAME: ${party.name.toUpperCase()}`, 18, y + 6);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: ${party.phone || "-"} | GSTIN: ${party.gstin || "Unregistered"} | Address: ${party.address || "-"}`, 18, y + 12);

  const totalInvoiced = invoices.filter((i) => i.partyId === party.id).reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.filter((i) => i.partyId === party.id).reduce((s, i) => s + i.amountPaid, 0);
  const totalBalance = invoices.filter((i) => i.partyId === party.id).reduce((s, i) => s + i.balanceDue, 0);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(225, 29, 72);
  doc.text(`Outstanding Balance Due: Rs. ${formatCurrency(totalBalance)}`, 18, y + 17);

  y += 26;

  // Combine invoices into transactions table
  const partyInvoices = invoices.filter((i) => i.partyId === party.id);
  const tableHeaders = ["Doc #", "Date", "Status", "Billed Amount (₹)", "Paid Amount (₹)", "Balance Due (₹)"];
  const tableBody = partyInvoices.map((inv) => [
    inv.invoiceNumber,
    formatDateStr(inv.date),
    inv.status.toUpperCase().replace("_", " "),
    formatCurrency(inv.totalAmount),
    formatCurrency(inv.amountPaid),
    formatCurrency(inv.balanceDue),
  ]);

  autoTable(doc, {
    startY: y,
    head: [tableHeaders],
    body: tableBody,
    theme: "striped",
    headStyles: { fillColor: rgb, textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 26, halign: "center" },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 32, halign: "right" },
      5: { cellWidth: 32, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Summary footer
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL INVOICED: Rs. ${formatCurrency(totalInvoiced)}`, 14, finalY);
  doc.text(`TOTAL RECEIVED: Rs. ${formatCurrency(totalPaid)}`, 80, finalY);
  doc.setTextColor(225, 29, 72);
  doc.text(`TOTAL OUTSTANDING DUE: Rs. ${formatCurrency(totalBalance)}`, 140, finalY);

  addFooters(doc, profile, settings);

  const fileName = `PartyLedger_${sanitizeFileName(party.name)}.pdf`;
  return await handlePdfAction(doc, fileName, action);
}

// ==========================================
// 7. GENERATE CREDIT NOTE (CN) PDF
// ==========================================
export async function generateCreditNotePDF(
  cnInvoice: Invoice,
  profile: BusinessProfile,
  action: "download" | "preview" | "print" | "share" = "download"
): Promise<string> {
  const settings: PdfSettings = profile.pdfSettings || defaultPdfSettings;
  const rgb = hexToRgb(settings.pdfThemeColor || profile.themeColor || "#0f172a");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // Header Banner Background
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.rect(0, 0, 210, 32, "F");

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(profile.name || "BILLING PRO+", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const addressLine = [profile.address, profile.city, profile.state]
    .filter(Boolean)
    .join(", ");
  doc.text(addressLine || "GST Registered Business", 14, 18);

  const contactLine = [
    profile.gstin ? `Seller GSTIN: ${profile.gstin}` : null,
    profile.phone ? `Phone: ${profile.phone}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  doc.text(contactLine || "Contact Seller for queries", 14, 23);

  // Document Badge on Right Header
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(142, 6, 54, 20, 2, 2, "F");
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CREDIT NOTE", 169, 18, { align: "center" });

  doc.setTextColor(30, 41, 59);

  // Metadata Block (CN #, Date, Original Inv #, Original Inv Date)
  let y = 38;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 18, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);

  doc.text("CN NUMBER", 18, y + 5);
  doc.text("CN DATE", 62, y + 5);
  doc.text("ORIGINAL INV #", 108, y + 5);
  doc.text("ORIGINAL INV DATE", 152, y + 5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);

  doc.text(cnInvoice.invoiceNumber || "-", 18, y + 12);
  doc.text(formatDateStr(cnInvoice.date), 62, y + 12);
  doc.text(cnInvoice.referenceInvoiceNumber || "-", 108, y + 12);
  doc.text(formatDateStr(cnInvoice.originalInvoiceDate), 152, y + 12);

  y += 24;

  // Customer Details & Place of Supply
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text("CREDITED TO (CUSTOMER DETAILS)", 14, y);
  doc.text("RETURN DETAILS & PLACE OF SUPPLY", 110, y);

  y += 4;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(cnInvoice.partyName || "Customer", 14, y);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  if (cnInvoice.partyAddress) doc.text(`Address: ${cnInvoice.partyAddress}`, 14, y + 5);
  if (cnInvoice.partyGstin) doc.text(`Customer GSTIN: ${cnInvoice.partyGstin}`, 14, y + 9.5);
  if (cnInvoice.partyPhone) doc.text(`Phone: ${cnInvoice.partyPhone}`, 14, y + 14);

  // Right column: Reason & Stock action
  doc.text(`Place of Supply: ${cnInvoice.partyState || profile.state || "State"}`, 110, y + 5);
  doc.text(`Reason: ${cnInvoice.reason || "Sales Return / Adjustment"}`, 110, y + 9.5);
  doc.text(`Stock Restocked: ${cnInvoice.cnType === "goods_return" ? "YES (Returned to Stock)" : "NO (Price Adjustment)"}`, 110, y + 14);

  y += 22;

  // Item Table
  const tableHeaders = [
    "#",
    "Product / Service",
    "HSN/SAC",
    "Qty",
    "Rate (₹)",
    "Taxable (₹)",
    "GST %",
    cnInvoice.isInterState ? "IGST (₹)" : "CGST+SGST (₹)",
    "Total (₹)",
  ];

  const tableBody = cnInvoice.items.map((item, idx) => {
    const cgstSgstStr = cnInvoice.isInterState
      ? formatCurrency(item.igstAmount)
      : `${formatCurrency(item.cgstAmount + item.sgstAmount)}`;
    return [
      (idx + 1).toString(),
      item.itemDescription,
      item.hsnSacCode || "-",
      `${item.quantity} ${item.unit || "Pcs"}`,
      formatCurrency(item.unitPrice),
      formatCurrency(item.unitPrice * item.quantity),
      `${item.taxRate || 0}%`,
      cgstSgstStr,
      formatCurrency(item.totalAmount),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [tableHeaders],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: rgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 50 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 22, halign: "right" },
      6: { cellWidth: 14, halign: "center" },
      7: { cellWidth: 22, halign: "right" },
      8: { cellWidth: 22, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 6;

  if (finalY > 220) {
    doc.addPage();
    finalY = 20;
  }

  // Summary & Calculation Box
  const summaryX = 105;
  const chargesTotal = (cnInvoice.additionalCharges || []).reduce((acc, c) => acc + c.amount, 0);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, finalY, 91, 48, 2, 2, "FD");

  let sy = finalY + 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  doc.text("Taxable Total:", summaryX + 4, sy);
  doc.text(formatCurrency(cnInvoice.subtotal - chargesTotal), 190, sy, { align: "right" });

  if (!cnInvoice.isInterState) {
    sy += 4.5;
    doc.text("CGST Total:", summaryX + 4, sy);
    doc.text(formatCurrency(cnInvoice.totalTax / 2), 190, sy, { align: "right" });
    sy += 4.5;
    doc.text("SGST Total:", summaryX + 4, sy);
    doc.text(formatCurrency(cnInvoice.totalTax / 2), 190, sy, { align: "right" });
  } else {
    sy += 4.5;
    doc.text("IGST Total:", summaryX + 4, sy);
    doc.text(formatCurrency(cnInvoice.totalTax), 190, sy, { align: "right" });
  }

  if (chargesTotal > 0) {
    sy += 4.5;
    doc.text("Other / Delivery Charges:", summaryX + 4, sy);
    doc.text(formatCurrency(chargesTotal), 190, sy, { align: "right" });
  }

  if (cnInvoice.roundOff) {
    sy += 4.5;
    doc.text("Round Off:", summaryX + 4, sy);
    doc.text(`${cnInvoice.roundOff >= 0 ? "+" : ""}${formatCurrency(cnInvoice.roundOff)}`, 190, sy, { align: "right" });
  }

  sy += 5.5;
  doc.setLineWidth(0.3);
  doc.setDrawColor(148, 163, 184);
  doc.line(summaryX + 4, sy - 2, 192, sy - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text("TOTAL CREDIT AMOUNT:", summaryX + 4, sy + 2);
  doc.text(formatCurrency(cnInvoice.totalAmount), 190, sy + 2, { align: "right" });

  // Amount in Words
  let leftY = finalY;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, leftY, 86, 18, 2, 2, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL CREDIT AMOUNT IN WORDS", 18, leftY + 5);

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const words = numberToIndianWords(cnInvoice.totalAmount);
  doc.text(words, 18, leftY + 10, { maxWidth: 78 });

  addFooters(doc, profile, settings);

  const fileName = `CreditNote_${sanitizeFileName(cnInvoice.invoiceNumber)}.pdf`;
  return await handlePdfAction(doc, fileName, action);
}
export async function generateGenericReportPDF(
  reportTitle: string,
  headers: string[],
  dataRows: (string | number)[][],
  summaryText: string,
  profile: BusinessProfile,
  action: "download" | "preview" | "print" | "share" = "download"
): Promise<string> {
  const settings: PdfSettings = profile.pdfSettings || defaultPdfSettings;
  const rgb = hexToRgb(settings.pdfThemeColor || profile.themeColor || "#0f172a");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  drawBusinessHeader(doc, profile, settings, reportTitle);

  let y = 38;

  if (summaryText) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, 182, 12, 2, 2, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(summaryText, 18, y + 7);
    y += 18;
  }

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: dataRows,
    theme: "striped",
    headStyles: { fillColor: rgb, textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  addFooters(doc, profile, settings);

  const fileName = `${sanitizeFileName(reportTitle)}_${new Date().toISOString().slice(0, 10)}.pdf`;
  return await handlePdfAction(doc, fileName, action);
}
