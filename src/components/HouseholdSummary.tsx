import React from "react";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
} from "lucide-react";
import { HouseholdData } from "../types";
import { formatCurrency, calculateSummary } from "../utils/budgetUtils";
import { CategoryIcon } from "./CategoryIcon";

interface HouseholdSummaryProps {
  data: HouseholdData;
  onSelectTab: (tab: any) => void;
  onOpenQuickAdd: (type: any) => void;
}

export const HouseholdSummary: React.FC<HouseholdSummaryProps> = ({
  data,
  onSelectTab,
  onOpenQuickAdd,
}) => {
  const summary = calculateSummary(data);
  const sym = data.currencySymbol;

  // 50-30-20 rule targets based on total income
  const idealNeeds = summary.totalIncome * 0.5;
  const idealWants = summary.totalIncome * 0.3;
  const idealSavings = summary.totalIncome * 0.2;

  const needsPercent = summary.totalIncome > 0 ? Math.round((summary.needsSpent / summary.totalIncome) * 100) : 0;
  const wantsPercent = summary.totalIncome > 0 ? Math.round((summary.wantsSpent / summary.totalIncome) * 100) : 0;
  const savingsPercent = summary.totalIncome > 0 ? Math.round((summary.savingsDebtSpent / summary.totalIncome) * 100) : 0;

  // Identify categories exceeding budget or near limit (>85%)
  const highSpendCategories = data.categories
    .map((cat) => {
      const spent = data.transactions
        .filter((tx) => tx.categoryId === cat.id && tx.date.startsWith(data.currentMonth))
        .reduce((sum, tx) => sum + tx.amount, 0);
      const ratio = cat.allocatedAmount > 0 ? (spent / cat.allocatedAmount) * 100 : 0;
      return { ...cat, spent, ratio };
    })
    .filter((cat) => cat.ratio >= 80)
    .sort((a, b) => b.ratio - a.ratio);

  // Upcoming unpaid bills
  const unpaidBills = data.bills.filter((b) => !b.isPaidThisMonth);
  const totalUnpaidBillsAmount = unpaidBills.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner with Safe-To-Spend Daily Pace & Savings Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Safe-To-Spend Allowance Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Wallet className="w-32 h-32 text-emerald-400" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Zap className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
                Daily Safe-To-Spend Pace
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{summary.daysRemaining} days left in {data.currentMonth}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Daily Allowance</p>
              <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                {formatCurrency(summary.dailySafeToSpend, sym)}
                <span className="text-xs text-slate-400 font-normal ml-1">/ day</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Based on {formatCurrency(summary.remainingBudget, sym)} remaining budget
              </p>
            </div>

            <div className="border-l-0 sm:border-l border-slate-700/60 sm:pl-4">
              <p className="text-xs text-slate-400 mb-0.5">Monthly Burn Rate</p>
              <div className="text-xl font-bold text-white">
                {summary.totalBudgeted > 0
                  ? Math.round((summary.totalSpent / summary.totalBudgeted) * 100)
                  : 0}
                %
                <span className="text-xs text-slate-400 font-normal ml-1.5">budget used</span>
              </div>
              <div className="w-full bg-slate-700/60 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    summary.totalSpent > summary.totalBudgeted
                      ? "bg-rose-500"
                      : (summary.totalSpent / summary.totalBudgeted) > 0.8
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      summary.totalBudgeted > 0 ? (summary.totalSpent / summary.totalBudgeted) * 100 : 0
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="border-l-0 sm:border-l border-slate-700/60 sm:pl-4">
              <p className="text-xs text-slate-400 mb-0.5">Unpaid Bills Queued</p>
              <div className="text-xl font-bold text-amber-300">
                {formatCurrency(totalUnpaidBillsAmount, sym)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {unpaidBills.length} recurring bill{unpaidBills.length === 1 ? "" : "s"} due this month
              </p>
            </div>
          </div>
        </div>

        {/* Savings Rate & Milestones Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <PiggyBank className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-semibold text-slate-200">Household Savings Rate</h3>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  summary.savingsRate >= 20
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                    : summary.savingsRate >= 10
                    ? "bg-teal-950 text-teal-300 border border-teal-700"
                    : "bg-amber-950 text-amber-300 border border-amber-700"
                }`}
              >
                {summary.savingsRate >= 20 ? "🌟 Golden Tier" : summary.savingsRate >= 10 ? "👍 Healthy" : "⚠️ Step it up"}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-teal-400">{summary.savingsRate}%</span>
              <span className="text-xs text-slate-400">of net household income</span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Total saved this month: <strong className="text-white">{formatCurrency(summary.totalSaved, sym)}</strong>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              id="view-goals-link"
              onClick={() => onSelectTab("goals")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
            >
              View {data.goals.length} Savings Goals <ArrowRight className="w-3 h-3" />
            </button>
            <button
              id="quick-save-summary-btn"
              onClick={() => onOpenQuickAdd("savings_deposit")}
              className="text-xs px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors"
            >
              + Deposit
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Financial Pillar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Income */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Household Income</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(summary.totalIncome, sym)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {data.incomes.length} regular stream{data.incomes.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* Total Budgeted */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Allocated Budget</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(summary.totalBudgeted, sym)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Zero-based status:</span>
            <span className={summary.totalIncome >= summary.totalBudgeted ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
              {summary.totalIncome >= summary.totalBudgeted
                ? `${formatCurrency(summary.totalIncome - summary.totalBudgeted, sym)} unallocated`
                : `${formatCurrency(summary.totalBudgeted - summary.totalIncome, sym)} over-allocated`}
            </span>
          </div>
        </div>

        {/* Total Expenses Spent */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Actual Spent (Expenses)</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400">
            {formatCurrency(summary.totalSpent, sym)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.monthTransactions.filter(t => t.type === 'expense').length} expense entries
          </p>
        </div>

        {/* Net Monthly Cash Flow */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Net Free Cash Flow</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${summary.netCashRemaining >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {formatCurrency(summary.netCashRemaining, sym)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.netCashRemaining >= 0 ? "Available for savings or debt" : "Deficit - spending exceeds income"}
          </p>
        </div>
      </div>

      {/* 50-30-20 Smart Health Meter & Category Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 50 / 30 / 20 Framework Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-base">50-30-20 Household Health Meter</h3>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                Gold Standard
              </span>
            </div>
            <button
              onClick={() => onSelectTab("categories")}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              Manage Envelopes <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            The 50/30/20 rule balances essential living needs (50%), lifestyle wants (30%), and future savings/debt payoff (20%).
          </p>

          {/* Three Segmented Bars */}
          <div className="space-y-4">
            {/* Needs (50%) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Needs (Housing, Groceries, Utilities, Health, Gas)
                </span>
                <div className="text-right">
                  <span className="font-bold text-white">{formatCurrency(summary.needsSpent, sym)}</span>
                  <span className="text-slate-400 ml-1">({needsPercent}% of income vs 50% target)</span>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    needsPercent > 55 ? "bg-amber-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(100, needsPercent)}%` }}
                />
              </div>
            </div>

            {/* Wants (30%) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  Wants (Dining, Entertainment, Streaming, Hobbies)
                </span>
                <div className="text-right">
                  <span className="font-bold text-white">{formatCurrency(summary.wantsSpent, sym)}</span>
                  <span className="text-slate-400 ml-1">({wantsPercent}% of income vs 30% target)</span>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    wantsPercent > 35 ? "bg-rose-500" : "bg-purple-500"
                  }`}
                  style={{ width: `${Math.min(100, wantsPercent)}%` }}
                />
              </div>
            </div>

            {/* Savings & Debt Payoff (20%) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Savings & Debt Principal (Emergency, Vacation, Loans)
                </span>
                <div className="text-right">
                  <span className="font-bold text-white">{formatCurrency(summary.savingsDebtSpent, sym)}</span>
                  <span className="text-slate-400 ml-1">({savingsPercent}% of income vs 20% target)</span>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    savingsPercent >= 20 ? "bg-emerald-500" : "bg-teal-500"
                  }`}
                  style={{ width: `${Math.min(100, savingsPercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Overspending Watch & Quick Insights */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-white text-sm">Budget Watchlist</h3>
            </div>

            {highSpendCategories.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-slate-200">All categories are healthy!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No envelopes have crossed the 80% warning threshold.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  Categories nearing or exceeding allocated limits:
                </p>
                {highSpendCategories.slice(0, 3).map((cat) => (
                  <div key={cat.id} className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-medium text-slate-200 truncate max-w-[120px]">
                          {cat.name}
                        </span>
                      </div>
                      <span
                        className={`font-semibold ${
                          cat.ratio >= 100 ? "text-rose-400" : "text-amber-400"
                        }`}
                      >
                        {Math.round(cat.ratio)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Spent: {formatCurrency(cat.spent, sym)}</span>
                      <span>Cap: {formatCurrency(cat.allocatedAmount, sym)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onSelectTab("advisor")}
              className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Ask AI Coach to Trim Expenses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
