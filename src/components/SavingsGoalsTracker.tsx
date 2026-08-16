import React, { useState } from "react";
import {
  PiggyBank,
  Plus,
  Target,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  Trash2,
  Edit2,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
  Plane,
  Wrench,
  Gift,
} from "lucide-react";
import { HouseholdData, SavingsGoal } from "../types";
import { formatCurrency, fireConfettiCelebration } from "../utils/budgetUtils";
import { CategoryIcon } from "./CategoryIcon";

interface SavingsGoalsTrackerProps {
  data: HouseholdData;
  onUpdateData: (newData: HouseholdData) => void;
}

export const SavingsGoalsTracker: React.FC<SavingsGoalsTrackerProps> = ({
  data,
  onUpdateData,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [depositingGoal, setDepositingGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(100);

  // Form state
  const [formName, setFormName] = useState("");
  const [formTargetAmount, setFormTargetAmount] = useState<number>(5000);
  const [formCurrentAmount, setFormCurrentAmount] = useState<number>(1000);
  const [formTargetDate, setFormTargetDate] = useState("2026-12-31");
  const [formCategory, setFormCategory] = useState<any>("Emergency");
  const [formColor, setFormColor] = useState("#10b981");
  const [formIcon, setFormIcon] = useState("ShieldAlert");
  const [formNotes, setFormNotes] = useState("");

  const sym = data.currencySymbol;

  const handleOpenCreate = () => {
    setFormName("");
    setFormTargetAmount(5000);
    setFormCurrentAmount(500);
    setFormTargetDate(new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10));
    setFormCategory("Emergency");
    setFormColor("#10b981");
    setFormIcon("ShieldAlert");
    setFormNotes("");
    setIsCreating(true);
    setEditingGoal(null);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormName(goal.name);
    setFormTargetAmount(goal.targetAmount);
    setFormCurrentAmount(goal.currentAmount);
    setFormTargetDate(goal.targetDate);
    setFormCategory(goal.category);
    setFormColor(goal.color);
    setFormIcon(goal.iconName);
    setFormNotes(goal.notes || "");
    setIsCreating(false);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingGoal) {
      const updated = data.goals.map((g) =>
        g.id === editingGoal.id
          ? {
              ...g,
              name: formName.trim(),
              targetAmount: Number(formTargetAmount) || 0,
              currentAmount: Number(formCurrentAmount) || 0,
              targetDate: formTargetDate,
              category: formCategory,
              color: formColor,
              iconName: formIcon,
              notes: formNotes,
            }
          : g
      );
      onUpdateData({ ...data, goals: updated });
      setEditingGoal(null);
    } else {
      const newGoal: SavingsGoal = {
        id: `goal-${Date.now()}`,
        name: formName.trim(),
        targetAmount: Number(formTargetAmount) || 0,
        currentAmount: Number(formCurrentAmount) || 0,
        targetDate: formTargetDate,
        category: formCategory,
        color: formColor,
        iconName: formIcon,
        notes: formNotes,
      };
      onUpdateData({ ...data, goals: [...data.goals, newGoal] });
      setIsCreating(false);
    }
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm("Delete this savings goal?")) {
      const updated = data.goals.filter((g) => g.id !== id);
      onUpdateData({ ...data, goals: updated });
      if (editingGoal?.id === id) setEditingGoal(null);
    }
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositingGoal || depositAmount <= 0) return;

    const newCurrent = depositingGoal.currentAmount + Number(depositAmount);
    const updatedGoals = data.goals.map((g) =>
      g.id === depositingGoal.id ? { ...g, currentAmount: newCurrent } : g
    );

    // Auto-record a savings deposit transaction
    const savingsCat = data.categories.find((c) => c.type === "savings") || data.categories[0];
    const newTx = {
      id: `tx-goal-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount: Number(depositAmount),
      type: "savings_deposit" as const,
      categoryId: savingsCat ? savingsCat.id : "cat-savings",
      memberId: data.members[0]?.id || "mem-shared",
      description: `Deposit to Goal: ${depositingGoal.name}`,
      paymentMethod: "Bank Transfer" as const,
    };

    onUpdateData({
      ...data,
      goals: updatedGoals,
      transactions: [newTx, ...data.transactions],
    });

    fireConfettiCelebration();
    setDepositingGoal(null);
  };

  const totalSavedAcrossGoals = data.goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTargetAcrossGoals = data.goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallProgress =
    totalTargetAcrossGoals > 0 ? Math.round((totalSavedAcrossGoals / totalTargetAcrossGoals) * 100) : 0;

  const goalIcons = ["ShieldAlert", "Plane", "Wrench", "Award", "Palmtree", "Home", "Car", "Gift", "Sparkles", "Target"];

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cumulative Savings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Stashed in Goals</span>
            <PiggyBank className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {formatCurrency(totalSavedAcrossGoals, sym)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target: <strong className="text-white">{formatCurrency(totalTargetAcrossGoals, sym)}</strong> ({overallProgress}% funded)
          </p>
        </div>

        {/* Active Sinking Funds */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Sinking Funds</span>
            <Target className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{data.goals.length}</div>
          <p className="text-xs text-slate-400 mt-1">
            Emergency, holiday, vehicles & debt payoff
          </p>
        </div>

        {/* New Goal CTA */}
        <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Future Wealth Builder
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Automate or manually deposit your monthly budget surplus.
            </p>
          </div>
          <button
            id="create-new-goal-btn"
            onClick={handleOpenCreate}
            className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create New Savings Goal
          </button>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.goals.map((goal) => {
          const progress =
            goal.targetAmount > 0
              ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              : 0;

          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          // Calculate required monthly savings to reach target by targetDate
          const targetDateObj = new Date(goal.targetDate);
          const now = new Date();
          const monthsLeft = Math.max(
            1,
            (targetDateObj.getFullYear() - now.getFullYear()) * 12 +
              (targetDateObj.getMonth() - now.getMonth())
          );
          const monthlyPaceNeeded = remaining / monthsLeft;

          const isComplete = goal.currentAmount >= goal.targetAmount;

          return (
            <div
              key={goal.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all relative overflow-hidden"
            >
              {isComplete && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase px-3 py-1 rounded-bl-xl shadow flex items-center gap-1">
                  <Award className="w-3 h-3" /> Target Achieved!
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: `${goal.color}25`, color: goal.color }}
                    >
                      <CategoryIcon name={goal.iconName} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{goal.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                          {goal.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Target: {goal.targetDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {goal.notes && (
                  <p className="text-xs text-slate-400 mb-3 bg-slate-800/50 p-2 rounded-lg border border-slate-800">
                    💡 {goal.notes}
                  </p>
                )}

                {/* Progress Numbers */}
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="text-2xl font-extrabold text-white">
                    {formatCurrency(goal.currentAmount, sym)}
                    <span className="text-xs text-slate-400 font-normal ml-1">
                      / {formatCurrency(goal.targetAmount, sym)}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      isComplete ? "text-emerald-400" : "text-teal-400"
                    }`}
                  >
                    {progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all bg-gradient-to-r from-teal-500 to-emerald-400"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Pace Details */}
                {!isComplete && (
                  <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/40 p-2 rounded-lg">
                    <span>
                      Remaining: <strong className="text-slate-200">{formatCurrency(remaining, sym)}</strong>
                    </span>
                    <span>
                      Save <strong className="text-emerald-400">{formatCurrency(monthlyPaceNeeded, sym)}/mo</strong> ({monthsLeft} mo left)
                    </span>
                  </div>
                )}
              </div>

              {/* Deposit CTA */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => {
                    setDepositingGoal(goal);
                    setDepositAmount(100);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Deposit Funds
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Deposit Modal */}
      {depositingGoal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Deposit to Goal</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Adding funds to <strong className="text-white">{depositingGoal.name}</strong>.
            </p>

            <form onSubmit={handleConfirmDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Deposit Amount ({sym})
                </label>
                <input
                  id="deposit-amount-input"
                  type="number"
                  min="1"
                  step="5"
                  required
                  autoFocus
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-lg font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {[25, 50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors"
                  >
                    +${amt}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositingGoal(null)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="confirm-deposit-btn"
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {(isCreating || editingGoal) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-3">
              {editingGoal ? "Edit Savings Goal" : "Create New Savings Goal"}
            </h3>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Goal Name</label>
                <input
                  id="goal-name-input"
                  type="text"
                  required
                  placeholder="e.g. Emergency Cushion, Summer Holiday, Car Downpayment"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Goal ({sym})
                  </label>
                  <input
                    id="goal-target-amount-input"
                    type="number"
                    min="10"
                    step="50"
                    required
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Current Saved ({sym})
                  </label>
                  <input
                    id="goal-current-amount-input"
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={formCurrentAmount}
                    onChange={(e) => setFormCurrentAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Date</label>
                  <input
                    id="goal-target-date-input"
                    type="date"
                    required
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Goal Category</label>
                  <select
                    id="goal-category-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Emergency">Emergency Fund</option>
                    <option value="Vacation">Vacation & Travel</option>
                    <option value="Vehicle">Vehicle / Car</option>
                    <option value="Home">Home & Renovation</option>
                    <option value="Debt Payoff">Debt Payoff</option>
                    <option value="Retirement">Retirement</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Icon</label>
                <div className="flex gap-2 overflow-x-auto p-1 bg-slate-800/60 rounded-lg border border-slate-700">
                  {goalIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setFormIcon(ic)}
                      className={`p-2 rounded-lg transition-colors ${
                        formIcon === ic ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <CategoryIcon name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Strategy / Location Notes (Optional)
                </label>
                <input
                  id="goal-notes-input"
                  type="text"
                  placeholder="e.g. In High Yield Savings Account earning 4.5% APY"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingGoal(null);
                  }}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="submit-goal-btn"
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                >
                  {editingGoal ? "Save Changes" : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
