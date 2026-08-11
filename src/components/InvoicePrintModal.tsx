import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  Share2,
  Building2,
  Eye,
  FileText,
  Mail,
  Send,
  Copy,
  Check,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { Invoice } from "../types";
import { useApp } from "../context/AppContext";
import { formatCurrency, numberToIndianWords } from "../utils/gstUtils";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import { PdfPreviewModal } from "./PdfPreviewModal";

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  onClose,
}) => {
  const { profile, parties, showToast } = useApp();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [copied, setCopied] = useState(false);

  if (!invoice) return null;

  const handleOpenEmailModal = () => {
    // Lookup customer party email
    const customerParty = (parties || []).find(
      (p) =>
        (invoice.partyId && p.id === invoice.partyId) ||
        (invoice.partyName && p.name.toLowerCase() === invoice.partyName.toLowerCase())
    );
    const targetEmail = customerParty?.email || "";
    setEmailTo(targetEmail);

    const docName =
      invoice.docType === "invoice"
        ? "Tax Invoice"
        : invoice.docType.toUpperCase().replace("_", " ");

    setEmailSubject(
      `${docName} #${invoice.invoiceNumber} from ${profile.name || "Shree Technofab"}`
    );

    const defaultBody = `Dear ${invoice.partyName},

Please find attached ${docName} #${invoice.invoiceNumber} dated ${invoice.date}.

--- INVOICE SUMMARY ---
Doc Number   : ${invoice.invoiceNumber}
Date         : ${invoice.date}
Due Date     : ${invoice.dueDate}
Total Amount : ₹${(invoice.totalAmount || 0).toLocaleString("en-IN")}
Amount Paid  : ₹${(invoice.amountPaid || 0).toLocaleString("en-IN")}
Balance Due  : ₹${(invoice.balanceDue || 0).toLocaleString("en-IN")}

--- PAYMENT & BANK DETAILS ---
Bank Name    : ${profile.bankName || "N/A"}
Account No.  : ${profile.accountNumber || "N/A"}
IFSC Code    : ${profile.ifscCode || "N/A"}
Branch       : ${profile.branchName || "N/A"}
UPI ID       : ${profile.upiId || "N/A"}

Please feel free to reach out if you have any questions regarding this invoice.

Best regards,
${profile.name || "Shree Technofab"}
Phone: ${profile.phone || "N/A"}
Email: ${profile.email || "N/A"}`;

    setEmailBody(defaultBody);
    setIsEmailModalOpen(true);
  };

  const handleSendMailto = async () => {
    if (!emailTo.trim()) {
      showToast("Please enter a recipient email address", "info");
      return;
    }

    showToast("Generating & downloading PDF for email attachment...", "info");
    await generateInvoicePDF(invoice, profile, "download");

    const mailtoUrl = `mailto:${encodeURIComponent(emailTo.trim())}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;

    showToast("Opening default email client! PDF downloaded to attach.", "success");
    setIsEmailModalOpen(false);
  };

  const handleSendGmailWeb = async () => {
    if (!emailTo.trim()) {
      showToast("Please enter a recipient email address", "info");
      return;
    }

    showToast("Generating & downloading PDF for email attachment...", "info");
    await generateInvoicePDF(invoice, profile, "download");

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      emailTo.trim()
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, "_blank");

    showToast("Opening Gmail Web composer! PDF downloaded to attach.", "success");
    setIsEmailModalOpen(false);
  };

  const handleCopyEmailBody = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    showToast("Email draft text copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    showToast("Generating A4 PDF Document...");
    await generateInvoicePDF(invoice, profile, "download");
  };

  const handlePrintPdf = async () => {
    await generateInvoicePDF(invoice, profile, "print");
  };

  const handleSharePdf = async () => {
    await generateInvoicePDF(invoice, profile, "share");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      {/* Controls Bar */}
      <div className="fixed top-4 right-4 z-50 flex flex-wrap items-center gap-2 print:hidden">
        <button
          onClick={handleOpenEmailModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
          title="Send automated email draft with invoice details and PDF"
        >
          <Mail className="w-4 h-4" />
          <span>Email Invoice</span>
        </button>

        <button
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>A4 PDF Preview</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>

        <button
          onClick={handleSharePdf}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        <button
          onClick={handlePrintPdf}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print</span>
        </button>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        docType="invoice"
        invoiceData={invoice}
      />

      {/* Email Invoice Draft Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    Email Invoice Draft
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 border border-purple-400/30">
                      {invoice.invoiceNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-purple-200/80">
                    Recipient: <span className="font-bold text-white">{invoice.partyName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              {/* Recipient Email */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              {/* Body */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Email Message Body
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyEmailBody}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied!" : "Copy Text"}</span>
                  </button>
                </div>
                <textarea
                  rows={9}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
                />
              </div>

              {/* Attachment Badge */}
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Paperclip className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-purple-900 dark:text-purple-200">
                      PDF Attachment Ready: <span className="font-mono">{invoice.invoiceNumber}.pdf</span>
                    </p>
                    <p className="text-[10px] text-purple-700 dark:text-purple-300/80 font-medium">
                      PDF invoice is generated and saved to your Downloads when launching the email client.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Controls */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendGmailWeb}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Open draft in Gmail Web browser interface"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Send via Gmail Web</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendMailto}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Open in default Email app (Outlook, Apple Mail, Thunderbird, etc.)"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Container */}
      <div
        id="printable-invoice"
        className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 my-8 print:p-0 print:my-0 print:shadow-none print:w-full font-sans border border-slate-200 print:border-none"
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {profile.name || "Shree Technofab & ERP"}
              </h1>
            </div>
            <p className="text-xs text-slate-600 max-w-md font-medium leading-relaxed">
              {profile.address}, {profile.city}, {profile.state} - {profile.pincode}
            </p>
            <p className="text-xs text-slate-600 mt-1 font-semibold">
              GSTIN: <span className="font-mono text-slate-900 font-extrabold">{profile.gstin}</span> | PAN: {profile.pan}
            </p>
            <p className="text-xs text-slate-600">
              Email: {profile.email} | Mobile: {profile.phone}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white text-xs font-black uppercase tracking-widest mb-2">
              {invoice.docType === "invoice" ? "TAX INVOICE" : invoice.docType.toUpperCase().replace("_", " ")}
            </span>
            <p className="text-sm font-bold font-mono text-slate-900">
              Doc No: {invoice.invoiceNumber}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Date: <span className="font-semibold">{invoice.date}</span>
            </p>
            <p className="text-xs text-slate-600">
              Due Date: <span className="font-semibold">{invoice.dueDate}</span>
            </p>
            <p className="text-xs text-slate-600">
              Place of Supply: <span className="font-semibold">{invoice.partyState || profile.state}</span>
            </p>
          </div>
        </div>

        {/* Party Details (Billed To) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              BILLED TO / CUSTOMER DETAILS
            </span>
            <h3 className="text-base font-bold text-slate-900">{invoice.partyName}</h3>
            <p className="text-xs text-slate-600 mt-1 font-medium">{invoice.partyAddress || "Address on File"}</p>
            <p className="text-xs text-slate-700 font-semibold mt-1">
              GSTIN: <span className="font-mono text-slate-900">{invoice.partyGstin || "URP (Unregistered)"}</span>
            </p>
            <p className="text-xs text-slate-600">State: {invoice.partyState || "Maharashtra"}</p>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              PAYMENT & DISPATCH DETAILS
            </span>
            <p className="text-xs text-slate-700">
              Payment Mode: <span className="font-bold">{invoice.paymentMode}</span>
            </p>
            <p className="text-xs text-slate-700">
              Tax Type: <span className="font-bold">{invoice.isInterState ? "IGST (Inter-State)" : "CGST + SGST (Intra-State)"}</span>
            </p>
            <p className="text-xs text-slate-700 mt-1">
              Status: <span className="font-extrabold uppercase text-blue-700">{invoice.status.replace("_", " ")}</span>
            </p>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-2.5">#</th>
                <th className="p-2.5">Item Description</th>
                <th className="p-2.5">HSN/SAC</th>
                <th className="p-2.5 text-center">Qty</th>
                <th className="p-2.5 text-right">Rate (₹)</th>
                <th className="p-2.5 text-right">Disc %</th>
                <th className="p-2.5 text-right">Tax Rate</th>
                <th className="p-2.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item, idx) => (
                <tr key={item.id} className="text-slate-800">
                  <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                  <td className="p-2.5 font-semibold text-slate-900">{item.itemDescription}</td>
                  <td className="p-2.5 font-mono text-slate-600">{item.hsnSacCode}</td>
                  <td className="p-2.5 text-center font-bold">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="p-2.5 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-2.5 text-right font-mono">{item.discountPercent}%</td>
                  <td className="p-2.5 text-right font-mono">{item.taxRate}%</td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations & Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          {/* Amount in words & Bank Info */}
          <div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">
                AMOUNT IN WORDS
              </span>
              <p className="text-xs font-bold text-slate-900 leading-snug">
                {numberToIndianWords(invoice.totalAmount)}
              </p>
            </div>

            <div className="text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 uppercase block text-[10px] tracking-wider">
                OUR BANK DETAILS
              </span>
              <p>Bank: <span className="font-semibold">{profile.bankName}</span></p>
              <p>A/C No: <span className="font-mono font-bold">{profile.accountNumber}</span></p>
              <p>IFSC Code: <span className="font-mono font-bold">{profile.ifscCode}</span> | Branch: {profile.branchName}</p>
              <p>UPI ID: <span className="font-mono font-bold text-blue-700">{profile.upiId}</span></p>
            </div>
          </div>

          {/* Tax Breakdown & Totals */}
          <div className="space-y-2 text-xs font-medium text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Subtotal (Taxable Value):</span>
              <span className="font-mono font-bold">{formatCurrency(invoice.subtotal)}</span>
            </div>

            {invoice.totalDiscount > 0 && (
              <div className="flex justify-between py-1 text-emerald-700 border-b border-slate-100">
                <span>Total Discount:</span>
                <span className="font-mono font-bold">- {formatCurrency(invoice.totalDiscount)}</span>
              </div>
            )}

            {!invoice.isInterState ? (
              <>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Central Tax (CGST):</span>
                  <span className="font-mono font-bold">{formatCurrency(invoice.totalTax / 2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>State Tax (SGST):</span>
                  <span className="font-mono font-bold">{formatCurrency(invoice.totalTax / 2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Integrated Tax (IGST):</span>
                <span className="font-mono font-bold">{formatCurrency(invoice.totalTax)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-extrabold text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono text-base text-blue-700">{formatCurrency(invoice.totalAmount)}</span>
            </div>

            <div className="flex justify-between py-1 text-slate-600">
              <span>Amount Paid:</span>
              <span className="font-mono font-bold">{formatCurrency(invoice.amountPaid)}</span>
            </div>

            <div className="flex justify-between py-1 text-red-600 font-bold">
              <span>Balance Due:</span>
              <span className="font-mono">{formatCurrency(invoice.balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Footer Terms & Signatory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 mt-8 border-t border-slate-200">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              TERMS & CONDITIONS
            </span>
            <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
              {invoice.terms || profile.termsAndConditions}
            </p>
          </div>

          <div className="flex flex-col justify-between items-start sm:items-end h-28 pt-4">
            <p className="text-xs font-bold text-slate-800">For {profile.name || "Shree Technofab"}</p>
            <div className="text-center">
              <div className="w-32 h-10 border-b border-slate-400 mb-1" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                AUTHORIZED SIGNATORY
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
