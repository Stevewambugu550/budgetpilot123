import React, { useState } from "react";
import {
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Clock,
  X,
  Plus,
  DollarSign,
  Calendar,
  CreditCard,
  User,
  Sparkles,
} from "lucide-react";
import { HouseholdData, PaymentMethod, Transaction, IncomeItem } from "../types";
import { fireConfettiCelebration } from "../utils/budgetUtils";

interface QuickAddModalProps {
  isOpen: boolean;
  initialType?: "expense" | "income" | "savings_deposit" | "bill" | "goal";
  initialCategoryId?: string;
  data: HouseholdData;
  onClose: () => void;
  onUpdateData: (newData: HouseholdData) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  initialType = "expense",
  initialCategoryId,
  data,
  onClose,
  onUpdateData,
}) => {
  if (!isOpen) return null;

  const [entryType, setEntryType] = useState<"expense" | "income" | "savings_deposit">(
    initialType === "income" ? "income" : initialType === "savings_deposit" ? "savings_deposit" : "expense"
  );

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState<string>(
    initialCategoryId || data.categories[0]?.id || ""
  );
  const [memberId, setMemberId] = useState<string>(data.members[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Card");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  const sym = data.currencySymbol;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const numAmount = Number(amount);

    if (entryType === "income") {
      const newIncome: IncomeItem = {
        id: `inc-${Date.now()}`,
        memberId: memberId || data.members[0]?.id || "",
        sourceName: description.trim() || "Household Income Deposit",
        amount: numAmount,
        frequency: "monthly",
        date,
        notes,
      };

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        date,
        amount: numAmount,
        type: "income",
        categoryId: categoryId || data.categories[0]?.id || "",
        memberId: memberId || data.members[0]?.id || "",
        description: description.trim() || "Income Deposit",
        paymentMethod,
        notes,
      };

      onUpdateData({
        ...data,
        incomes: [newIncome, ...data.incomes],
        transactions: [newTx, ...data.transactions],
      });
    } else {
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        date,
        amount: numAmount,
        type: entryType,
        categoryId: categoryId || data.categories[0]?.id || "",
        memberId: memberId || data.members[0]?.id || "",
        description:
          description.trim() ||
          (entryType === "savings_deposit" ? "Savings Goal Deposit" : "Household Expense"),
        paymentMethod,
        isRecurring,
        notes,
      };

      // If savings deposit, also update relevant goal if available
      let updatedGoals = [...data.goals];
      if (entryType === "savings_deposit" && updatedGoals.length > 0) {
        // distribute or add to first emergency goal
        updatedGoals[0] = {
          ...updatedGoals[0],
          currentAmount: updatedGoals[0].currentAmount + numAmount,
        };
        fireConfettiCelebration();
      }

      onUpdateData({
        ...data,
        goals: updatedGoals,
        transactions: [newTx, ...data.transactions],
      });
    }

    onClose();
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Record Household Money
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Entry Type Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800/80 border border-slate-700/80 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setEntryType("expense")}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              entryType === "expense"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" /> Expense
          </button>

          <button
            type="button"
            onClick={() => setEntryType("savings_deposit")}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              entryType === "savings_deposit"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" /> Save
          </button>

          <button
            type="button"
            onClick={() => setEntryType("income")}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              entryType === "income"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Income
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input & Quick Chips */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount ({sym})
            </label>
            <input
              id="quick-amount-input"
              type="number"
              min="0.01"
              step="0.01"
              required
              autoFocus
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-2xl font-black text-white focus:outline-none focus:border-emerald-500"
            />
            <div className="flex gap-1.5 mt-2">
              {[10, 25, 50, 100, 250].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700/80 transition-colors"
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description / Merchant
            </label>
            <input
              id="quick-desc-input"
              type="text"
              required
              placeholder={
                entryType === "expense"
                  ? "e.g. Supermarket Grocery, Electric Bill, Gas"
                  : entryType === "savings_deposit"
                  ? "e.g. Monthly Sinking Fund, Emergency Stash"
                  : "e.g. Main Salary, Bonus, Side Gig"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category & Member */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                id="quick-category-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              >
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Paid By / For</label>
              <select
                id="quick-member-select"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              >
                {data.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
              <input
                id="quick-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
              <select
                id="quick-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="Card">Credit Card</option>
                <option value="Debit">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes (Optional)</label>
            <input
              id="quick-notes-input"
              type="text"
              placeholder="e.g. Split with Jordan 50/50, receipts kept"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Recurring checkbox if expense */}
          {entryType === "expense" && (
            <div className="flex items-center gap-2">
              <input
                id="quick-recurring-checkbox"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700"
              />
              <label htmlFor="quick-recurring-checkbox" className="text-xs text-slate-300 cursor-pointer">
                Mark as recurring monthly expense
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              id="submit-quick-entry-btn"
              type="submit"
              className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-colors ${
                entryType === "expense"
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : entryType === "savings_deposit"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              {entryType === "expense"
                ? "Record Expense"
                : entryType === "savings_deposit"
                ? "Save Funds"
                : "Record Income"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
