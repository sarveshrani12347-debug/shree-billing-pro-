import React, { useState } from "react";
import { X, Plus, Edit2, Trash2, Check, Sliders, AlertTriangle } from "lucide-react";
import { CustomCashColumn } from "../../types";

interface CustomColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: CustomCashColumn[];
  onAddColumn: (col: Omit<CustomCashColumn, "id" | "isDefault" | "enabled">) => boolean;
  onUpdateColumn: (col: CustomCashColumn) => void;
  onDeleteColumn: (id: string) => void;
  onToggleEnabled: (id: string) => void;
}

const PRESET_COLORS = [
  { name: "Blue", color: "#2563eb", bgLightHex: "#eff6ff", textColorHex: "#1e40af" },
  { name: "Emerald", color: "#059669", bgLightHex: "#ecfdf5", textColorHex: "#065f46" },
  { name: "Purple", color: "#7c3aed", bgLightHex: "#faf5ff", textColorHex: "#6b21a8" },
  { name: "Amber", color: "#d97706", bgLightHex: "#fffbeb", textColorHex: "#92400e" },
  { name: "Rose", color: "#e11d48", bgLightHex: "#fff1f2", textColorHex: "#9f1239" },
  { name: "Sky", color: "#0284c7", bgLightHex: "#f0f9ff", textColorHex: "#075985" },
  { name: "Teal", color: "#0d9488", bgLightHex: "#f0fdfa", textColorHex: "#115e59" },
  { name: "Indigo", color: "#4f46e5", bgLightHex: "#eef2ff", textColorHex: "#3730a3" },
  { name: "Violet", color: "#9333ea", bgLightHex: "#faf5ff", textColorHex: "#581c87" },
  { name: "Coral", color: "#f97316", bgLightHex: "#fff7ed", textColorHex: "#9a3412" },
];

export const CustomColumnModal: React.FC<CustomColumnModalProps> = ({
  isOpen,
  onClose,
  columns,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onToggleEnabled,
}) => {
  const [editingCol, setEditingCol] = useState<CustomCashColumn | null>(null);
  const [deleteConfirmCol, setDeleteConfirmCol] = useState<CustomCashColumn | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(PRESET_COLORS[0]);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingCol(null);
    setName("");
    setSelectedPreset(PRESET_COLORS[0]);
  };

  const handleStartEdit = (col: CustomCashColumn) => {
    setEditingCol(col);
    setName(col.name);
    const matched = PRESET_COLORS.find((p) => p.color === col.color) || {
      name: "Custom",
      color: col.color,
      bgLightHex: col.bgLightHex,
      textColorHex: col.textColorHex,
    };
    setSelectedPreset(matched);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCol) {
      onUpdateColumn({
        ...editingCol,
        name: name.trim(),
        color: selectedPreset.color,
        bgLightHex: selectedPreset.bgLightHex,
        textColorHex: selectedPreset.textColorHex,
      });
      setEditingCol(null);
    } else {
      const success = onAddColumn({
        name: name.trim(),
        color: selectedPreset.color,
        bgLightHex: selectedPreset.bgLightHex,
        textColorHex: selectedPreset.textColorHex,
      });
      if (success) {
        setName("");
      }
    }
  };

  const handleDeleteConfirmed = () => {
    if (deleteConfirmCol) {
      onDeleteColumn(deleteConfirmCol.id);
      setDeleteConfirmCol(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Cash Book Columns Management
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Customize up to 7 columns with colors ({columns.length}/7 used)
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

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Form to Add or Edit Column */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {editingCol ? `Edit Column: ${editingCol.name}` : "+ Add Custom Column"}
              </span>
              {editingCol && (
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Column Name
              </label>
              <input
                type="text"
                required
                maxLength={25}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Salary, Rent, Transport, Electricity, Bank"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Column Color Theme
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => {
                  const isSelected = selectedPreset.color === preset.color;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedPreset(preset)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isSelected
                          ? "ring-2 ring-purple-600 ring-offset-1 scale-105"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: preset.bgLightHex,
                        borderColor: preset.color,
                        color: preset.textColorHex,
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
                      <span>{preset.name}</span>
                      {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-1 flex items-center justify-end">
              <button
                type="submit"
                disabled={!name.trim() || (!editingCol && columns.length >= 7)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold text-white transition-all cursor-pointer shadow-md ${
                  !name.trim() || (!editingCol && columns.length >= 7)
                    ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {editingCol ? "Save Changes" : "+ Add Column"}
              </button>
            </div>
          </form>

          {/* Existing Columns List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Active Columns ({columns.length}/7)
            </h4>

            <div className="space-y-2">
              {columns.map((col) => (
                <div
                  key={col.id}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-3 py-1 rounded-xl text-xs font-black border"
                      style={{
                        backgroundColor: col.bgLightHex,
                        color: col.textColorHex,
                        borderColor: col.color,
                      }}
                    >
                      {col.name}
                    </span>
                    {col.isDefault && (
                      <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-md uppercase">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Enable / Disable Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleEnabled(col.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        col.enabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {col.enabled ? "Enabled ✓" : "Disabled"}
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(col)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all cursor-pointer"
                      title="Edit column name & color"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button (only for custom non-default columns) */}
                    {!col.isDefault && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmCol(col)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                        title="Delete custom column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete Column Confirmation Sub-modal */}
      {deleteConfirmCol && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Delete Column Confirmation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Deleting column: <span className="font-bold text-slate-900 dark:text-white">{deleteConfirmCol.name}</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <p className="font-extrabold">Data Safety Guarantee:</p>
              <p>
                Deleting this column will <strong>NOT</strong> delete any historical transaction records. All existing transactions associated with &quot;{deleteConfirmCol.name}&quot; will remain safely stored and visible in reports.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCol(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete Column</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
