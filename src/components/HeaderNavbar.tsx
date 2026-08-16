import React, { useState } from "react";
import {
  Wallet,
  PlusCircle,
  PiggyBank,
  TrendingDown,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Users,
  Calendar,
  Layers,
  Receipt,
  Clock,
  Calculator,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  Bell,
  BarChart3,
  User,
  ChevronDown,
  LogIn,
} from "lucide-react";
import { HouseholdData, HouseholdMember } from "../types";
import { exportToCSV, exportBackupJSON } from "../utils/budgetUtils";
import { useAuth } from "../context/AuthContext";

export type NavTabType =
  | "overview"
  | "visuals"
  | "categories"
  | "transactions"
  | "bills"
  | "goals"
  | "simulator"
  | "members"
  | "advisor"
  | "admin";

interface HeaderNavbarProps {
  data: HouseholdData;
  onUpdateData: (newData: HouseholdData) => void;
  selectedMemberId: string | "all";
  onSelectMemberId: (id: string | "all") => void;
  activeTab: NavTabType;
  onSelectTab: (tab: NavTabType) => void;
  onOpenQuickAdd: (type: "expense" | "income" | "savings_deposit" | "bill" | "goal") => void;
  onResetData: () => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  onOpenMobileSimulator: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  data,
  onUpdateData,
  selectedMemberId,
  onSelectMemberId,
  activeTab,
  onSelectTab,
  onOpenQuickAdd,
  onResetData,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenMobileSimulator,
}) => {
  const {
    currentUser,
    privacyMaskEnabled,
    togglePrivacyMask,
    lockApp,
    notifications,
    markNotificationRead,
    hasPermission,
  } = useAuth();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Month navigation
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateData({
      ...data,
      currentMonth: e.target.value,
    });
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.categories)) {
          onUpdateData(parsed);
          setShowExportMenu(false);
          alert("Household budget data imported successfully!");
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onSelectTab("overview")}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Wallet className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  onClick={() => onSelectTab("overview")}
                  className="font-bold text-lg tracking-tight text-white flex items-center gap-1 cursor-pointer"
                >
                  Budget<span className="text-emerald-400">Pilot</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <ShieldCheck className="w-3 h-3 mr-1" /> 256-Bit Vault
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Secure Multi-User Financial Management
              </p>
            </div>
          </div>

          {/* Center/Right Controls: Month, Privacy, Mobile, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Month Picker */}
            <div className="hidden sm:flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              <input
                id="month-selector-input"
                type="month"
                value={data.currentMonth}
                onChange={handleMonthChange}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
              />
            </div>

            {/* Member Filter */}
            <div className="hidden xl:flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs">
              <Users className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              <select
                id="member-filter-select"
                value={selectedMemberId}
                onChange={(e) => onSelectMemberId(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-slate-800 text-white">All Household</option>
                {data.members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-800 text-white">
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Privacy Mask Toggle (Eye Cloak) */}
            <button
              id="privacy-mask-toggle-btn"
              onClick={togglePrivacyMask}
              className={`p-2 rounded-xl border transition-all ${
                privacyMaskEnabled
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700 hover:bg-slate-800"
              }`}
              title={privacyMaskEnabled ? "Privacy Cloak Active (Amounts Masked)" : "Toggle Privacy Cloak (Public Shield)"}
            >
              {privacyMaskEnabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Screen Lock Button */}
            <button
              id="lock-screen-btn"
              onClick={lockApp}
              className="p-2 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-700 rounded-xl transition-all"
              title="Lock Screen Session"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Mobile App Simulator Launcher */}
            <button
              id="open-mobile-app-btn"
              onClick={onOpenMobileSimulator}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600/30 to-emerald-600/30 hover:from-teal-600/40 hover:to-emerald-600/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Open Mobile Phone App Experience & Receipt Scanner"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Mobile App</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                id="notifications-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-white text-xs">Security & Bill Alerts</span>
                    <span className="text-[10px] text-slate-400">{notifications.length} alerts</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                            n.read
                              ? "bg-slate-800/40 border-slate-800 text-slate-400"
                              : "bg-slate-800 border-slate-700 text-slate-200"
                          }`}
                        >
                          <div className="font-bold text-white text-xs">{n.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{n.message}</div>
                          <div className="text-[9px] text-slate-500 mt-1">{n.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sign In / Switch Account Quick Button */}
            <button
              id="header-direct-signin-btn"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold transition-all active:scale-95"
              title="Sign In with Google or Email / Switch User"
            >
              <LogIn className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Sign In / Switch</span>
            </button>

            {/* User Account Profile Pill */}
            <div className="flex items-center gap-1.5">
              <button
                id="user-profile-menu-btn"
                onClick={onOpenProfileModal}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
              >
                <img
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-lg object-cover border border-slate-600"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[100px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Data & Backup Dropdown */}
              <div className="relative">
                <button
                  id="data-backup-menu-btn"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
                  title="Data & Backup"
                >
                  <Download className="w-4 h-4" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-2 z-50 text-xs">
                    <div className="px-2 py-1 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                      Data Management
                    </div>
                    <button
                      id="export-csv-btn"
                      onClick={() => {
                        exportToCSV(data.transactions, data);
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-2 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      Export Transactions (CSV)
                    </button>
                    <button
                      id="export-backup-json-btn"
                      onClick={() => {
                        exportBackupJSON(data);
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-2 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      Backup Full Budget (JSON)
                    </button>
                    <label className="w-full text-left px-2.5 py-2 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      Import Backup (JSON)
                      <input
                        id="import-json-file-input"
                        type="file"
                        accept=".json"
                        onChange={handleImportJSON}
                        className="hidden"
                      />
                    </label>
                    <div className="border-t border-slate-800 my-1"></div>
                    <button
                      id="reset-sample-data-btn"
                      onClick={() => {
                        if (confirm("Reset data to default sample household template?")) {
                          onResetData();
                          setShowExportMenu(false);
                        }
                      }}
                      className="w-full text-left px-2.5 py-2 text-rose-400 hover:bg-rose-950/40 rounded-lg flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      Reset to Sample Data
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/80 text-xs font-medium">
          <button
            id="tab-overview"
            onClick={() => onSelectTab("overview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "overview"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Overview
          </button>

          <button
            id="tab-visuals"
            onClick={() => onSelectTab("visuals")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "visuals"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            Visuals & Cash Waves
          </button>

          <button
            id="tab-categories"
            onClick={() => onSelectTab("categories")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "categories"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Envelopes
          </button>

          <button
            id="tab-transactions"
            onClick={() => onSelectTab("transactions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "transactions"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Transactions ({data.transactions.filter((t) => t.date.startsWith(data.currentMonth)).length})
          </button>

          <button
            id="tab-bills"
            onClick={() => onSelectTab("bills")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "bills"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Recurring Bills ({data.bills.length})
          </button>

          <button
            id="tab-goals"
            onClick={() => onSelectTab("goals")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "goals"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            Savings Goals ({data.goals.length})
          </button>

          <button
            id="tab-simulator"
            onClick={() => onSelectTab("simulator")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "simulator"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Growth Simulator
          </button>

          <button
            id="tab-members"
            onClick={() => onSelectTab("members")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "members"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Fair Share
          </button>

          <button
            id="tab-advisor"
            onClick={() => onSelectTab("advisor")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === "advisor"
                ? "bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-400/40"
                : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            AI Advisor
          </button>

          {/* ADMIN & SECURITY TAB */}
          <button
            id="tab-admin"
            onClick={() => onSelectTab("admin")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-all shadow-sm ${
              activeTab === "admin"
                ? "bg-purple-600 text-white shadow-purple-600/30 ring-2 ring-purple-400"
                : "bg-purple-950/60 text-purple-300 border border-purple-800/80 hover:bg-purple-900/60 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            Admin & Security Panel
          </button>
        </div>
      </div>
    </header>
  );
};

