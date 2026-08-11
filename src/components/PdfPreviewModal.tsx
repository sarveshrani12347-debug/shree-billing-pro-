import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  Share2,
  Settings2,
  FileText,
  Check,
  QrCode,
  Building2,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  generateInvoicePDF,
  generatePurchaseOrderPDF,
  generateRecipeBOMPDF,
  generateProductionBatchPDF,
  generatePartyLedgerPDF,
  generateGenericReportPDF,
  generateCreditNotePDF,
} from "../utils/pdfGenerator";
import {
  Invoice,
  Purchase,
  Party,
  RecipeBOM,
  ProductionBatch,
  PdfSettings,
} from "../types";

export type PdfDocType =
  | "invoice"
  | "quotation"
  | "challan"
  | "credit_note"
  | "purchase_order"
  | "recipe_bom"
  | "production_batch"
  | "party_ledger"
  | "report";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: PdfDocType;
  invoiceData?: Invoice | null;
  purchaseData?: Purchase | null;
  partyData?: Party | null;
  recipeData?: RecipeBOM | null;
  batchData?: ProductionBatch | null;
  reportData?: {
    title: string;
    headers: string[];
    rows: (string | number)[][];
    summaryText: string;
  } | null;
  overrideTitle?: string;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  docType,
  invoiceData,
  purchaseData,
  partyData,
  recipeData,
  batchData,
  reportData,
  overrideTitle,
}) => {
  const { profile, updateProfile, showToast, invoices, purchases } = useApp();

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Local PDF settings state
  const currentPdfSettings: PdfSettings = profile.pdfSettings || {
    pdfThemeColor: "#0f172a",
    headerStyle: "modern",
    showLogo: true,
    showGstin: true,
    showBankDetails: true,
    showUpiQr: true,
    showTerms: true,
    showSignature: true,
    showShipTo: false,
    showHsn: true,
  };

  // Generate PDF blob URL on open or settings change
  const buildPdf = async (action: "preview" | "download" | "print" | "share" = "preview") => {
    setIsGenerating(true);
    try {
      let url = "";
      if (docType === "credit_note" && invoiceData) {
        url = await generateCreditNotePDF(invoiceData, profile, action);
      } else if (docType === "invoice" && invoiceData) {
        if (invoiceData.docType === "credit_note") {
          url = await generateCreditNotePDF(invoiceData, profile, action);
        } else {
          url = await generateInvoicePDF(invoiceData, profile, action, overrideTitle);
        }
      } else if (docType === "purchase_order" && purchaseData) {
        url = await generatePurchaseOrderPDF(purchaseData, profile, action);
      } else if (docType === "recipe_bom" && recipeData) {
        url = await generateRecipeBOMPDF(recipeData, profile, action);
      } else if (docType === "production_batch" && batchData) {
        url = await generateProductionBatchPDF(batchData, profile, action);
      } else if (docType === "party_ledger" && partyData) {
        url = await generatePartyLedgerPDF(partyData, invoices, purchases, profile, action);
      } else if (docType === "report" && reportData) {
        url = await generateGenericReportPDF(
          reportData.title,
          reportData.headers,
          reportData.rows,
          reportData.summaryText,
          profile,
          action
        );
      }

      if (action === "preview" && url) {
        setPdfBlobUrl(url);
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      showToast("Error generating PDF document");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      buildPdf("preview");
    } else {
      setPdfBlobUrl("");
    }
  }, [isOpen, docType, invoiceData?.id, purchaseData?.id, partyData?.id, recipeData?.id, batchData?.id]);

  if (!isOpen) return null;

  const handleSettingToggle = (key: keyof PdfSettings, value: any) => {
    const updatedSettings: PdfSettings = {
      ...currentPdfSettings,
      [key]: value,
    };
    const updatedProfile = {
      ...profile,
      pdfSettings: updatedSettings,
    };
    updateProfile(updatedProfile);
    setTimeout(() => {
      buildPdf("preview");
    }, 100);
  };

  const colorOptions = [
    { name: "Slate Dark", hex: "#0f172a" },
    { name: "Royal Blue", hex: "#2563eb" },
    { name: "Emerald Green", hex: "#059669" },
    { name: "Amber Gold", hex: "#d97706" },
    { name: "Crimson Red", hex: "#dc2626" },
    { name: "Indigo Purple", hex: "#4f46e5" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>PDF Document Preview (A4 Standard)</span>
                {isGenerating && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Ready to Print, Download or Share on WhatsApp / Email
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                showSettingsDrawer
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Customize PDF</span>
            </button>

            <button
              onClick={() => buildPdf("share")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={() => buildPdf("print")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={() => buildPdf("download")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* PDF View Canvas / Iframe */}
          <div className="flex-1 bg-slate-950 p-2 sm:p-4 flex items-center justify-center overflow-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-xs font-medium">Generating A4 PDF Document...</p>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full rounded-xl border border-slate-800 bg-white shadow-2xl"
                title="A4 PDF Preview"
              />
            ) : (
              <div className="text-slate-500 text-xs font-medium">
                Unable to load PDF preview. Click Download or Print.
              </div>
            )}
          </div>

          {/* Customize Drawer */}
          {showSettingsDrawer && (
            <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto space-y-5 animate-slideLeft text-xs text-slate-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-indigo-400" />
                  <span>PDF Document Layout</span>
                </h4>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theme Color Selector */}
              <div>
                <label className="block font-bold text-slate-300 mb-2 uppercase text-[10px] tracking-wider">
                  Header Accent Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleSettingToggle("pdfThemeColor", c.hex)}
                      className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        currentPdfSettings.pdfThemeColor === c.hex
                          ? "border-indigo-500 bg-slate-800 text-white ring-2 ring-indigo-500/50"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="truncate">{c.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                  Document Elements
                </label>

                {[
                  { key: "showBankDetails", label: "Show Bank Details" },
                  { key: "showUpiQr", label: "Show UPI QR Code" },
                  { key: "showTerms", label: "Show Terms & Conditions" },
                  { key: "showSignature", label: "Show Authorized Signatory" },
                  { key: "showHsn", label: "Show HSN / SAC Codes" },
                ].map((item) => {
                  const isChecked = Boolean(currentPdfSettings[item.key as keyof PdfSettings]);
                  return (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                    >
                      <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          handleSettingToggle(item.key as keyof PdfSettings, e.target.checked)
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => buildPdf("preview")}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Apply & Refresh PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
