import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  CreditCard,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  ShoppingBag,
  Clock,
} from "lucide-react";
import { HouseholdData, Transaction } from "../types";
import { formatCurrency } from "../utils/budgetUtils";
import { CategoryIcon } from "./CategoryIcon";
import { useAuth } from "../context/AuthContext";

interface TransactionVisualsProps {
  data: HouseholdData;
  onSelectCategory?: (catId: string) => void;
}

export const TransactionVisuals: React.FC<TransactionVisualsProps> = ({
  data,
  onSelectCategory,
}) => {
  const { formatMasked } = useAuth();
  const [hoveredDay, setHoveredDay] = useState<{ day: number; amount: number; count: number } | null>(null);
  const [selectedVisualMode, setSelectedVisualMode] = useState<"flow" | "categories" | "methods" | "merchants">("flow");

  const sym = data.currencySymbol;
  const currentMonthPrefix = data.currentMonth;

  // Filter transactions for current month
  const monthTxs = data.transactions.filter((tx) =>
    tx.date.startsWith(currentMonthPrefix)
  );

  const expenseTxs = monthTxs.filter((tx) => tx.type === "expense");
  const incomeTxs = monthTxs.filter((tx) => tx.type === "income");
  const savingsTxs = monthTxs.filter((tx) => tx.type === "savings_deposit");

  const totalExpense = expenseTxs.reduce((s, tx) => s + tx.amount, 0);
  const totalIncome = incomeTxs.reduce((s, tx) => s + tx.amount, 0);
  const totalSavings = savingsTxs.reduce((s, tx) => s + tx.amount, 0);

  // Daily Spending Array (Day 1 to daysInMonth)
  const [yearStr, monthStr] = currentMonthPrefix.split("-");
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || (new Date().getMonth() + 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const dailySpendMap: Record<number, { amount: number; count: number }> = {};
  for (let i = 1; i <= daysInMonth; i++) {
    dailySpendMap[i] = { amount: 0, count: 0 };
  }

  expenseTxs.forEach((tx) => {
    const day = parseInt(tx.date.slice(8, 10), 10);
    if (dailySpendMap[day]) {
      dailySpendMap[day].amount += tx.amount;
      dailySpendMap[day].count += 1;
    }
  });

  const dailySpendList = Object.entries(dailySpendMap).map(([day, val]) => ({
    day: parseInt(day, 10),
    amount: val.amount,
    count: val.count,
  }));

  const maxDailySpend = Math.max(1, ...dailySpendList.map((d) => d.amount));

  // Category breakdown calculation
  const categorySpendMap: Record<string, number> = {};
  expenseTxs.forEach((tx) => {
    categorySpendMap[tx.categoryId] = (categorySpendMap[tx.categoryId] || 0) + tx.amount;
  });

  const categoryBreakdown = data.categories
    .map((cat) => ({
      ...cat,
      spent: categorySpendMap[cat.id] || 0,
      percent: totalExpense > 0 ? ((categorySpendMap[cat.id] || 0) / totalExpense) * 100 : 0,
    }))
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  // Payment Method Breakdown
  const paymentMethodMap: Record<string, number> = {};
  expenseTxs.forEach((tx) => {
    const method = tx.paymentMethod || "Card";
    paymentMethodMap[method] = (paymentMethodMap[method] || 0) + tx.amount;
  });

  // Top Payees / Merchants
  const payeeMap: Record<string, { total: number; count: number; categoryId: string }> = {};
  expenseTxs.forEach((tx) => {
    const desc = tx.description || "General Purchase";
    if (!payeeMap[desc]) {
      payeeMap[desc] = { total: 0, count: 0, categoryId: tx.categoryId };
    }
    payeeMap[desc].total += tx.amount;
    payeeMap[desc].count += 1;
  });

  const topPayees = Object.entries(payeeMap)
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // SVG dimensions for daily spending wave
  const svgWidth = 600;
  const svgHeight = 140;
  const paddingX = 20;
  const paddingY = 20;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  const points = dailySpendList.map((d, index) => {
    const x = paddingX + (index / (daysInMonth - 1)) * plotWidth;
    const y = svgHeight - paddingY - (d.amount / maxDailySpend) * plotHeight;
    return { x, y, day: d.day, amount: d.amount, count: d.count };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    // Catmull-Rom or cubic curve smoothing
    const prev = points[idx - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x},${svgHeight - paddingY} L ${points[0].x},${svgHeight - paddingY} Z`;

  return (
    <div className="space-y-6">
      {/* Visual Navigation Sub-bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Interactive Financial Visuals & Cash Flow Velocity
            </h2>
            <p className="text-xs text-slate-400">
              Live transaction trends, category distributions, and daily spend waves
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
          <button
            onClick={() => setSelectedVisualMode("flow")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedVisualMode === "flow"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Daily Spend Wave
          </button>
          <button
            onClick={() => setSelectedVisualMode("categories")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedVisualMode === "categories"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Category Donut
          </button>
          <button
            onClick={() => setSelectedVisualMode("methods")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedVisualMode === "methods"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Payment Channels
          </button>
          <button
            onClick={() => setSelectedVisualMode("merchants")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedVisualMode === "merchants"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Top Payees
          </button>
        </div>
      </div>

      {/* Primary Visual Showcase Card */}
      {selectedVisualMode === "flow" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Daily Spending Curve ({data.currentMonth})</h3>
                <p className="text-[11px] text-slate-400">Hover over any day dot to inspect daily velocity</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Peak Day: <strong className="text-white">{formatMasked(formatCurrency(maxDailySpend, sym))}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                <span>Month Total: <strong className="text-white">{formatMasked(formatCurrency(totalExpense, sym))}</strong></span>
              </div>
            </div>
          </div>

          {/* SVG Wave Chart */}
          <div className="relative bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 sm:h-52 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="spendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>

              {/* Horizontal Gridlines */}
              <line
                x1={paddingX}
                y1={svgHeight - paddingY}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY}
                stroke="#334155"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={paddingX}
                y1={svgHeight / 2}
                x2={svgWidth - paddingX}
                y2={svgHeight / 2}
                stroke="#1e293b"
                strokeDasharray="2 2"
                strokeWidth="1"
              />

              {/* Area fill */}
              <path d={areaD} fill="url(#spendGradient)" />

              {/* Line path */}
              <path
                d={pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Data Dots */}
              {points.map((pt) => {
                const isHovered = hoveredDay?.day === pt.day;
                const hasSpend = pt.amount > 0;
                return (
                  <g
                    key={pt.day}
                    onMouseEnter={() =>
                      setHoveredDay({ day: pt.day, amount: pt.amount, count: pt.count })
                    }
                    onMouseLeave={() => setHoveredDay(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : hasSpend ? 3.5 : 2}
                      className={`transition-all duration-150 ${
                        isHovered
                          ? "fill-white stroke-emerald-400 stroke-[3px]"
                          : hasSpend
                          ? "fill-emerald-400"
                          : "fill-slate-700"
                      }`}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredDay && (
              <div
                className="absolute top-4 left-4 bg-slate-900/95 border border-emerald-500/60 rounded-xl p-2.5 shadow-2xl text-xs text-white pointer-events-none animate-fade-in backdrop-blur-md"
              >
                <div className="font-bold text-emerald-400">Day {hoveredDay.day} of {data.currentMonth}</div>
                <div className="text-sm font-extrabold mt-0.5">
                  {formatMasked(formatCurrency(hoveredDay.amount, sym))}
                </div>
                <div className="text-[11px] text-slate-400">
                  {hoveredDay.count} transaction{hoveredDay.count === 1 ? "" : "s"} logged
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Donut & Segmented Bars */}
      {selectedVisualMode === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Category List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Category Spending Distribution
            </h3>

            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-slate-200">{cat.name}</span>
                      <span className="text-[10px] text-slate-400">
                        ({Math.round(cat.percent)}%)
                      </span>
                    </div>
                    <div className="font-bold text-white">
                      {formatMasked(formatCurrency(cat.spent, sym))}
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, cat.percent)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats side card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3">
                Top Spending Category
              </h4>
              {categoryBreakdown[0] ? (
                <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categoryBreakdown[0].color }}
                    />
                    <span className="font-bold text-white text-base">
                      {categoryBreakdown[0].name}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {formatMasked(formatCurrency(categoryBreakdown[0].spent, sym))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Represents {Math.round(categoryBreakdown[0].percent)}% of your monthly expenditure.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No category transactions recorded yet.</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
              Active Envelopes: <strong className="text-white">{data.categories.length}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Payment Channels Mode */}
      {selectedVisualMode === "methods" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400" />
            Spending Velocity by Payment Method
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(paymentMethodMap).map(([method, amount]) => {
              const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
              return (
                <div
                  key={method}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{method}</span>
                    <span className="font-bold text-slate-200">{percent}%</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {formatMasked(formatCurrency(amount, sym))}
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-400 h-full rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Payees Mode */}
      {selectedVisualMode === "merchants" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-teal-400" />
            Top 5 Payees & Merchant Leaderboard
          </h3>

          <div className="divide-y divide-slate-800">
            {topPayees.map((payee, idx) => (
              <div
                key={payee.name}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 text-[11px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-white">{payee.name}</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      ({payee.count} order{payee.count === 1 ? "" : "s"})
                    </span>
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-400">
                  {formatMasked(formatCurrency(payee.total, sym))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
