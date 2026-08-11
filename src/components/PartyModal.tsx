import React, { useState } from "react";
import { X, Users, CheckCircle } from "lucide-react";
import { Party, PartyType } from "../types";
import { useApp } from "../context/AppContext";

interface PartyModalProps {
  party: Party | null;
  onClose: () => void;
}

export const PartyModal: React.FC<PartyModalProps> = ({
  party,
  onClose,
}) => {
  const { addParty, updateParty } = useApp();

  const [type, setType] = useState<PartyType>(party?.type || "customer");
  const [name, setName] = useState(party?.name || "");
  const [phone, setPhone] = useState(party?.phone || "");
  const [email, setEmail] = useState(party?.email || "");
  const [gstin, setGstin] = useState(party?.gstin || "");
  const [address, setAddress] = useState(party?.address || "");
  const [state, setState] = useState(party?.state || "Maharashtra");
  const [openingBalance, setOpeningBalance] = useState(party?.openingBalance || 0);
  const [balanceType, setBalanceType] = useState<"collect" | "pay">(
    party?.balanceType || "collect"
  );
  const [creditLimit, setCreditLimit] = useState(party?.creditLimit || 100000);
  const [notes, setNotes] = useState(party?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (party) {
      updateParty({
        ...party,
        type,
        name,
        phone,
        email,
        gstin,
        address,
        state,
        openingBalance: Number(openingBalance),
        balanceType,
        creditLimit: Number(creditLimit),
        notes,
      });
    } else {
      addParty({
        type,
        name,
        phone,
        email,
        gstin,
        address,
        state,
        openingBalance: Number(openingBalance),
        balanceType,
        creditLimit: Number(creditLimit),
        notes,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">
              {party ? "Edit Party Ledger Details" : "Add New Customer / Vendor Party"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Party Type Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setType("customer");
                setBalanceType("collect");
              }}
              className={`py-2 rounded-xl font-bold transition-all ${
                type === "customer"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Customer (Debtor)
            </button>
            <button
              type="button"
              onClick={() => {
                setType("vendor");
                setBalanceType("pay");
              }}
              className={`py-2 rounded-xl font-bold transition-all ${
                type === "vendor"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Vendor (Creditor)
            </button>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Business / Party Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              placeholder="e.g. Apex Tech Solutions Ltd"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number (for WhatsApp Reminders)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                placeholder="9820123456"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                placeholder="accounts@apextech.in"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN Number (15 Digits)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                placeholder="27AAACA9876E1ZS"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                State (POS)
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                {[
                  "Maharashtra",
                  "Gujarat",
                  "Karnataka",
                  "Delhi",
                  "Tamil Nadu",
                  "Telangana",
                  "West Bengal",
                  "Uttar Pradesh",
                  "Rajasthan",
                  "Other State",
                ].map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              placeholder="Suite 401, Cyber Park, Andheri East, Mumbai"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Opening Balance (₹)
              </label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Balance Direction
              </label>
              <select
                value={balanceType}
                onChange={(e) => setBalanceType(e.target.value as "collect" | "pay")}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="collect">To Collect (Receivable)</option>
                <option value="pay">To Pay (Payable)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Internal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              placeholder="Terms, credit terms, contact person..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save Party</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
