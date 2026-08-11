import React, { useState, useRef, useEffect } from "react";
import { Plus, Minus, AlertTriangle, Check, X } from "lucide-react";
import { Product } from "../types";

interface FastStockStepperProps {
  product: Product;
  adjustStock: (productId: string, qtyChange: number, type: "in" | "out", reason?: string) => void;
  updateProduct: (product: Product) => void;
  allowNegativeStock: boolean;
}

export const FastStockStepper: React.FC<FastStockStepperProps> = ({
  product,
  adjustStock,
  updateProduct,
  allowNegativeStock,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(product.stockQuantity.toString());

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepCountRef = useRef<number>(0);

  // Sync input value when product stock changes externally
  useEffect(() => {
    if (!isEditing) {
      setInputValue(product.stockQuantity.toString());
    }
  }, [product.stockQuantity, isEditing]);

  const stopRepeat = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stepCountRef.current = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopRepeat();
  }, []);

  const handleStep = (type: "in" | "out") => {
    if (type === "out" && !allowNegativeStock && product.stockQuantity <= 0) {
      stopRepeat();
      return;
    }
    const stepReason = stepCountRef.current > 1 ? `Fast-Increment (${type.toUpperCase()})` : `Quick ${type.toUpperCase()}`;
    adjustStock(product.id, 1, type, stepReason);
    stepCountRef.current += 1;
  };

  const startPress = (type: "in" | "out") => {
    stopRepeat();
    handleStep(type);

    // After 300ms initial press, start rapid repetition every 70ms
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        handleStep(type);
      }, 70);
    }, 300);
  };

  const handleSaveManual = () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed)) {
      setIsEditing(false);
      setInputValue(product.stockQuantity.toString());
      return;
    }

    let targetQty = parsed;
    if (!allowNegativeStock && targetQty < 0) {
      targetQty = 0;
    }

    if (targetQty !== product.stockQuantity) {
      const diff = targetQty - product.stockQuantity;
      if (diff > 0) {
        adjustStock(product.id, diff, "in", "Manual Count Overwrite");
      } else {
        adjustStock(product.id, Math.abs(diff), "out", "Manual Count Overwrite");
      }
    }
    setIsEditing(false);
  };

  const isLowStock = product.stockQuantity <= product.reorderLevel;

  return (
    <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 shadow-inner">
      {/* Decrement (-) Button */}
      <button
        type="button"
        onMouseDown={() => startPress("out")}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchStart={(e) => {
          e.preventDefault();
          startPress("out");
        }}
        onTouchEnd={stopRepeat}
        onTouchCancel={stopRepeat}
        disabled={!allowNegativeStock && product.stockQuantity <= 0}
        className={`p-1.5 rounded-lg font-bold transition-all active:scale-90 select-none cursor-pointer ${
          !allowNegativeStock && product.stockQuantity <= 0
            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50"
            : "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-200 dark:border-slate-700 shadow-sm"
        }`}
        title="Decrease 1 (Hold for fast auto-count)"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* Stock Quantity Display or Manual Input */}
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveManual();
              if (e.key === "Escape") {
                setIsEditing(false);
                setInputValue(product.stockQuantity.toString());
              }
            }}
            className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-center rounded bg-white dark:bg-slate-800 border border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSaveManual}
            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
            title="Confirm Quantity"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setInputValue(product.stockQuantity.toString());
            }}
            className="p-1 rounded bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-400 cursor-pointer"
            title="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => {
            setIsEditing(true);
            setInputValue(product.stockQuantity.toString());
          }}
          className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-all select-none ${
            isLowStock
              ? "bg-amber-100 text-amber-900 dark:bg-amber-950/90 dark:text-amber-300 font-extrabold animate-pulse"
              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700"
          }`}
          title="Click to type exact quantity • Hold +/- for fast counting"
        >
          <span className="font-mono font-extrabold text-xs">
            {product.stockQuantity}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">
            {product.unit}
          </span>
          {isLowStock && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Below Reorder Threshold!" />
          )}
        </div>
      )}

      {/* Increment (+) Button */}
      <button
        type="button"
        onMouseDown={() => startPress("in")}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchStart={(e) => {
          e.preventDefault();
          startPress("in");
        }}
        onTouchEnd={stopRepeat}
        onTouchCancel={stopRepeat}
        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 font-bold transition-all active:scale-90 shadow-sm select-none cursor-pointer"
        title="Increase 1 (Hold for fast auto-count)"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
