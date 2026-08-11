import React, { useState } from "react";
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  Send,
  Phone,
  Mail,
  Building2,
  FileText,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  Share2,
  Printer,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Party } from "../types";
import { formatCurrency, buildWhatsAppReminderLink } from "../utils/gstUtils";
import { PartyModal } from "./PartyModal";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { generatePartyLedgerPDF } from "../utils/pdfGenerator";

export const PartyLedger: React.FC = () => {
  const { parties, invoices, deleteParty, profile, showToast } = useApp();

  const [tab, setTab] = useState<"all" | "customer" | "vendor">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // Modal State
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [pdfParty, setPdfParty] = useState<Party | null>(null);

  // Filter parties
  const filteredParties = parties.filter((p) => {
    const matchesTab = tab === "all" || p.type === tab;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.gstin && p.gstin.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  // Calculate Receivables & Payables
  const totalReceivables = parties
    .filter((p) => p.type === "customer" && p.balanceType === "collect")
    .reduce((acc, curr) => acc + (curr.openingBalance || 0), 0);

  const totalPayables = parties
    .filter((p) => p.type === "vendor" && p.balanceType === "pay")
    .reduce((acc, curr) => acc + (curr.openingBalance || 0), 0);

  // One-click WhatsApp Payment Reminder
  const handleSendWhatsAppReminder = (p: Party) => {
    const link = buildWhatsAppReminderLink(
      p.phone,
      p.name,
      p.openingBalance || 0,
      profile.name,
      profile.upiId
    );
    window.open(link, "_blank");
    showToast(`Generated WhatsApp payment reminder link for ${p.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Party Ledger & Customer CRM</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track Receivables, Payables, Transaction Log & One-Click WhatsApp Reminders
          </p>
        </div>

        <button
          onClick={() => {
            setEditingParty(null);
            setIsPartyModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Party</span>
        </button>
      </div>

      {/* Receivables vs Payables Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Outstanding Receivables (To Collect)
            </span>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-1">
              {formatCurrency(totalReceivables)}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Outstanding Payables (To Pay)
            </span>
            <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-1">
              {formatCurrency(totalPayables)}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[
            { id: "all", label: "All Parties" },
            { id: "customer", label: "Customers" },
            { id: "vendor", label: "Vendors" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === t.id
                  ? "bg-slate-900 text-white dark:bg-purple-600"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search party name, mobile or GSTIN..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Party Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.map((p) => {
          const isCustomer = p.type === "customer";
          const partyInvoices = invoices.filter((i) => i.partyId === p.id || i.partyName === p.name);

          return (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isCustomer
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                    }`}
                  >
                    {p.type}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">{p.state}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {p.name}
                </h3>

                <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <p className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.phone}</span>
                  </p>
                  {p.gstin && (
                    <p className="flex items-center gap-1.5 font-mono">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>GST: {p.gstin}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Balance & Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {p.balanceType === "collect" ? "Outstanding Collect:" : "Outstanding Pay:"}
                  </span>
                  <span
                    className={`font-mono font-extrabold text-sm ${
                      p.balanceType === "collect" ? "text-blue-600 dark:text-blue-400" : "text-purple-600 dark:text-purple-400"
                    }`}
                  >
                    {formatCurrency(p.openingBalance)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {/* PDF Statement Button */}
                  <button
                    onClick={() => setPdfParty(p)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title="Download / Print PDF Ledger"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF Statement</span>
                  </button>

                  {/* WhatsApp Reminder Button */}
                  {isCustomer && p.openingBalance > 0 && (
                    <button
                      onClick={() => handleSendWhatsAppReminder(p)}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center transition-all shadow-sm cursor-pointer"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingParty(p);
                      setIsPartyModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                    title="Edit Party"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteParty(p.id)}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 hover:bg-red-100 cursor-pointer"
                    title="Delete Party"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {(isPartyModalOpen || editingParty) && (
        <PartyModal
          party={editingParty}
          onClose={() => {
            setIsPartyModalOpen(false);
            setEditingParty(null);
          }}
        />
      )}

      {/* PDF Ledger Statement Modal */}
      {pdfParty && (
        <PdfPreviewModal
          isOpen={!!pdfParty}
          onClose={() => setPdfParty(null)}
          docType="party_ledger"
          partyData={pdfParty}
        />
      )}
    </div>
  );
};
