import React, { useState } from "react";
import {
  Lock,
  Unlock,
  KeyRound,
  Fingerprint,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const SecurityLockScreen: React.FC = () => {
  const { isAppLocked, unlockApp, currentUser } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isAppLocked) return null;

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        verify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const verify = (code: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      const success = unlockApp(code);
      setIsVerifying(false);
      if (!success) {
        setError(true);
        setPin("");
      }
    }, 300);
  };

  const handleBiometricSimulation = () => {
    setIsVerifying(true);
    setTimeout(() => {
      unlockApp("1234");
      setIsVerifying(false);
    }, 400);
  };

  return (
    <div
      id="security-lock-screen"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fade-in"
    >
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        {/* User avatar & lock indicator */}
        <div className="relative inline-block">
          <img
            src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`}
            alt={currentUser.name}
            className="w-20 h-20 rounded-2xl mx-auto border-2 border-emerald-500/60 shadow-xl object-cover"
          />
          <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">{currentUser.name}</h2>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Session Locked • Enter Security PIN
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                pin.length > idx
                  ? "bg-emerald-400 scale-110 shadow-lg shadow-emerald-500/50"
                  : "bg-slate-800 border border-slate-700"
              } ${error ? "bg-rose-500 border-rose-400" : ""}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 flex items-center justify-center gap-1 animate-shake">
            <AlertCircle className="w-3.5 h-3.5" /> Incorrect PIN. (Default: 1234)
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto pt-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleDigitClick(num)}
              className="w-16 h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-lg font-bold text-white shadow-sm transition-all active:scale-95 flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          {/* Biometric Touch Button */}
          <button
            onClick={handleBiometricSimulation}
            className="w-16 h-16 rounded-2xl bg-slate-800/40 hover:bg-emerald-950/50 border border-slate-700/60 text-emerald-400 transition-all flex items-center justify-center"
            title="Biometric Tap"
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          {/* Zero button */}
          <button
            onClick={() => handleDigitClick("0")}
            className="w-16 h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-lg font-bold text-white shadow-sm transition-all active:scale-95 flex items-center justify-center"
          >
            0
          </button>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-400 transition-all flex items-center justify-center"
          >
            Delete
          </button>
        </div>

        {/* Fast 1-Click Unlock Aid */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={() => unlockApp("1234")}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> 1-Click Instant Unlock (Demo Default: 1234)
          </button>
        </div>
      </div>
    </div>
  );
};
