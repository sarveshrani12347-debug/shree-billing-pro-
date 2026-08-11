import React, { useState, useEffect } from "react";
import { GST_RATES } from "../utils/gstUtils";

interface GstRateSelectProps {
  value: number;
  onChange: (rate: number) => void;
  className?: string;
  size?: "sm" | "md";
}

export const GstRateSelect: React.FC<GstRateSelectProps> = ({
  value,
  onChange,
  className = "",
  size = "md",
}) => {
  const isStandardRate = GST_RATES.some((r) => r.value === value);
  const [isCustom, setIsCustom] = useState<boolean>(!isStandardRate && value !== undefined && value !== null);
  const [customValue, setCustomValue] = useState<string>(value !== undefined ? String(value) : "0");

  useEffect(() => {
    const isStd = GST_RATES.some((r) => r.value === value);
    if (!isStd) {
      setIsCustom(true);
      setCustomValue(String(value));
    } else {
      setIsCustom(false);
    }
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "custom") {
      setIsCustom(true);
      onChange(Number(customValue) || 0);
    } else {
      setIsCustom(false);
      onChange(Number(val));
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setCustomValue(rawVal);
    const num = parseFloat(rawVal);
    onChange(isNaN(num) ? 0 : num);
  };

  const paddingClass = size === "sm" ? "px-1.5 py-1 text-xs" : "px-2.5 py-1.5 text-xs";

  if (isCustom) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="relative flex-1">
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={customValue}
            onChange={handleCustomInputChange}
            placeholder="Custom %"
            className={`w-full ${paddingClass} rounded-lg bg-white dark:bg-slate-900 border border-amber-500 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500`}
            autoFocus
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600">
            %
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsCustom(false);
            onChange(18); // Default back to standard 18%
          }}
          className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline shrink-0 px-1"
          title="Switch to standard list"
        >
          List
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={handleSelectChange}
      className={`w-full ${paddingClass} rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {GST_RATES.map((rate) => (
        <option key={rate.value} value={rate.value}>
          {rate.label}
        </option>
      ))}
      <option value="custom">-- Custom GST % --</option>
    </select>
  );
};
