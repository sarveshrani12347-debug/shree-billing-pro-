import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Invoice } from "../types";

export type CASummaryAction = "create" | "edit" | "cancel" | "delete";

export interface CASummaryRecordDoc {
  id: string; // Document ID equals invoice.id (Single Source of Truth)
  invoiceId: string;
  businessId: string;
  createdByUserId: string;
  invoiceNumber: string;
  docType: string;
  partyId: string;
  partyName: string;
  partyGstin: string;
  partyState: string;
  date: string;
  monthKey: string; // YYYY-MM for instant month querying
  financialYear: string;
  status: string; // 'paid' | 'unpaid' | 'partially_paid' | 'overdue' | 'cancelled'
  subtotal: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalGst: number;
  otherCharges: number;
  totalAmount: number;
  balanceDue: number;
  isInterState: boolean;
  action: CASummaryAction;
  isDeleted: boolean;
  updatedAt: string;
  createdAt: string;
}

/**
 * Calculates Indian Financial Year string (e.g. FY 2026–27) from invoice date string YYYY-MM-DD
 */
export function getFinancialYearStrFromDate(dateStr: string): string {
  if (!dateStr) return "FY 2026–27";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "FY 2026–27";

  const year = d.getFullYear();
  const month = d.getMonth(); // 0-11
  if (month < 3) {
    const startYr = year - 1;
    const endYrShort = String(year).slice(-2);
    return `FY ${startYr}–${endYrShort}`;
  } else {
    const startYr = year;
    const endYrShort = String(year + 1).slice(-2);
    return `FY ${startYr}–${endYrShort}`;
  }
}

/**
 * Derives YYYY-MM month key from date string YYYY-MM-DD
 */
export function getMonthKeyFromDate(dateStr: string): string {
  if (!dateStr) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  const parts = dateStr.split("-");
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1].padStart(2, "0")}`;
  }
  return dateStr.slice(0, 7);
}

/**
 * Computes exact GST Tax & Financial Breakdowns for CA Monthly Summary
 */
export function computeGstBreakdown(invoice: Invoice, businessState?: string) {
  const isInterState =
    invoice.isInterState ||
    (invoice.partyState && businessState
      ? invoice.partyState.trim().toLowerCase() !== businessState.trim().toLowerCase()
      : false);

  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach((item) => {
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
    taxableAmount = invoice.subtotal || 0;
    const totalTax = invoice.totalTax || 0;
    if (isInterState) {
      igstAmount = totalTax;
    } else {
      cgstAmount = totalTax / 2;
      sgstAmount = totalTax / 2;
    }
  }

  const otherCharges = (invoice.additionalCharges || []).reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalGst = cgstAmount + sgstAmount + igstAmount;
  const billAmount = invoice.totalAmount || taxableAmount + totalGst + otherCharges;

  return {
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstAmount: Math.round(igstAmount * 100) / 100,
    totalGst: Math.round(totalGst * 100) / 100,
    otherCharges: Math.round(otherCharges * 100) / 100,
    billAmount: Math.round(billAmount * 100) / 100,
    isInterState,
  };
}

/**
 * Main utility function to automatically update the CA Monthly Summary collection in Firestore
 * whenever an invoice is created, edited, or cancelled.
 *
 * CRITICAL: Uses invoice.id as the document ID in Firestore to maintain a single source of truth
 * and prevent duplicate entries!
 */
export async function syncInvoiceToCASummary(
  invoice: Invoice,
  action: CASummaryAction,
  businessState?: string
): Promise<{ success: boolean; docId: string; message: string }> {
  if (!invoice || !invoice.id) {
    console.warn("syncInvoiceToCASummary called without valid invoice ID");
    return { success: false, docId: "", message: "Invalid invoice object or missing ID" };
  }

  const docId = invoice.id;
  const businessId = invoice.businessId || "biz_shree_001";
  const dateStr = invoice.date || new Date().toISOString().split("T")[0];
  const monthKey = getMonthKeyFromDate(dateStr);
  const financialYear = getFinancialYearStrFromDate(dateStr);

  const breakdown = computeGstBreakdown(invoice, businessState);
  const finalStatus = action === "cancel" ? "cancelled" : (invoice.status || "paid");

  const summaryDoc: CASummaryRecordDoc = {
    id: docId,
    invoiceId: docId,
    businessId,
    createdByUserId: invoice.createdByUserId || "",
    invoiceNumber: invoice.invoiceNumber || "UNKNOWN",
    docType: invoice.docType || "invoice",
    partyId: invoice.partyId || "",
    partyName: invoice.partyName || "General Customer",
    partyGstin: invoice.partyGstin || "",
    partyState: invoice.partyState || "",
    date: dateStr,
    monthKey,
    financialYear,
    status: finalStatus,
    subtotal: invoice.subtotal || breakdown.taxableAmount,
    taxableAmount: breakdown.taxableAmount,
    cgstAmount: breakdown.cgstAmount,
    sgstAmount: breakdown.sgstAmount,
    igstAmount: breakdown.igstAmount,
    totalTax: invoice.totalTax || breakdown.totalGst,
    totalGst: breakdown.totalGst,
    otherCharges: breakdown.otherCharges,
    totalAmount: invoice.totalAmount || breakdown.billAmount,
    balanceDue: invoice.balanceDue || 0,
    isInterState: breakdown.isInterState,
    action,
    isDeleted: action === "delete",
    updatedAt: new Date().toISOString(),
    createdAt: invoice.createdAt || new Date().toISOString(),
  };

  try {
    // 1. Primary Top-Level Collection Write (ca_monthly_summaries/{invoiceId})
    const topDocRef = doc(db, "ca_monthly_summaries", docId);

    // 2. Business-Scoped Subcollection Write (businesses/{businessId}/ca_monthly_summaries/{invoiceId})
    const bizDocRef = doc(db, "businesses", businessId, "ca_monthly_summaries", docId);

    if (action === "delete") {
      // Delete from Firestore or soft-mark as deleted with status 'cancelled'
      await Promise.all([
        setDoc(topDocRef, { ...summaryDoc, status: "cancelled", isDeleted: true }, { merge: true }),
        setDoc(bizDocRef, { ...summaryDoc, status: "cancelled", isDeleted: true }, { merge: true }),
      ]);
    } else {
      // Single Source of Truth Write via setDoc with merge: true
      await Promise.all([
        setDoc(topDocRef, summaryDoc, { merge: true }),
        setDoc(bizDocRef, summaryDoc, { merge: true }),
      ]);
    }

    console.log(`[CA Summary Sync] Firestore updated document: ca_monthly_summaries/${docId} (Action: ${action}, Status: ${finalStatus})`);
    return {
      success: true,
      docId,
      message: `CA Monthly Summary collection updated in Firestore for Invoice #${invoice.invoiceNumber} (${action.toUpperCase()})`,
    };
  } catch (error: any) {
    console.error(`[CA Summary Sync Error] Failed to update Firestore for invoice ${docId}:`, error);
    return {
      success: false,
      docId,
      message: error?.message || "Firestore sync encountered an error",
    };
  }
}
