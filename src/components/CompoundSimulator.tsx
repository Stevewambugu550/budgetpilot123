import React, { useState, useMemo } from "react";
import {
  Calculator,
  TrendingUp,
  Sparkles,
  DollarSign,
  Clock,
  ArrowRight,
  PiggyBank,
  Check,
  Zap,
  Coffee,
  ShoppingBag,
  Tv,
  Utensils,
  Shield,
} from "lucide-react";
import { HouseholdData } from "../types";
import { formatCurrency } from "../utils/budgetUtils";

interface CompoundSimulatorProps {
  data: HouseholdData;
}

export const CompoundSimulator: React.FC<CompoundSimulatorProps> = ({ data }) => {
  const [monthlyContribution, setMonthlyContribution] = useState<number>(300);
  const [annualReturnRate, setAnnualReturnRate] = useState<number>(5.0); // 5% APY
  const [years, setYears] = useState<number>(5);
  const [initialDeposit, setInitialDeposit] = useState<number>(2000);

  const sym = data.currencySymbol;

  // Calculate compound growth year by year
  const projectionData = useMemo(() => {
    const months = years * 12;
    const monthlyRate = annualReturnRate / 100 / 12;

    let balance = initialDeposit;
    let totalContributed = initialDeposit;
    const yearlyBreakdown: { year: number; balance: number; contributed: number; interest: number }[] = [];

    for (let m = 1; m <= months; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      totalContributed += monthlyContribution;

      if (m % 12 === 0) {
        const yearNum = m / 12;
        yearlyBreakdown.push({
          year: yearNum,
          balance: Math.round(balance),
          contributed: Math.round(totalContributed),
          interest: Math.round(balance - totalContributed),
        });
      }
    }

    const finalBalance = Math.round(balance);
    const finalContributed = Math.round(totalContributed);
    const finalInterest = Math.round(finalBalance - finalContributed);

    return {
      finalBalance,
      finalContributed,
      finalInterest,
      yearlyBreakdown,
    };
  }, [monthlyContribution, annualReturnRate, years, initialDeposit]);

  // Frugal hacks catalog
  const savingsTactics = [
    {
      id: "lunch",
      title: "Pack Work Lunches 3x/Week",
      saving: 120,
      icon: Utensils,
      desc: "Save ~$10 per meal instead of buying deli takeaways.",
    },
    {
      id: "coffee",
      title: "Home Brew Espresso & Coffee",
      saving: 60,
      icon: Coffee,
      desc: "Brew specialty beans at home instead of $6 barista cups.",
    },
    {
      id: "subs",
      title: "Audit & Rotate Subscriptions",
      saving: 45,
      icon: Tv,
      desc: "Keep only 1-2 active streaming accounts per month.",
    },
    {
      id: "groceries",
      title: "Shop Grocery Store Brands & Meal Plan",
      saving: 90,
      icon: ShoppingBag,
      desc: "Unit-price comparison and zero food waste planning.",
    },
    {
      id: "insurance",
      title: "Review Auto & Home Policy Bundles",
      saving: 50,
      icon: Shield,
      desc: "Compare competitor quotes or increase deductible safely.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">
            Household Savings & Compound Growth Simulator
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          See how small, consistent trims in household spending compound into life-changing wealth over time.
        </p>
      </div>

      {/* Main Interactive Controls & Projected Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Card (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Simulation Parameters
          </h3>

          {/* Initial Deposit */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Starting Balance</span>
              <strong className="text-emerald-400">{formatCurrency(initialDeposit, sym)}</strong>
            </div>
            <input
              id="sim-initial-deposit-slider"
              type="range"
              min="0"
              max="25000"
              step="500"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Monthly Savings */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Monthly Household Savings</span>
              <strong className="text-emerald-400 text-sm font-bold">
                {formatCurrency(monthlyContribution, sym)} / mo
              </strong>
            </div>
            <input
              id="sim-monthly-contribution-slider"
              type="range"
              min="25"
              max="2000"
              step="25"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>$25/mo</span>
              <span>$500/mo</span>
              <span>$1,000/mo</span>
              <span>$2,000/mo</span>
            </div>
          </div>

          {/* Return Rate APY */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Estimated Annual Yield / Return</span>
              <strong className="text-teal-400 font-bold">{annualReturnRate}% APY</strong>
            </div>
            <input
              id="sim-apy-slider"
              type="range"
              min="1.0"
              max="12.0"
              step="0.5"
              value={annualReturnRate}
              onChange={(e) => setAnnualReturnRate(Number(e.target.value))}
              className="w-full accent-teal-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setAnnualReturnRate(4.5)}
                className={`py-1 text-[11px] rounded border transition-colors ${
                  annualReturnRate === 4.5
                    ? "bg-teal-950 border-teal-500 text-teal-300 font-bold"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                4.5% (HYSA)
              </button>
              <button
                type="button"
                onClick={() => setAnnualReturnRate(7.0)}
                className={`py-1 text-[11px] rounded border transition-colors ${
                  annualReturnRate === 7.0
                    ? "bg-teal-950 border-teal-500 text-teal-300 font-bold"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                7.0% (Index Fund)
              </button>
              <button
                type="button"
                onClick={() => setAnnualReturnRate(10.0)}
                className={`py-1 text-[11px] rounded border transition-colors ${
                  annualReturnRate === 10.0
                    ? "bg-teal-950 border-teal-500 text-teal-300 font-bold"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                10.0% (Growth)
              </button>
            </div>
          </div>

          {/* Time Horizon */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Time Horizon</span>
              <strong className="text-white font-bold">{years} Years</strong>
            </div>
            <div className="flex gap-2">
              {[1, 3, 5, 10, 15, 20].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYears(y)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-semibold transition-all ${
                    years === y
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {y}y
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results & Visual Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Projected Total Balance in {years} Years
            </span>
            <div className="text-4xl font-extrabold text-emerald-400 tracking-tight mt-1">
              {formatCurrency(projectionData.finalBalance, sym)}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
                <span className="text-[11px] text-slate-400">Your Cash Contributed</span>
                <div className="text-lg font-bold text-slate-200">
                  {formatCurrency(projectionData.finalContributed, sym)}
                </div>
              </div>
              <div className="bg-teal-950/40 border border-teal-800/40 rounded-xl p-3">
                <span className="text-[11px] text-teal-300">Compound Returns Earned</span>
                <div className="text-lg font-bold text-teal-400">
                  +{formatCurrency(projectionData.finalInterest, sym)}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Year-By-Year Growth Stack Bar Graph */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Year-by-Year Growth Progression</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Principal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Compound Return
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {projectionData.yearlyBreakdown.map((row) => {
                const total = projectionData.finalBalance;
                const contributedWidth = total > 0 ? (row.contributed / total) * 100 : 0;
                const interestWidth = total > 0 ? (row.interest / total) * 100 : 0;

                return (
                  <div key={row.year} className="flex items-center gap-2 text-xs">
                    <span className="w-10 text-slate-400 font-mono text-[11px]">
                      Yr {row.year}
                    </span>
                    <div className="flex-1 bg-slate-800 h-4 rounded flex overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all"
                        style={{ width: `${contributedWidth}%` }}
                        title={`Principal: ${formatCurrency(row.contributed, sym)}`}
                      />
                      <div
                        className="bg-emerald-400 h-full transition-all"
                        style={{ width: `${interestWidth}%` }}
                        title={`Interest: ${formatCurrency(row.interest, sym)}`}
                      />
                    </div>
                    <span className="w-20 text-right font-semibold text-slate-200 text-xs">
                      {formatCurrency(row.balance, sym)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            *Assumes monthly compounding at {annualReturnRate}% APY. Projections are illustrative.
          </p>
        </div>
      </div>

      {/* Actionable Frugal Trims Library (Click to apply to simulator) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">
              Household Trimming Ideas (Tap to test impact)
            </h3>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click any idea to adjust monthly simulator rate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {savingsTactics.map((tactic) => {
            const Icon = tactic.icon;
            return (
              <div
                key={tactic.id}
                onClick={() => setMonthlyContribution((prev) => prev + tactic.saving)}
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/50 rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {tactic.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {tactic.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">+{formatCurrency(tactic.saving, sym)}/mo</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-200 flex items-center gap-1">
                    Add to sim <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
