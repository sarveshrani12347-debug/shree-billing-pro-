import React from "react";
import { Plus, Trash2, Truck } from "lucide-react";
import { AdditionalCharge } from "../types";
import { PRESET_CHARGE_NAMES, calculateAdditionalChargeTaxes, formatCurrency } from "../utils/gstUtils";
import { GstRateSelect } from "./GstRateSelect";

interface AdditionalChargesSectionProps {
  charges: AdditionalCharge[];
  onChange: (charges: AdditionalCharge[]) => void;
  isInterState: boolean;
}

export const AdditionalChargesSection: React.FC<AdditionalChargesSectionProps> = ({
  charges,
  onChange,
  isInterState,
}) => {
  const handleAddCharge = (presetName?: string) => {
    const newCharge: AdditionalCharge = {
      id: "chg-" + Date.now() + Math.random().toString().slice(2, 5),
      name: presetName || "Delivery Charges",
      amount: 0,
      isTaxable: true,
      taxRate: 18,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0,
    };
    onChange([...charges, newCharge]);
  };

  const handleUpdateCharge = (id: string, field: keyof AdditionalCharge, val: any) => {
    const updated = charges.map((c) => {
      if (c.id === id) {
        const item = { ...c, [field]: val };
        const taxes = calculateAdditionalChargeTaxes(
          item.amount,
          item.isTaxable,
          item.taxRate,
          isInterState
        );
        return {
          ...item,
          cgstAmount: taxes.cgstAmount,
          sgstAmount: taxes.sgstAmount,
          igstAmount: taxes.igstAmount,
          totalAmount: taxes.totalAmount,
        };
      }
      return c;
    });
    onChange(updated);
  };

  const handleDeleteCharge = (id: string) => {
    onChange(charges.filter((c) => c.id !== id));
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            Delivery / Transport & Additional Charges
          </h4>
        </div>

        {/* Quick Add Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_CHARGE_NAMES.slice(0, 4).map((pName) => (
            <button
              key={pName}
              type="button"
              onClick={() => handleAddCharge(pName)}
              className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold transition-all border border-purple-200 dark:border-purple-800 cursor-pointer"
            >
              + {pName.replace(" Charges", "")}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleAddCharge()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Charge</span>
          </button>
        </div>
      </div>

      {/* Charge Rows */}
      {charges.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic py-1 text-center">
          No delivery or transport charges added. Click "+ Add Charge" to add freight, packing, or delivery fees.
        </p>
      ) : (
        <div className="space-y-2">
          {charges.map((c) => {
            const taxes = calculateAdditionalChargeTaxes(
              c.amount,
              c.isTaxable,
              c.taxRate,
              isInterState
            );

            return (
              <div
                key={c.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs shadow-sm"
              >
                {/* Charge Name / Select */}
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5 sm:hidden">
                    Charge Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list={`preset-charges-${c.id}`}
                      value={c.name}
                      onChange={(e) => handleUpdateCharge(c.id, "name", e.target.value)}
                      placeholder="e.g. Delivery Charges, Freight"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <datalist id={`preset-charges-${c.id}`}>
                      {PRESET_CHARGE_NAMES.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Amount */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5 sm:hidden">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={c.amount || ""}
                    onChange={(e) =>
                      handleUpdateCharge(c.id, "amount", parseFloat(e.target.value) || 0)
                    }
                    placeholder="Amount"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-right font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Taxable Toggle */}
                <div className="sm:col-span-2 flex items-center justify-start sm:justify-center">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={c.isTaxable}
                      onChange={(e) =>
                        handleUpdateCharge(c.id, "isTaxable", e.target.checked)
                      }
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                    />
                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                      {c.isTaxable ? "Taxable (+GST)" : "Non-Taxable"}
                    </span>
                  </label>
                </div>

                {/* GST Rate Select */}
                <div className="sm:col-span-2">
                  {c.isTaxable ? (
                    <GstRateSelect
                      value={c.taxRate}
                      onChange={(rate) => handleUpdateCharge(c.id, "taxRate", rate)}
                      size="sm"
                    />
                  ) : (
                    <div className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-400 font-semibold text-center">
                      0% (No Tax)
                    </div>
                  )}
                </div>

                {/* Total & Delete */}
                <div className="sm:col-span-2 flex items-center justify-between gap-2 pl-1">
                  <div className="text-right">
                    <p className="font-mono font-extrabold text-slate-900 dark:text-white text-xs">
                      {formatCurrency(taxes.totalAmount)}
                    </p>
                    {c.isTaxable && taxes.totalTax > 0 && (
                      <p className="text-[9px] text-purple-600 dark:text-purple-400 font-semibold">
                        (GST: {formatCurrency(taxes.totalTax)})
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCharge(c.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-all cursor-pointer"
                    title="Remove Charge"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
