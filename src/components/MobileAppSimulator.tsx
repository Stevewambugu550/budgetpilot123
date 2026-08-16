import React, { useState } from "react";
import {
  Smartphone,
  Layers,
  Wallet,
  Receipt,
  PiggyBank,
  Plus,
  Shield,
  Camera,
  X,
  Sparkles,
  Wifi,
  Battery,
  RotateCw,
  Download,
  CheckCircle2,
  Sliders,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import { HouseholdData, Transaction } from "../types";
import { formatCurrency, calculateSummary } from "../utils/budgetUtils";
import { useAuth } from "../context/AuthContext";
import { CategoryIcon } from "./CategoryIcon";

interface MobileAppSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  data: HouseholdData;
  onUpdateData: (newData: HouseholdData) => void;
  onOpenQuickAdd: (type: any) => void;
}

export const MobileAppSimulator: React.FC<MobileAppSimulatorProps> = ({
  isOpen,
  onClose,
  data,
  onUpdateData,
  onOpenQuickAdd,
}) => {
  const { currentUser, formatMasked } = useAuth();
  const [deviceModel, setDeviceModel] = useState<"ios" | "android">("ios");
  const [mobileTab, setMobileTab] = useState<"home" | "envelopes" | "activity" | "vault">("home");
  const [isReceiptScanning, setIsReceiptScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showPwaInstallModal, setShowPwaInstallModal] = useState(false);

  if (!isOpen) return null;

  const summary = calculateSummary(data);
  const sym = data.currencySymbol;

  // Filter transactions for mobile view
  const recentTxs = data.transactions
    .filter((t) => t.date.startsWith(data.currentMonth))
    .slice(0, 5);

  const handleSimulateReceiptScan = () => {
    setIsReceiptScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsReceiptScanning(false);
      const randomReceiptAmount = +(Math.random() * 45 + 15).toFixed(2);
      const parsedItem: Transaction = {
        id: `tx-scan-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        amount: randomReceiptAmount,
        type: "expense",
        categoryId: data.categories[0]?.id || "cat-1",
        memberId: data.members[0]?.id || "mem-1",
        description: "AI Scanned: Trader Joe's Market",
        paymentMethod: "Card",
        notes: "Auto-extracted via Optical Receipt AI",
      };

      onUpdateData({
        ...data,
        transactions: [parsedItem, ...data.transactions],
      });
      setScanResult(`Scanned & Saved: Trader Joe's $${randomReceiptAmount}`);
    }, 1200);
  };

  return (
    <div
      id="mobile-app-simulator-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative flex flex-col items-center max-w-4xl w-full">
        {/* Controls Toolbar */}
        <div className="w-full max-w-md flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-3 text-xs text-white shadow-lg">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">Mobile Phone App Experience</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeviceModel(deviceModel === "ios" ? "android" : "ios")}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" />
              <span>{deviceModel === "ios" ? "iPhone 16 Pro" : "Pixel 9 Pro"}</span>
            </button>

            <button
              onClick={() => setShowPwaInstallModal(true)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold text-white transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Install App</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Realistic Mobile Device Frame */}
        <div
          className={`relative w-[340px] sm:w-[370px] h-[680px] sm:h-[720px] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl border-[6px] transition-all overflow-hidden ${
            deviceModel === "ios"
              ? "border-slate-800 shadow-emerald-500/10"
              : "border-slate-700 rounded-[40px]"
          }`}
        >
          {/* Hardware Camera Dynamic Island (iOS) or Punch-hole (Android) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            {deviceModel === "ios" ? (
              <div className="w-24 h-6 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md">
                <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            ) : (
              <div className="w-3.5 h-3.5 bg-black rounded-full border border-slate-800"></div>
            )}
          </div>

          {/* Internal Screen Content */}
          <div className="relative w-full h-full bg-slate-900 rounded-[38px] overflow-hidden flex flex-col justify-between text-slate-100 text-xs">
            {/* Status Bar */}
            <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[11px] text-slate-300 font-semibold z-20">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-slate-300" />
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Scrollable Mobile App Body */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 no-scrollbar">
              {/* Profile Bar in Mobile */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`}
                    alt="User"
                    className="w-8 h-8 rounded-xl object-cover border border-slate-700"
                  />
                  <div>
                    <div className="font-bold text-white leading-tight">{currentUser.name}</div>
                    <div className="text-[10px] text-emerald-400 capitalize">{currentUser.role} Account</div>
                  </div>
                </div>

                {/* AI Camera Scan Action */}
                <button
                  onClick={handleSimulateReceiptScan}
                  disabled={isReceiptScanning}
                  className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl transition-all flex items-center gap-1"
                  title="Scan Receipt with AI"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Scan</span>
                </button>
              </div>

              {scanResult && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px] flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{scanResult}</span>
                </div>
              )}

              {isReceiptScanning && (
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-center text-xs text-slate-300 space-y-1.5 animate-pulse">
                  <Camera className="w-6 h-6 text-emerald-400 mx-auto animate-bounce" />
                  <div className="font-semibold text-white">AI Analyzing Receipt Image...</div>
                  <div className="text-[10px] text-slate-400">Extracting merchant, total, and itemized VAT</div>
                </div>
              )}

              {/* TAB 1: MOBILE HOME VIEW */}
              {mobileTab === "home" && (
                <div className="space-y-3">
                  {/* Daily Safe-To-Spend Card */}
                  <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-4 shadow-lg text-white space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Daily Safe Pace</span>
                      <span className="text-emerald-400 font-bold">{summary.savingsRate}% Saved</span>
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-400">
                      {formatMasked(formatCurrency(summary.dailySafeToSpend, sym))}
                      <span className="text-xs text-slate-400 font-normal ml-1">/ day</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/60">
                      <span>Spent: {formatMasked(formatCurrency(summary.totalSpent, sym))}</span>
                      <span>Budget: {formatMasked(formatCurrency(summary.totalBudgeted, sym))}</span>
                    </div>
                  </div>

                  {/* 1-Tap Quick Action Dial */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onOpenQuickAdd("expense")}
                      className="p-3 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 rounded-xl font-bold text-center flex items-center justify-center gap-1.5"
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>- Log Spend</span>
                    </button>
                    <button
                      onClick={() => onOpenQuickAdd("savings_deposit")}
                      className="p-3 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 rounded-xl font-bold text-center flex items-center justify-center gap-1.5"
                    >
                      <PiggyBank className="w-3.5 h-3.5" />
                      <span>+ Quick Save</span>
                    </button>
                  </div>

                  {/* Recent Activity List */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                      <span>Recent Activity</span>
                      <button
                        onClick={() => setMobileTab("activity")}
                        className="text-emerald-400 text-[11px]"
                      >
                        See All
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {recentTxs.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-[10px]">
                              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div>
                              <div className="font-semibold text-white truncate max-w-[140px]">
                                {tx.description}
                              </div>
                              <div className="text-[10px] text-slate-400">{tx.date}</div>
                            </div>
                          </div>
                          <div
                            className={`font-bold text-xs ${
                              tx.type === "expense" ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {tx.type === "expense" ? "-" : "+"}
                            {formatMasked(formatCurrency(tx.amount, sym))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MOBILE ENVELOPES VIEW */}
              {mobileTab === "envelopes" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-white text-xs">Budget Envelopes</h3>
                  <div className="space-y-2">
                    {data.categories.map((cat) => {
                      const spent = data.transactions
                        .filter((tx) => tx.categoryId === cat.id && tx.date.startsWith(data.currentMonth))
                        .reduce((s, tx) => s + tx.amount, 0);
                      const pct = cat.allocatedAmount > 0 ? (spent / cat.allocatedAmount) * 100 : 0;

                      return (
                        <div
                          key={cat.id}
                          className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-bold text-white">{cat.name}</span>
                            </div>
                            <span className="font-bold text-slate-300">
                              {formatMasked(formatCurrency(spent, sym))} / {formatMasked(formatCurrency(cat.allocatedAmount, sym))}
                            </span>
                          </div>
                          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, pct)}%`,
                                backgroundColor: cat.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: MOBILE ACTIVITY VIEW */}
              {mobileTab === "activity" && (
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-xs">All Month Transactions</h3>
                  <div className="space-y-1.5">
                    {data.transactions
                      .filter((tx) => tx.date.startsWith(data.currentMonth))
                      .map((tx) => (
                        <div
                          key={tx.id}
                          className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-white">{tx.description}</div>
                            <div className="text-[10px] text-slate-400">{tx.date} • {tx.paymentMethod}</div>
                          </div>
                          <div
                            className={`font-bold ${
                              tx.type === "expense" ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {tx.type === "expense" ? "-" : "+"}
                            {formatMasked(formatCurrency(tx.amount, sym))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 4: MOBILE VAULT VIEW */}
              {mobileTab === "vault" && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl text-center space-y-2">
                    <Shield className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="font-bold text-white text-sm">Security Enclave Active</div>
                    <div className="text-[11px] text-slate-400">
                      AES-256 Client Vault • Role: {currentUser.role}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="p-2.5 bg-slate-800 rounded-xl flex justify-between">
                      <span className="text-slate-400">2FA Status</span>
                      <span className="text-emerald-400 font-bold">Enabled</span>
                    </div>
                    <div className="p-2.5 bg-slate-800 rounded-xl flex justify-between">
                      <span className="text-slate-400">Master Secret</span>
                      <span className="text-white font-mono">SEC-••••</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Navigation Bar with Floating (+) Button */}
            <div className="relative px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-around z-20">
              <button
                onClick={() => setMobileTab("home")}
                className={`flex flex-col items-center gap-0.5 ${
                  mobileTab === "home" ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-[9px] font-medium">Home</span>
              </button>

              <button
                onClick={() => setMobileTab("envelopes")}
                className={`flex flex-col items-center gap-0.5 ${
                  mobileTab === "envelopes" ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span className="text-[9px] font-medium">Envelopes</span>
              </button>

              {/* Floating Quick Action Dial Button */}
              <button
                onClick={() => onOpenQuickAdd("expense")}
                className="w-10 h-10 -mt-5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/30 active:scale-95"
              >
                <Plus className="w-5 h-5 text-slate-950" />
              </button>

              <button
                onClick={() => setMobileTab("activity")}
                className={`flex flex-col items-center gap-0.5 ${
                  mobileTab === "activity" ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span className="text-[9px] font-medium">Activity</span>
              </button>

              <button
                onClick={() => setMobileTab("vault")}
                className={`flex flex-col items-center gap-0.5 ${
                  mobileTab === "vault" ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-[9px] font-medium">Vault</span>
              </button>
            </div>
          </div>
        </div>

        {/* PWA Installation Instructions Modal */}
        {showPwaInstallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-xs text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Install App on Phone
                </div>
                <button
                  onClick={() => setShowPwaInstallModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-800 rounded-xl space-y-1">
                  <div className="font-bold text-white">📱 For Apple iOS (Safari):</div>
                  <p className="text-[11px] text-slate-400">
                    1. Tap the <strong>Share</strong> button (box with arrow) at bottom of screen.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    2. Scroll down and select <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl space-y-1">
                  <div className="font-bold text-white">🤖 For Android (Chrome):</div>
                  <p className="text-[11px] text-slate-400">
                    1. Tap the <strong>Three Dots menu (⋮)</strong> at top right.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    2. Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPwaInstallModal(false)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-center"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
