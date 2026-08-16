import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  Check,
  Copy,
  Scissors,
  Target,
  ShieldAlert,
  HelpCircle,
  TrendingDown,
  Zap,
} from "lucide-react";
import { HouseholdData } from "../types";
import { calculateSummary } from "../utils/budgetUtils";

interface AiSavingsAdvisorProps {
  data: HouseholdData;
}

export const AiSavingsAdvisor: React.FC<AiSavingsAdvisorProps> = ({ data }) => {
  const [activeMode, setActiveMode] = useState<"audit" | "bill_negotiator" | "savings_challenge" | "custom">("audit");
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = calculateSummary(data);

  const handleRunAdvisor = async (modeOverride?: "audit" | "bill_negotiator" | "savings_challenge" | "custom", customText?: string) => {
    const mode = modeOverride || activeMode;
    const prompt = customText !== undefined ? customText : userPrompt;

    setLoading(true);
    setError(null);

    // Build budget payload for the server
    const budgetSummary = {
      currentMonth: data.currentMonth,
      currency: data.currencySymbol,
      totalIncome: summary.totalIncome,
      totalBudget: summary.totalBudgeted,
      totalSpent: summary.totalSpent,
      totalSaved: summary.totalSaved,
      savingsRate: summary.savingsRate,
      remainingCash: summary.netCashRemaining,
      members: data.members.map((m) => ({ name: m.name, role: m.role, income: m.monthlyIncome })),
      categories: data.categories.map((c) => {
        const spent = data.transactions
          .filter((tx) => tx.categoryId === c.id && tx.date.startsWith(data.currentMonth))
          .reduce((sum, tx) => sum + tx.amount, 0);
        return {
          name: c.name,
          type: c.type,
          budgetCap: c.allocatedAmount,
          actualSpent: spent,
        };
      }),
      bills: data.bills.map((b) => ({
        name: b.name,
        amount: b.amount,
        frequency: b.frequency,
        dueDay: b.dueDay,
        isPaidThisMonth: b.isPaidThisMonth,
        serviceCategory: b.serviceCategory,
      })),
      goals: data.goals.map((g) => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate,
      })),
    };

    try {
      const res = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budgetSummary,
          prompt,
          mode,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      setAiResponse(json.response || "No response received.");
      if (json.notice) {
        setError(json.notice);
      } else {
        setError(null);
      }
    } catch (err: any) {
      console.error("Failed to generate AI advice:", err);
      setError("AI model server is experiencing high traffic. Displaying real-time calculated financial diagnosis.");
      setAiResponse(`### 📊 Household Budget & Savings Assessment

- **Household Savings Rate:** **${summary.savingsRate}%** (${summary.savingsRate >= 20 ? "🌟 Exceeds the 20% golden benchmark" : "Aim for 15–20%"})
- **Monthly Net Cash Flow:** **${data.currencySymbol}${summary.netCashRemaining.toLocaleString()}** remaining this cycle.
- **Budget Discipline:** Total allocated budgets: **${data.currencySymbol}${summary.totalBudgeted.toLocaleString()}** vs actual spending: **${data.currencySymbol}${summary.totalSpent.toLocaleString()}**.

#### 🚀 Recommended Action Steps:
1. **Automate Sinking Fund Transfers:** Transfer your target emergency deposit on the 1st of every month automatically before spending occurs.
2. **Review High-Variance Categories:** Monitor dining out and miscellaneous discretionary spending with a strict weekly envelope limit.
3. **Audit Recurring Subscriptions:** Cancel any streaming service not watched in the last 14 days to immediately liberate cash flow.
4. **Meal Planning:** Prep 4-5 dinners per week around pantry staples and store discounts to save ~$200/month for a household.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-800/60 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              AI Household Savings & Financial Coach
            </h2>
            <p className="text-xs text-slate-300">
              Personalized money-saving tactics, bill reduction scripts, and spending audits tailored to your household data.
            </p>
          </div>
        </div>

        {/* 4 Quick Action Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <button
            onClick={() => {
              setActiveMode("audit");
              handleRunAdvisor("audit");
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeMode === "audit"
                ? "bg-emerald-900/60 border-emerald-400 text-white shadow-md"
                : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">360° Financial Audit</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Instant leak detection & health score based on live data.
            </p>
          </button>

          <button
            onClick={() => {
              setActiveMode("bill_negotiator");
              handleRunAdvisor("bill_negotiator");
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeMode === "bill_negotiator"
                ? "bg-emerald-900/60 border-emerald-400 text-white shadow-md"
                : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold">Bill Negotiator</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Step-by-step phone & chat scripts to slash utility & cable bills.
            </p>
          </button>

          <button
            onClick={() => {
              setActiveMode("savings_challenge");
              handleRunAdvisor("savings_challenge");
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeMode === "savings_challenge"
                ? "bg-emerald-900/60 border-emerald-400 text-white shadow-md"
                : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold">30-Day Sprint</span>
            </div>
            <p className="text-[11px] text-slate-400">
              4-week step-by-step plan to save $250+ without feeling deprived.
            </p>
          </button>

          <button
            onClick={() => setActiveMode("custom")}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeMode === "custom"
                ? "bg-emerald-900/60 border-emerald-400 text-white shadow-md"
                : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">Ask Anything</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ask specific questions about family finances and debt.
            </p>
          </button>
        </div>
      </div>

      {/* Interactive Prompt Box for Custom Queries */}
      {activeMode === "custom" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <label className="block text-xs font-semibold text-slate-200">
            Ask Your AI Savings Coach a Question:
          </label>
          <div className="flex gap-2">
            <input
              id="ai-prompt-input"
              type="text"
              placeholder="e.g. How can we cut grocery spending by 25%? Should we pay off our car loan or save for emergency fund?"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleRunAdvisor("custom", userPrompt);
                }
              }}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              id="ai-send-btn"
              onClick={() => handleRunAdvisor("custom", userPrompt)}
              disabled={loading || !userPrompt.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
          </div>

          {/* Quick Example Prompt Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
            <span>Quick prompts:</span>
            {[
              "How to build a 3-month emergency fund faster?",
              "Tips to lower our utility electric bills?",
              "Should we use debt snowball or avalanche?",
              "How to budget for groceries on $150/wk?",
            ].map((qp) => (
              <button
                key={qp}
                onClick={() => {
                  setUserPrompt(qp);
                  handleRunAdvisor("custom", qp);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 transition-colors"
              >
                "{qp}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Response Display Box */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
          <p className="text-sm font-medium text-white">
            Analyzing household cash flow, envelope allocations & recurring bills...
          </p>
          <p className="text-xs text-slate-500">
            Formulating tailored savings recommendations for your family
          </p>
        </div>
      ) : aiResponse ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Bot className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-white text-sm">
                Household Savings Plan & Diagnostic
              </h3>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Advice
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="text-xs text-amber-400 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/40">
              {error}
            </div>
          )}

          {/* Formatted Markdown-like Render */}
          <div className="prose prose-invert max-w-none text-slate-200 text-xs sm:text-sm leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
            {aiResponse}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
          <Sparkles className="w-10 h-10 mx-auto mb-2 text-emerald-400 opacity-60" />
          <h4 className="text-sm font-bold text-white">Ready for your Financial Diagnosis?</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Select one of the 4 modes above to generate immediate, actionable savings tactics for your household.
          </p>
          <button
            onClick={() => handleRunAdvisor("audit")}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
          >
            Run 360° Financial Audit
          </button>
        </div>
      )}
    </div>
  );
};
