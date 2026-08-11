import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Calendar,
  Check,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building2,
  Wallet,
  Smartphone,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  ShieldCheck,
  History,
  Settings,
  Clock,
  Download,
  Lock,
  Sliders,
  Unlock,
  Eye,
  ChevronDown,
  AlertTriangle,
  Target,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useApp } from "../context/AppContext";
import { DailyCashEntry, CustomCashColumn } from "../types";
import { formatCurrency } from "../utils/gstUtils";
import { generateDailyCashBookPDF } from "../utils/dailyCashbookPdf";
import { exportDailyCashBookExcel } from "../utils/dailyCashbookExcel";
import { CustomColumnModal } from "./cashbook/CustomColumnModal";
import { CustomPdfModal } from "./cashbook/CustomPdfModal";
import { EntryDetailModal } from "./cashbook/EntryDetailModal";

export const DailyCashBook: React.FC = () => {
  const {
    profile,
    dailyCashEntries,
    addDailyCashEntry,
    updateDailyCashEntry,
    deleteDailyCashEntry,
    closedCashDays,
    closeCashDay,
    reopenCashDay,
    isDayClosed,
    cashColumns,
    dailyExpenseBudget,
    setDailyExpenseBudget,
    addCustomColumn,
    updateCustomColumn,
    deleteCustomColumn,
    toggleColumnEnabled,
    showToast,
    auditLogs,
    currentUser,
  } = useApp();

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [dateMode, setDateMode] = useState<"daily" | "monthly" | "yearly" | "custom">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  // Modals state
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalTitle, setPdfModalTitle] = useState("DAILY CASH BOOK");
  const [viewingEntry, setViewingEntry] = useState<DailyCashEntry | null>(null);

  // Settings & Audit Log Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"preferences" | "audit_log">("preferences");
  const [tempBudgetInput, setTempBudgetInput] = useState<string>(dailyExpenseBudget ? dailyExpenseBudget.toString() : "0");
  const [auditSearchTerm, setAuditSearchTerm] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState<"ALL" | "CREATE" | "UPDATE" | "DELETE" | "TOGGLE">("ALL");

  // PDF Dropdown Menu State
  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);

  // Add / Edit Entry Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyCashEntry | null>(null);

  // Delete Confirmation Modal State
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<DailyCashEntry | null>(null);

  // Close Day Modal State
  const [isCloseDayModalOpen, setIsCloseDayModalOpen] = useState(false);
  const [closeDayOpeningCash, setCloseDayOpeningCash] = useState<number>(0);
  const [closeDayActualCash, setCloseDayActualCash] = useState<string>("");
  const [closeDayNotes, setCloseDayNotes] = useState<string>("");

  // Reopen Day Confirm State
  const [isReopenConfirmOpen, setIsReopenConfirmOpen] = useState(false);

  // Form Fields for Entry Add/Edit
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formPartyName, setFormPartyName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPaymentType, setFormPaymentType] = useState<string>("Cash Entry");
  const [formDirection, setFormDirection] = useState<"income" | "expense">("income");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formReferenceNo, setFormReferenceNo] = useState("");
  const [formStatus, setFormStatus] = useState<"Completed" | "Pending">("Completed");
  const [formNotes, setFormNotes] = useState("");
  const [formAddToTotal, setFormAddToTotal] = useState<boolean>(true);

  // Enabled Cash Columns
  const activeColumns = useMemo(() => {
    return cashColumns.filter((c) => c.enabled);
  }, [cashColumns]);

  // Filtered Entries based on mode and criteria
  const filteredEntries = useMemo(() => {
    return dailyCashEntries.filter((e) => {
      // Type / Category Filter
      if (selectedType !== "ALL" && e.paymentType !== selectedType) {
        return false;
      }

      // Search Term Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchParty = (e.partyName || "").toLowerCase().includes(q);
        const matchDesc = e.description.toLowerCase().includes(q);
        const matchNotes = (e.notes || "").toLowerCase().includes(q);
        const matchRef = (e.referenceNo || "").toLowerCase().includes(q);
        const matchType = e.paymentType.toLowerCase().includes(q);
        const matchAmount = e.amount.toString().includes(q);
        if (!matchParty && !matchDesc && !matchNotes && !matchRef && !matchType && !matchAmount) {
          return false;
        }
      }

      // Date Filtering based on Date Mode
      if (dateMode === "daily") {
        return e.date === selectedDate;
      } else if (dateMode === "monthly") {
        const targetPrefix = `${selectedYear}-${selectedMonth}`;
        return e.date.startsWith(targetPrefix);
      } else if (dateMode === "yearly") {
        return e.date.startsWith(selectedYear);
      } else if (dateMode === "custom") {
        if (startDate && e.date < startDate) return false;
        if (endDate && e.date > endDate) return false;
      }

      return true;
    });
  }, [dailyCashEntries, selectedType, searchTerm, dateMode, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  // Category Summaries Calculation
  const categoryTotalsMap = useMemo(() => {
    const map: Record<string, number> = {};
    activeColumns.forEach((col) => {
      map[col.name] = 0;
    });

    let totalReceived = 0;
    let totalPaid = 0;
    let includedCount = 0;
    let excludedCount = 0;

    filteredEntries.forEach((e) => {
      if (e.addToTotal) {
        const val = e.direction === "income" ? e.amount : -e.amount;
        if (map[e.paymentType] !== undefined) {
          map[e.paymentType] += val;
        } else {
          map[e.paymentType] = val;
        }

        if (e.direction === "income") {
          totalReceived += e.amount;
        } else {
          totalPaid += e.amount;
        }
        includedCount++;
      } else {
        excludedCount++;
      }
    });

    const netTotal = totalReceived - totalPaid;

    return {
      map,
      totalReceived,
      totalPaid,
      netTotal,
      includedCount,
      excludedCount,
      totalEntries: filteredEntries.length,
    };
  }, [filteredEntries, activeColumns]);

  // Current active date string for closing / lock check
  const activeLockDate = dateMode === "daily" ? selectedDate : new Date().toISOString().slice(0, 10);
  const activeClosedDayInfo = useMemo(() => {
    return closedCashDays.find((c) => c.date === activeLockDate);
  }, [closedCashDays, activeLockDate]);

  // Active day total expense paid calculation for threshold monitoring
  const activeDatePaidTotal = useMemo(() => {
    return dailyCashEntries
      .filter((e) => e.date === activeLockDate && e.direction === "expense" && e.addToTotal)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [dailyCashEntries, activeLockDate]);

  const isBudgetSet = dailyExpenseBudget > 0;
  const isBudgetExceeded = isBudgetSet && activeDatePaidTotal > dailyExpenseBudget;
  const budgetExcessAmount = activeDatePaidTotal - dailyExpenseBudget;
  const budgetUsagePercent = isBudgetSet ? Math.round((activeDatePaidTotal / dailyExpenseBudget) * 100) : 0;

  // Chart datasets
  const barChartData = useMemo(() => {
    return [
      {
        name: "Total Received (+)",
        amount: categoryTotalsMap.totalReceived,
        fill: "#2563eb",
      },
      {
        name: "Total Paid (-)",
        amount: categoryTotalsMap.totalPaid,
        fill: "#e11d48",
      },
      {
        name: "Net Total",
        amount: Math.abs(categoryTotalsMap.netTotal),
        fill: categoryTotalsMap.netTotal >= 0 ? "#059669" : "#dc2626",
      },
    ];
  }, [categoryTotalsMap]);

  const pieChartData = useMemo(() => {
    return activeColumns
      .map((col) => {
        const val = Math.abs(categoryTotalsMap.map[col.name] || 0);
        return {
          name: col.name,
          value: val,
          color: col.color,
        };
      })
      .filter((item) => item.value > 0);
  }, [activeColumns, categoryTotalsMap]);

  // Handlers for Add / Edit
  const handleOpenAdd = () => {
    if (isDayClosed(activeLockDate)) {
      showToast(`Cannot add transaction. Cash book for ${activeLockDate} is CLOSED!`, "error");
      return;
    }
    setEditingEntry(null);
    setFormDate(activeLockDate);
    setFormPartyName("");
    setFormDescription("");
    setFormPaymentType(activeColumns[0]?.name || "Cash Entry");
    setFormDirection("income");
    setFormAmount("");
    setFormReferenceNo("");
    setFormStatus("Completed");
    setFormNotes("");
    setFormAddToTotal(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: DailyCashEntry) => {
    if (isDayClosed(entry.date)) {
      showToast(`Cannot edit transaction. Cash book for ${entry.date} is CLOSED!`, "error");
      return;
    }
    setEditingEntry(entry);
    setFormDate(entry.date);
    setFormPartyName(entry.partyName || "");
    setFormDescription(entry.description);
    setFormPaymentType(entry.paymentType);
    setFormDirection(entry.direction);
    setFormAmount(entry.amount.toString());
    setFormReferenceNo(entry.referenceNo || "");
    setFormStatus(entry.status || "Completed");
    setFormNotes(entry.notes || "");
    setFormAddToTotal(entry.addToTotal);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      showToast("Please enter a description or party name", "warning");
      return;
    }
    const numAmt = parseFloat(formAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      showToast("Please enter a valid amount greater than 0", "warning");
      return;
    }

    if (editingEntry) {
      updateDailyCashEntry({
        ...editingEntry,
        date: formDate,
        partyName: formPartyName.trim(),
        description: formDescription.trim(),
        paymentType: formPaymentType,
        direction: formDirection,
        amount: numAmt,
        referenceNo: formReferenceNo.trim(),
        status: formStatus,
        notes: formNotes.trim(),
        addToTotal: formAddToTotal,
      });
    } else {
      addDailyCashEntry({
        date: formDate,
        partyName: formPartyName.trim(),
        description: formDescription.trim(),
        paymentType: formPaymentType,
        direction: formDirection,
        amount: numAmt,
        referenceNo: formReferenceNo.trim(),
        status: formStatus,
        notes: formNotes.trim(),
        addToTotal: formAddToTotal,
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleAddToTotal = (entry: DailyCashEntry) => {
    if (isDayClosed(entry.date)) {
      showToast(`Cash book for ${entry.date} is locked!`, "error");
      return;
    }
    updateDailyCashEntry({
      ...entry,
      addToTotal: !entry.addToTotal,
    });
  };

  const handleConfirmDeleteEntry = () => {
    if (!deleteConfirmEntry) return;
    deleteDailyCashEntry(deleteConfirmEntry.id);
    setDeleteConfirmEntry(null);
  };

  // Close Day handlers
  const handleOpenCloseDayModal = () => {
    const dayEntries = dailyCashEntries.filter((e) => e.date === activeLockDate && e.addToTotal);
    const rec = dayEntries.filter((e) => e.direction === "income").reduce((s, e) => s + e.amount, 0);
    const paid = dayEntries.filter((e) => e.direction === "expense").reduce((s, e) => s + e.amount, 0);

    const exp = rec - paid;
    setCloseDayOpeningCash(0);
    setCloseDayActualCash(exp >= 0 ? exp.toString() : "0");
    setCloseDayNotes("Day cash book verified and closed.");
    setIsCloseDayModalOpen(true);
  };

  const handleConfirmCloseDay = (e: React.FormEvent) => {
    e.preventDefault();
    const dayEntries = dailyCashEntries.filter((e) => e.date === activeLockDate && e.addToTotal);
    const rec = dayEntries.filter((e) => e.direction === "income").reduce((s, e) => s + e.amount, 0);
    const paid = dayEntries.filter((e) => e.direction === "expense").reduce((s, e) => s + e.amount, 0);
    const opening = closeDayOpeningCash || 0;
    const exp = opening + rec - paid;
    const actual = parseFloat(closeDayActualCash) || 0;
    const diff = actual - exp;

    closeCashDay({
      date: activeLockDate,
      openingBalance: opening,
      totalReceived: rec,
      totalPaid: paid,
      expectedCash: exp,
      actualCash: actual,
      difference: diff,
      closedBy: currentUser?.name || "Owner",
      closedAt: new Date().toISOString(),
      notes: closeDayNotes.trim(),
    });
    setIsCloseDayModalOpen(false);
  };

  const handleConfirmReopenDay = () => {
    reopenCashDay(activeLockDate);
    setIsReopenConfirmOpen(false);
  };

  // PDF Export Quick Handlers
  const handleQuickPdfDownload = async (type: "daily" | "monthly" | "yearly" | "custom") => {
    setIsPdfDropdownOpen(false);
    let title = "DAILY CASH BOOK";
    let label = "All Transactions";

    if (type === "daily") {
      title = `DAILY CASH BOOK - ${selectedDate}`;
      label = `Date: ${selectedDate}`;
      await generateDailyCashBookPDF(filteredEntries, profile, {
        reportTitle: title,
        dateFilterLabel: label,
        columnsConfig: cashColumns,
      });
    } else if (type === "monthly") {
      title = `MONTHLY CASH BOOK - ${selectedMonth}/${selectedYear}`;
      label = `Month: ${selectedMonth}/${selectedYear}`;
      await generateDailyCashBookPDF(filteredEntries, profile, {
        reportTitle: title,
        dateFilterLabel: label,
        columnsConfig: cashColumns,
        orientation: "landscape",
      });
    } else if (type === "yearly") {
      title = `YEARLY CASH BOOK - ${selectedYear}`;
      label = `Year: ${selectedYear}`;
      await generateDailyCashBookPDF(filteredEntries, profile, {
        reportTitle: title,
        dateFilterLabel: label,
        columnsConfig: cashColumns,
        orientation: "landscape",
      });
    } else {
      setPdfModalTitle("CUSTOM DAILY CASH BOOK REPORT");
      setIsPdfModalOpen(true);
    }
  };

  // Excel Export Handler
  const handleExcelExport = () => {
    let label = "Report";
    if (dateMode === "daily") label = `Daily (${selectedDate})`;
    else if (dateMode === "monthly") label = `Monthly (${selectedMonth}/${selectedYear})`;
    else if (dateMode === "yearly") label = `Yearly (${selectedYear})`;
    else label = `Custom (${startDate} to ${endDate})`;

    exportDailyCashBookExcel(filteredEntries, profile, {
      dateFilterLabel: label,
      columnsConfig: cashColumns,
      openingBalance: activeClosedDayInfo ? activeClosedDayInfo.openingBalance : 0,
      actualCash: activeClosedDayInfo ? activeClosedDayInfo.actualCash : undefined,
    });
    showToast("Daily Cash Book Excel downloaded successfully!", "success");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header & Navigation Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Daily Cash Book</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-xs font-extrabold border border-purple-200 dark:border-purple-800">
                  Pro Edition
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Multi-category cash entries, custom color columns, and instant PDF/Excel exports
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Settings & Budget Threshold */}
            <button
              onClick={() => {
                setTempBudgetInput(dailyExpenseBudget.toString());
                setSettingsTab("preferences");
                setIsSettingsModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
              title="Daily Expense Budget Settings & Audit Trail"
            >
              <Settings className="w-4 h-4 text-purple-600" />
              <span>Settings</span>
            </button>

            {/* + Add Custom Column */}
            <button
              onClick={() => setIsColumnModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>+ Custom Columns</span>
            </button>

            {/* Download PDF Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsPdfDropdownOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
                <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
              </button>

              {isPdfDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-30 animate-fadeIn text-xs font-bold">
                  <button
                    onClick={() => handleQuickPdfDownload("daily")}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Daily PDF</span>
                  </button>
                  <button
                    onClick={() => handleQuickPdfDownload("monthly")}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>Monthly PDF</span>
                  </button>
                  <button
                    onClick={() => handleQuickPdfDownload("yearly")}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Yearly PDF</span>
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    onClick={() => handleQuickPdfDownload("custom")}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 font-black flex items-center gap-2"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Custom PDF...</span>
                  </button>
                </div>
              )}
            </div>

            {/* Download Excel */}
            <button
              onClick={handleExcelExport}
              className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel</span>
            </button>

            {/* Close Day / Reopen Day */}
            {isDayClosed(activeLockDate) ? (
              <button
                onClick={() => setIsReopenConfirmOpen(true)}
                className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                <span>Reopen Day</span>
              </button>
            ) : (
              <button
                onClick={handleOpenCloseDayModal}
                className="px-3.5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4" />
                <span>Close Day</span>
              </button>
            )}

            {/* + Add Entry */}
            <button
              onClick={handleOpenAdd}
              disabled={isDayClosed(activeLockDate)}
              className={`px-4 py-2 rounded-2xl font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 text-white ${
                isDayClosed(activeLockDate)
                  ? "bg-slate-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Entry</span>
            </button>
          </div>
        </div>

        {/* Global Real-Time Search Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-purple-600 dark:text-purple-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions globally by party name, description, ref/cheque number..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchTerm.trim() && (
            <div className="mt-2 flex items-center justify-between text-xs px-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/70 px-2.5 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800/80 text-[11px]">
                  Search Filter: &quot;{searchTerm.trim()}&quot;
                </span>
                <span className="text-slate-500 font-bold text-[11px]">
                  Found {filteredEntries.length} matching {filteredEntries.length === 1 ? "entry" : "entries"} (Date filter active)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-[11px] underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Daily Expense Budget Exceeded Warning Banner */}
        {isBudgetExceeded && (
          <div className="p-4 rounded-3xl bg-rose-500/15 border-2 border-rose-500/50 shadow-md flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-sm shrink-0">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                    Daily Expense Budget Exceeded!
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase">
                    Threshold Alert
                  </span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-300 font-medium mt-0.5">
                  Total daily expenditure for <span className="font-bold underline">{activeLockDate}</span> is{" "}
                  <span className="font-black text-rose-700 dark:text-rose-100">₹{formatCurrency(activeDatePaidTotal)}</span>, exceeding your daily budget threshold limit of{" "}
                  <span className="font-bold">₹{formatCurrency(dailyExpenseBudget)}</span> by{" "}
                  <span className="font-black text-rose-600 dark:text-rose-400">₹{formatCurrency(budgetExcessAmount)}</span> ({budgetUsagePercent}% of limit).
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setTempBudgetInput(dailyExpenseBudget.toString());
                setSettingsTab("preferences");
                setIsSettingsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Target className="w-4 h-4" />
              <span>Adjust Budget Threshold</span>
            </button>
          </div>
        )}

        {/* Daily Expense Budget Approaching Limit Banner (80% - 100%) */}
        {!isBudgetExceeded && isBudgetSet && budgetUsagePercent >= 80 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Daily Budget Warning: Today&apos;s total expenditure (<span className="font-extrabold">₹{formatCurrency(activeDatePaidTotal)}</span>) has reached <span className="font-black text-amber-700 dark:text-amber-300">{budgetUsagePercent}%</span> of your daily threshold limit (₹{formatCurrency(dailyExpenseBudget)}).
              </span>
            </div>
            <button
              onClick={() => {
                setTempBudgetInput(dailyExpenseBudget.toString());
                setSettingsTab("preferences");
                setIsSettingsModalOpen(true);
              }}
              className="text-amber-800 dark:text-amber-300 font-black underline hover:text-amber-900 cursor-pointer text-[11px]"
            >
              Manage Limit
            </button>
          </div>
        )}

        {/* Closed Day Locked Banner */}
        {activeClosedDayInfo && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-200 font-extrabold">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Day Cash Book for <span className="underline font-mono">{activeLockDate}</span> is CLOSED & LOCKED by {activeClosedDayInfo.closedBy}.
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <span>Expected: ₹{activeClosedDayInfo.expectedCash.toLocaleString("en-IN")}</span>
              <span>Actual: ₹{activeClosedDayInfo.actualCash.toLocaleString("en-IN")}</span>
              <span className={activeClosedDayInfo.difference === 0 ? "text-emerald-600 font-black" : "text-rose-600 font-black"}>
                Diff: ₹{activeClosedDayInfo.difference.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}

        {/* 2. Custom Columns Category Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Columns ({activeColumns.length}/7):
            </span>

            {/* ALL filter button */}
            <button
              onClick={() => setSelectedType("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                selectedType === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 border-transparent"
              }`}
            >
              ALL
            </button>

            {/* Custom/Default Column Badges */}
            {activeColumns.map((col) => {
              const isSelected = selectedType === col.name;
              return (
                <button
                  key={col.id}
                  onClick={() => setSelectedType(col.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5 ${
                    isSelected ? "ring-2 ring-offset-1 ring-purple-600 scale-105" : "opacity-90 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: col.bgLightHex,
                    color: col.textColorHex,
                    borderColor: col.color,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span>{col.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Date Mode Selector Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setDateMode("daily")}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                dateMode === "daily"
                  ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setDateMode("monthly")}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                dateMode === "monthly"
                  ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setDateMode("yearly")}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                dateMode === "yearly"
                  ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Yearly
            </button>
            <button
              onClick={() => setDateMode("custom")}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                dateMode === "custom"
                  ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Date controls based on mode */}
          <div className="flex items-center gap-2">
            {dateMode === "daily" && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-bold text-slate-500">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-black text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            )}

            {dateMode === "monthly" && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white"
                >
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            )}

            {dateMode === "yearly" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white"
              >
                <option value="2025">Year 2025</option>
                <option value="2026">Year 2026</option>
                <option value="2027">Year 2027</option>
              </select>
            )}

            {dateMode === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                />
                <span className="text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Key Total Metrics Bar & Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Received (Blue) */}
        <div className="p-5 rounded-3xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <span>Total Received (+)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
            +₹{formatCurrency(categoryTotalsMap.totalReceived)}
          </p>
          <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 font-medium">
            Positive Cash Receipts included in total
          </p>
        </div>

        {/* Total Paid (Red) */}
        <div
          className={`p-5 rounded-3xl transition-all shadow-xs space-y-2 ${
            isBudgetExceeded
              ? "bg-rose-100/90 dark:bg-rose-950/70 border-2 border-rose-500 dark:border-rose-600 shadow-md"
              : "bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60"
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
            <span>Total Paid (-)</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-2xl font-black text-rose-700 dark:text-rose-300">
              -₹{formatCurrency(categoryTotalsMap.totalPaid)}
            </p>
            {isBudgetSet && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  isBudgetExceeded
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                }`}
              >
                {isBudgetExceeded ? "⚠️ Over Budget" : `${budgetUsagePercent}% Budget`}
              </span>
            )}
          </div>

          {isBudgetSet ? (
            <div className="space-y-1.5 pt-1 border-t border-rose-200/60 dark:border-rose-800/40">
              <div className="flex justify-between text-[11px] font-bold text-rose-800 dark:text-rose-300">
                <span>Daily Budget: ₹{formatCurrency(dailyExpenseBudget)}</span>
                <span>Today Expense: ₹{formatCurrency(activeDatePaidTotal)}</span>
              </div>
              <div className="w-full bg-rose-200/80 dark:bg-rose-900/60 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isBudgetExceeded ? "bg-rose-600" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium">
              Expense payments & outgoings (Budget not configured)
            </p>
          )}
        </div>

        {/* Net Total */}
        <div className="p-5 rounded-3xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Net Period Cash Balance</span>
            <Wallet className="w-4 h-4 text-purple-400" />
          </div>
          <p
            className={`text-2xl font-black ${
              categoryTotalsMap.netTotal >= 0 ? "text-blue-400" : "text-rose-400"
            }`}
          >
            {categoryTotalsMap.netTotal >= 0 ? "+" : "-"}₹{formatCurrency(Math.abs(categoryTotalsMap.netTotal))}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            Net difference (Received minus Paid)
          </p>
        </div>
      </div>

      {/* Category Summaries Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {activeColumns.map((col) => {
          const catVal = categoryTotalsMap.map[col.name] || 0;
          return (
            <div
              key={col.id}
              className="p-3.5 rounded-2xl border transition-all shadow-2xs space-y-1"
              style={{
                backgroundColor: col.bgLightHex,
                borderColor: col.color,
              }}
            >
              <span
                className="text-[10px] font-black uppercase tracking-wider block"
                style={{ color: col.textColorHex }}
              >
                {col.name}
              </span>
              <p className="text-base font-black" style={{ color: col.textColorHex }}>
                {catVal >= 0 ? "+" : "-"}₹{formatCurrency(Math.abs(catVal))}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3. Main Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search party, description, ref no..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
            <span>Showing {filteredEntries.length} entries</span>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Date</th>
                <th className="p-3.5">Party / Customer / Vendor</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Payment Category</th>
                <th className="p-3.5">Ref / Payment No.</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Include in Total</th>
                <th className="p-3.5 text-center pr-5">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                    No transaction entries found for the selected filter period.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isIncome = entry.direction === "income";
                  const matchedCol = cashColumns.find((c) => c.name === entry.paymentType);

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {entry.date}
                      </td>

                      <td className="p-3.5 font-black text-slate-900 dark:text-white">
                        {entry.partyName || entry.description || "-"}
                      </td>

                      <td className="p-3.5 font-medium text-slate-600 dark:text-slate-300">
                        {entry.description}
                      </td>

                      <td className="p-3.5">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[11px] font-black border inline-block"
                          style={{
                            backgroundColor: matchedCol?.bgLightHex || "#eff6ff",
                            color: matchedCol?.textColorHex || "#1e40af",
                            borderColor: matchedCol?.color || "#3b82f6",
                          }}
                        >
                          {entry.paymentType}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-slate-500 font-semibold">
                        {entry.referenceNo || "-"}
                      </td>

                      <td className="p-3.5 text-right font-black text-sm">
                        <span
                          className={
                            isIncome
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {isIncome ? "+" : "-"}₹{formatCurrency(entry.amount)}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                            entry.status === "Pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {entry.status || "Completed"}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleAddToTotal(entry)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border ${
                            entry.addToTotal
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500"
                          }`}
                        >
                          {entry.addToTotal ? "✓ ON" : "OFF"}
                        </button>
                      </td>

                      <td className="p-3.5 text-center pr-5 whitespace-nowrap">
                        {isDayClosed(entry.date) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-black">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Locked</span>
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View details */}
                            <button
                              onClick={() => setViewingEntry(entry)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                              title="View entry details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(entry)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 transition-all cursor-pointer"
                              title="Edit entry"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteConfirmEntry(entry)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 transition-all cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}

      {/* 1. Add / Edit Transaction Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleSubmitForm}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-2xl ${
                    formDirection === "income"
                      ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                      : "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingEntry ? "Edit Transaction Entry" : "+ Add Cash Book Transaction"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Record payment or receipt into daily cash book
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close (×)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Income vs Expense Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormDirection("income")}
                  className={`p-3 rounded-2xl font-black text-xs transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                    formDirection === "income"
                      ? "bg-blue-600 text-white border-blue-600 shadow-md scale-102"
                      : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Received / Income (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormDirection("expense")}
                  className={`p-3 rounded-2xl font-black text-xs transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                    formDirection === "expense"
                      ? "bg-rose-600 text-white border-rose-600 shadow-md scale-102"
                      : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Paid / Expense (-)</span>
                </button>
              </div>

              {/* Date & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Category Column
                  </label>
                  <select
                    value={formPaymentType}
                    onChange={(e) => setFormPaymentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {activeColumns.map((col) => (
                      <option key={col.id} value={col.name}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Party / Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Party / Customer / Vendor Name
                </label>
                <input
                  type="text"
                  value={formPartyName}
                  onChange={(e) => setFormPartyName(e.target.value)}
                  placeholder="e.g. Ramesh Traders, John Doe, ABC Corp"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              {/* Description & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description / Item *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g., Payment for Invoice #102"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Reference No & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ref / Cheque / Payment No.
                  </label>
                  <input
                    type="text"
                    value={formReferenceNo}
                    onChange={(e) => setFormReferenceNo(e.target.value)}
                    placeholder="e.g. UPI-987654 or CHQ-0012"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "Completed" | "Pending")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Remarks
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional internal remarks..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Include in Total Toggle */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAddToTotal}
                  onChange={(e) => setFormAddToTotal(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Include in Total Sum Calculations
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    When OFF, entry remains saved but is excluded from totals calculation
                  </span>
                </div>
              </label>

              {/* Live Daily Budget Warning Notice in Entry Form */}
              {formDirection === "expense" && formAddToTotal && isBudgetSet && (() => {
                const formAmtNum = parseFloat(formAmount) || 0;
                const projectedExpense = activeDatePaidTotal + formAmtNum - (editingEntry && editingEntry.direction === "expense" && editingEntry.date === formDate ? editingEntry.amount : 0);
                if (projectedExpense > dailyExpenseBudget) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs animate-fadeIn">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-extrabold text-rose-900 dark:text-rose-200">
                          ⚠️ Threshold Warning: Daily Expense Budget Exceeded
                        </p>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                          Saving this expense (₹{formatCurrency(formAmtNum)}) will bring total daily expenditure for <span className="font-bold">{formDate}</span> to{" "}
                          <span className="font-black underline">₹{formatCurrency(projectedExpense)}</span>, exceeding your configured limit threshold of{" "}
                          <span className="font-bold">₹{formatCurrency(dailyExpenseBudget)}</span> by ₹{formatCurrency(projectedExpense - dailyExpenseBudget)}.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingEntry ? "Update Entry" : "Save Entry"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Custom Column Management Modal */}
      <CustomColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        columns={cashColumns}
        onAddColumn={addCustomColumn}
        onUpdateColumn={updateCustomColumn}
        onDeleteColumn={deleteCustomColumn}
        onToggleEnabled={toggleColumnEnabled}
      />

      {/* 3. Custom PDF Modal */}
      <CustomPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        entries={filteredEntries}
        profile={profile}
        columns={activeColumns}
        defaultStartDate={startDate}
        defaultEndDate={endDate}
        defaultTitle={pdfModalTitle}
        closedDayInfo={activeClosedDayInfo}
      />

      {/* 4. Entry Details Modal */}
      <EntryDetailModal
        entry={viewingEntry}
        onClose={() => setViewingEntry(null)}
        onEdit={(e) => handleOpenEdit(e)}
        columnsConfig={cashColumns}
      />

      {/* 5. Delete Confirmation Modal */}
      {deleteConfirmEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Delete Entry Confirmation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Confirm entry removal from Daily Cash Book
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeleteConfirmEntry(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Close (×)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-2">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                “Are you sure you want to delete this entry?”
              </p>

              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 pt-2 border-t border-rose-200/50 dark:border-rose-800/30">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Description:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{deleteConfirmEntry.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Payment Category:</span>
                  <span className="font-bold">{deleteConfirmEntry.paymentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Amount:</span>
                  <span className={`font-black ${deleteConfirmEntry.direction === "income" ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {deleteConfirmEntry.direction === "income" ? "+" : "-"}₹{deleteConfirmEntry.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Date:</span>
                  <span className="font-mono">{deleteConfirmEntry.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmEntry(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteEntry}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Close Day Modal */}
      {isCloseDayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleConfirmCloseDay}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Close & Finalize Daily Cash Book
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Closing cash book for date: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{activeLockDate}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCloseDayModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close (×)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Opening Cash</span>
                  <input
                    type="number"
                    value={closeDayOpeningCash}
                    onChange={(e) => setCloseDayOpeningCash(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-extrabold text-sm"
                    placeholder="0"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                  <span className="text-blue-500 font-bold block text-[10px] uppercase">Total Received (+)</span>
                  <span className="text-base font-black text-blue-700 dark:text-blue-300 mt-1 block">
                    +₹{categoryTotalsMap.totalReceived.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50">
                  <span className="text-rose-500 font-bold block text-[10px] uppercase">Total Paid (-)</span>
                  <span className="text-base font-black text-rose-700 dark:text-rose-300 mt-1 block">
                    -₹{categoryTotalsMap.totalPaid.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50">
                  <span className="text-purple-600 font-bold block text-[10px] uppercase">Expected Cash</span>
                  <span className="text-base font-black text-purple-700 dark:text-purple-300 mt-1 block">
                    ₹{(closeDayOpeningCash + categoryTotalsMap.netTotal).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Actual Cash Input */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Actual Physical Cash Counted (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={closeDayActualCash}
                    onChange={(e) => setCloseDayActualCash(e.target.value)}
                    placeholder="Enter physical cash in drawer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-black text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Closing Remarks / Notes
                </label>
                <input
                  type="text"
                  value={closeDayNotes}
                  onChange={(e) => setCloseDayNotes(e.target.value)}
                  placeholder="e.g., Cash deposited in safe box"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCloseDayModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4" />
                <span>Finalize & Close Day</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. Reopen Day Confirmation Modal */}
      {isReopenConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 shrink-0">
                <Unlock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Reopen Cash Book
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Unlock transactions for editing & deletion
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReopenConfirmOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Close (×)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2">
              <p className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                Are you sure you want to reopen the Cash Book for {activeLockDate}?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsReopenConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReopenDay}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                <span>Confirm Reopen Day</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Settings & Preferences Modal (Daily Expense Budget & Audit Trail) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Daily Cash Book Settings
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Configure daily budget threshold alerts & view cash book activity logs
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close (×)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 px-5 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setSettingsTab("preferences")}
                className={`px-4 py-2.5 rounded-t-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                  settingsTab === "preferences"
                    ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border-purple-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent"
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Daily Expense Budget</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab("audit_log")}
                className={`px-4 py-2.5 rounded-t-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                  settingsTab === "audit_log"
                    ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border-purple-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent"
                }`}
              >
                <History className="w-4 h-4" />
                <span>Audit Logs & History</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {settingsTab === "preferences" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = parseFloat(tempBudgetInput);
                    if (isNaN(val) || val < 0) {
                      showToast("Please enter a valid budget amount (0 or higher)", "warning");
                      return;
                    }
                    setDailyExpenseBudget(val);
                    setIsSettingsModalOpen(false);
                  }}
                  className="space-y-5"
                >
                  <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-start gap-3">
                    <Target className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-purple-900 dark:text-purple-200 space-y-1">
                      <p className="font-extrabold">About Daily Expense Budget Configuration</p>
                      <p className="text-purple-700 dark:text-purple-300 font-medium leading-relaxed">
                        Setting a daily budget threshold triggers automatic visual warnings across your Daily Cash Book dashboard and transaction entry modal whenever daily expenditure crosses your chosen threshold amount. Set to 0 to disable.
                      </p>
                    </div>
                  </div>

                  {/* Budget Threshold Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Daily Expense Budget Threshold (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 font-extrabold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={tempBudgetInput}
                        onChange={(e) => setTempBudgetInput(e.target.value)}
                        placeholder="e.g., 5000 (0 to disable)"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Preset Quick Selectors */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Quick Preset Thresholds
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Disabled (0)", val: 0 },
                        { label: "₹2,000", val: 2000 },
                        { label: "₹5,000", val: 5000 },
                        { label: "₹10,000", val: 10000 },
                        { label: "₹25,000", val: 25000 },
                        { label: "₹50,000", val: 50000 },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setTempBudgetInput(preset.val.toString())}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                            parseFloat(tempBudgetInput) === preset.val
                              ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget Preview Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      <span>Threshold Status Preview</span>
                      <span className="text-slate-500">Active Date: {activeLockDate}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Today&apos;s Expense Paid
                        </span>
                        <span className="text-base font-black text-rose-600 dark:text-rose-400">
                          ₹{formatCurrency(activeDatePaidTotal)}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Configured Budget Limit
                        </span>
                        <span className="text-base font-black text-purple-600 dark:text-purple-400">
                          {parseFloat(tempBudgetInput) > 0 ? `₹${formatCurrency(parseFloat(tempBudgetInput) || 0)}` : "Disabled (Unlimited)"}
                        </span>
                      </div>
                    </div>

                    {parseFloat(tempBudgetInput) > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-600 dark:text-slate-400">Utilization</span>
                          <span
                            className={
                              activeDatePaidTotal > (parseFloat(tempBudgetInput) || 0)
                                ? "text-rose-600 font-black"
                                : "text-emerald-600 font-bold"
                            }
                          >
                            {Math.round((activeDatePaidTotal / (parseFloat(tempBudgetInput) || 1)) * 100)}% Used
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              activeDatePaidTotal > (parseFloat(tempBudgetInput) || 0)
                                ? "bg-rose-600"
                                : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((activeDatePaidTotal / (parseFloat(tempBudgetInput) || 1)) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Footer Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsSettingsModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Budget Settings</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Audit Log Tab */
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={auditSearchTerm}
                        onChange={(e) => setAuditSearchTerm(e.target.value)}
                        placeholder="Search audit trail logs..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <select
                      value={auditActionFilter}
                      onChange={(e) => setAuditActionFilter(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="ALL">All Actions</option>
                      <option value="CREATE">Create</option>
                      <option value="UPDATE">Update</option>
                      <option value="DELETE">Delete</option>
                    </select>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/80">
                    {auditLogs
                      .filter(
                        (log) =>
                          log.module.includes("Daily Cash") ||
                          log.module.includes("Cash")
                      )
                      .filter((log) => {
                        if (auditActionFilter !== "ALL" && log.action !== auditActionFilter) return false;
                        if (!auditSearchTerm.trim()) return true;
                        const term = auditSearchTerm.toLowerCase();
                        return (
                          log.details.toLowerCase().includes(term) ||
                          log.userName.toLowerCase().includes(term) ||
                          log.action.toLowerCase().includes(term)
                        );
                      }).length === 0 ? (
                      <p className="p-6 text-center text-xs text-slate-400 font-bold">
                        No audit log entries recorded yet.
                      </p>
                    ) : (
                      auditLogs
                        .filter(
                          (log) =>
                            log.module.includes("Daily Cash") ||
                            log.module.includes("Cash")
                        )
                        .filter((log) => {
                          if (auditActionFilter !== "ALL" && log.action !== auditActionFilter) return false;
                          if (!auditSearchTerm.trim()) return true;
                          const term = auditSearchTerm.toLowerCase();
                          return (
                            log.details.toLowerCase().includes(term) ||
                            log.userName.toLowerCase().includes(term) ||
                            log.action.toLowerCase().includes(term)
                          );
                        })
                        .map((log) => (
                          <div key={log.id} className="p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between text-slate-500 font-medium text-[10px]">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {log.userName}
                              </span>
                              <span>{new Date(log.timestamp).toLocaleString("en-IN")}</span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-black mr-1.5 uppercase ${
                                  log.action === "CREATE"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : log.action === "UPDATE"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                }`}
                              >
                                {log.action}
                              </span>
                              {log.details}
                            </p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
