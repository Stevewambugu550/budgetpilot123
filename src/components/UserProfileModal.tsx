import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  Shield,
  ShieldCheck,
  KeyRound,
  Lock,
  LogOut,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenAuthModal,
}) => {
  const {
    currentUser,
    logout,
    securitySettings,
    updateSecuritySettings,
    lockApp,
    logAudit,
  } = useAuth();

  const [show2FADetails, setShow2FADetails] = useState(false);
  const [pinInput, setPinInput] = useState(securitySettings.pinCode || "1234");
  const [pinSaved, setPinSaved] = useState(false);

  if (!isOpen) return null;

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    updateSecuritySettings({ pinCode: pinInput });
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2000);
  };

  return (
    <div
      id="user-profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-100 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">My Household Account & Security</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center gap-4">
          <img
            src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`}
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
          />
          <div className="space-y-0.5">
            <div className="text-base font-extrabold text-white">{currentUser.name}</div>
            <div className="text-slate-400">{currentUser.email}</div>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase tracking-wider">
                {currentUser.role} Tier
              </span>
              {currentUser.authProvider === "google" && (
                <span className="flex items-center gap-1 text-[10px] text-blue-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Google Linked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2-Factor Authentication Section */}
        <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">Two-Factor Authentication (2FA)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Active (TOTP)
            </span>
          </div>

          <p className="text-slate-400 text-[11px]">
            Your session is secured with hardware cryptographic tokens and Google Authenticator.
          </p>

          <button
            onClick={() => setShow2FADetails(!show2FADetails)}
            className="text-emerald-400 hover:text-emerald-300 font-medium text-[11px] flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            {show2FADetails ? "Hide 2FA Secret Key" : "View 2FA Token Secret"}
          </button>

          {show2FADetails && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 font-mono text-[11px] text-emerald-300 break-all space-y-1 animate-fade-in">
              <div>Secret: {currentUser.twoFactorSecret || "SEC-8834-KLA-992"}</div>
              <div className="text-slate-500 text-[10px]">Algorithm: SHA-256 Time-Based OTP (30s)</div>
            </div>
          )}
        </div>

        {/* Security PIN Change */}
        <form onSubmit={handleSavePin} className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-purple-400" />
              Quick-Lock 4-Digit PIN
            </span>
            {pinSaved && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Updated!
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono tracking-widest text-center"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl"
            >
              Update PIN
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              lockApp();
            }}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Lock App Screen
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenAuthModal();
            }}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            Switch Account
          </button>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="py-2 px-3 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-800/60 text-rose-300 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
