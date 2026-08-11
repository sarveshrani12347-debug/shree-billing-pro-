import React, { useState } from "react";
import { X, FileText, Download, Printer, Eye, Check, Calendar } from "lucide-react";
import { CustomCashColumn, DailyCashEntry, BusinessProfile, ClosedCashDay } from "../../types";
import { generateDailyCashBookPDF, CashBookPDFOptions } from "../../utils/dailyCashbookPdf";

interface CustomPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DailyCashEntry[];
  profile: BusinessProfile;
  columns: CustomCashColumn[];
  defaultStartDate: string;
  defaultEndDate: string;
  defaultTitle?: string;
  closedDayInfo?: ClosedCashDay;
}

export const CustomPdfModal: React.FC<CustomPdfModalProps> = ({
  isOpen,
  onClose,
  entries,
  profile,
  columns,
  defaultStartDate,
  defaultEndDate,
  defaultTitle = "DAILY CASH BOOK",
  closedDayInfo,
}) => {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [reportTitle, setReportTitle] = useState(defaultTitle);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    columns.map((c) => c.name)
  );
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeTotalsSummary, setIncludeTotalsSummary] = useState(true);
  const [includeOpeningClosing, setIncludeOpeningClosing] = useState(true);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catName)
        ? prev.filter((c) => c !== catName)
        : [...prev, catName]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories(columns.map((c) => c.name));
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  const handleGenerate = async (action: "download" | "preview" | "print") => {
    setIsGenerating(true);
    try {
      // Filter entries by date range
      const periodEntries = entries.filter((e) => {
        if (startDate && e.date < startDate) return false;
        if (endDate && e.date > endDate) return false;
        return true;
      });

      const options: CashBookPDFOptions = {
        reportTitle: reportTitle.trim() || "DAILY CASH BOOK",
        dateFilterLabel: `${startDate} to ${endDate}`,
        selectedCategories: selectedCategories,
        includeNotes,
        includeTotalsSummary,
        includeOpeningClosing,
        openingBalance,
        closedDayInfo,
        columnsConfig: columns,
        action,
        orientation,
      };

      await generateDailyCashBookPDF(periodEntries, profile, options);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGenerating(false);
      if (action === "download") {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Custom PDF Generator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Configure layout, categories, columns, and date ranges
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close (×)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Report Title & Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Report Title
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Opening Balance (₹)
              </label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Categories Filter Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Include Categories / Custom Columns
              </label>
              <div className="flex gap-2 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={selectAllCategories}
                  className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={clearAllCategories}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {columns.map((col) => {
                const isChecked = selectedCategories.includes(col.name);
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => toggleCategory(col.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      isChecked
                        ? "shadow-2xs scale-102"
                        : "opacity-40 grayscale hover:grayscale-0 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: col.bgLightHex,
                      color: col.textColorHex,
                      borderColor: col.color,
                    }}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-white text-[10px] ${
                        isChecked ? "bg-slate-900 dark:bg-white dark:text-slate-900" : "bg-slate-300"
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Display & Layout Toggles */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
              PDF Options & Display Settings
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={includeTotalsSummary}
                  onChange={(e) => setIncludeTotalsSummary(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Include Category Summary Cards</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={includeOpeningClosing}
                  onChange={(e) => setIncludeOpeningClosing(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Include Balances & Differences</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Include Entry Notes Column</span>
              </label>

              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span>Page Orientation:</span>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-extrabold"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGenerate("preview")}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-purple-600" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerate("print")}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Print</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleGenerate("download")}
              disabled={isGenerating}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? "Generating..." : "Download PDF"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
