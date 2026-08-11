import React, { useState } from "react";
import { X, Plus, Trash2, ArrowRightLeft, Scale } from "lucide-react";
import { useApp } from "../context/AppContext";

interface SmartUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_UNITS = [
  "PCS", "BAG", "MTR", "KG", "GM", "LTR", "ML", 
  "BOX", "PKT", "ROLL", "NOS", "SET", "DOZEN", "FT", "INCH"
];

export const SmartUnitModal: React.FC<SmartUnitModalProps> = ({ isOpen, onClose }) => {
  const { unitConversions, addUnitConversion, deleteUnitConversion } = useApp();

  const [fromUnit, setFromUnit] = useState<string>("BAG");
  const [toUnit, setToUnit] = useState<string>("PCS");
  const [multiplier, setMultiplier] = useState<number>(50);
  const [customFromUnit, setCustomFromUnit] = useState<string>("");

  // Converter state
  const [calcQty, setCalcQty] = useState<number>(1);
  const [calcRuleId, setCalcRuleId] = useState<string>("");

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFrom = fromUnit === "CUSTOM" ? customFromUnit.trim().toUpperCase() : fromUnit;
    if (!finalFrom || !toUnit || multiplier <= 0) return;

    addUnitConversion({
      fromUnit: finalFrom,
      toUnit,
      multiplier,
    });

    setCustomFromUnit("");
  };

  const selectedRule = unitConversions.find((c) => c.id === calcRuleId) || unitConversions[0];
  const convertedValue = selectedRule ? calcQty * selectedRule.multiplier : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Smart Unit System & Conversions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage stock units (BAG, BOX, ROLL, PCS, MTR, etc.) and conversion ratios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Supported Standard Units */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Supported Standard Units
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_UNITS.map((unit) => (
                <span
                  key={unit}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {unit}
                </span>
              ))}
            </div>
          </div>

          {/* Add New Unit Conversion */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" />
              Add Custom Unit Conversion Rule
            </h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  From Bulk Unit
                </label>
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {DEFAULT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Custom Unit</option>
                </select>
                {fromUnit === "CUSTOM" && (
                  <input
                    type="text"
                    placeholder="e.g. CARTON"
                    value={customFromUnit}
                    onChange={(e) => setCustomFromUnit(e.target.value)}
                    className="mt-1.5 w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  1 Bulk Unit Equals
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  placeholder="e.g. 50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Base Unit
                </label>
                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {DEFAULT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Rule
                </button>
              </div>
            </form>
          </div>

          {/* Active Unit Conversion Rules List */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Configured Conversion Rules
            </h3>
            {unitConversions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No conversion rules defined yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {unitConversions.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold">
                        1 {rule.fromUnit}
                      </span>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 font-bold">
                        {rule.multiplier} {rule.toUnit}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteUnitConversion(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Calculator */}
          {unitConversions.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200 dark:border-blue-900/50">
              <h3 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">
                Quick Unit Calculator
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  value={calcQty}
                  onChange={(e) => setCalcQty(parseFloat(e.target.value) || 0)}
                  className="w-20 text-sm p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-center"
                />
                <select
                  value={calcRuleId}
                  onChange={(e) => setCalcRuleId(e.target.value)}
                  className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {unitConversions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fromUnit} → {r.toUnit} (×{r.multiplier})
                    </option>
                  ))}
                </select>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  = {convertedValue} {selectedRule?.toUnit}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
