import React, { useState } from "react";
import { Lock, ShieldCheck, KeyRound, Check } from "lucide-react";
import { useApp } from "../context/AppContext";

export const AppLockModal: React.FC = () => {
  const { appLock, unlockApp } = useApp();
  const [enteredPin, setEnteredPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!appLock.enabled || !appLock.isLocked) {
    return null;
  }

  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      setErrorMsg("");

      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = unlockApp(nextPin);
          if (!success) {
            setErrorMsg("Incorrect PIN. Please try again.");
            setEnteredPin("");
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Shree Shop Security</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter 4-Digit Security PIN to access shop records
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-3 my-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                enteredPin.length > idx
                  ? "bg-indigo-500 border-indigo-400 scale-110"
                  : "border-slate-700 bg-slate-800"
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs font-bold text-rose-400 animate-bounce">{errorMsg}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-lg font-bold transition-all border border-slate-700/60 flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setEnteredPin("")}
            className="h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-xs font-bold text-slate-400 flex items-center justify-center"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress("0")}
            className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-lg font-bold transition-all border border-slate-700/60 flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-xs font-bold text-slate-400 flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          Default Demo PIN: <span className="font-mono text-slate-300">1234</span>
        </p>
      </div>
    </div>
  );
};
