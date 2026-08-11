import React, { useState } from "react";
import { X, Wallet, ArrowDownRight, ArrowUpRight, CheckCircle, Upload } from "lucide-react";
import { PaymentMode } from "../types";
import { useApp } from "../context/AppContext";

interface CashbookModalProps {
  initialType?: "in" | "out";
  onClose: () => void;
}

export const CashbookModal: React.FC<CashbookModalProps> = ({
  initialType = "in",
  onClose,
}) => {
  const { addCashEntry, parties } = useApp();

  const [type, setType] = useState<"in" | "out">(initialType);
  const [amount, setAmount] = useState<number>(5000);
  const [category, setCategory] = useState<string>(
    initialType === "in" ? "Customer Collection" : "Office Rent"
  );
  const [partyName, setPartyName] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [referenceNo, setReferenceNo] = useState<string>(
    `UPI/2026/${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [description, setDescription] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    addCashEntry({
      date: new Date().toISOString().split("T")[0],
      type,
      amount: Number(amount),
      category,
      partyName,
      paymentMode,
      referenceNo,
      description,
      receiptUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold ${
                type === "in" ? "bg-emerald-600" : "bg-red-600"
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {type === "in" ? "Record Cash Inflow (+)" : "Record Cash Outflow (-)"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily cashbook entry & receipt attachment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setType("in");
                setCategory("Customer Collection");
              }}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === "in"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Cash In (+)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType("out");
                setCategory("Rent");
              }}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === "out"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Cash Out (-)</span>
            </button>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-xl text-slate-900 dark:text-white font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category Tag
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                {type === "in" ? (
                  <>
                    <option value="Customer Collection">Customer Collection</option>
                    <option value="Counter Sale">Counter Cash Sale</option>
                    <option value="Refund">Vendor Refund</option>
                    <option value="Other Inflow">Other Income</option>
                  </>
                ) : (
                  <>
                    <option value="Rent">Office / Warehouse Rent</option>
                    <option value="Utilities">Utilities & Electricity</option>
                    <option value="Salary">Staff Salary & Wages</option>
                    <option value="Raw Material">Raw Material Purchase</option>
                    <option value="Refreshment">Tea & Client Refreshments</option>
                    <option value="Travel">Travel & Logistics</option>
                    <option value="Other Expense">Other Expense</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Party / Receiver Name (Optional)
            </label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              placeholder="e.g. Apex Tech or MSEDCL Dept"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Ref # / UTR
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description / Memo
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              placeholder="e.g. Rent payment for August or Tea meeting..."
              required
            />
          </div>

          {/* Receipt Attachment Upload */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Attach Bill / Receipt Photo
            </label>
            <div className="flex items-center gap-3">
              <label className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 flex items-center gap-1.5 font-bold">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Upload Receipt</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {receiptUrl && (
                <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Receipt Attached
                </span>
              )}
            </div>
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
              className={`px-5 py-2 rounded-xl text-white font-bold flex items-center gap-1.5 shadow-md ${
                type === "in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Record Cash {type === "in" ? "In" : "Out"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
