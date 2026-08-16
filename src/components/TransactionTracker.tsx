import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Download,
  Calendar,
  CreditCard,
  User,
  Coffee,
  Fuel,
  ShoppingCart,
  Utensils,
  Zap,
} from "lucide-react";
import { HouseholdData, Transaction, PaymentMethod } from "../types";
import { formatCurrency, exportToCSV } from "../utils/budgetUtils";
import { CategoryIcon } from "./CategoryIcon";

interface TransactionTrackerProps {
  data: HouseholdData;
  onUpdateData: (newData: HouseholdData) => void;
  onOpenQuickAdd: (type: "expense" | "income" | "savings_deposit") => void;
}

export const TransactionTracker: React.FC<TransactionTrackerProps> = ({
  data,
  onUpdateData,
  onOpenQuickAdd,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const sym = data.currencySymbol;

  // Filter transactions
  const filteredTransactions = data.transactions
    .filter((tx) => tx.date.startsWith(data.currentMonth))
    .filter((tx) => {
      if (selectedType !== "all" && tx.type !== selectedType) return false;
      if (selectedCategory !== "all" && tx.categoryId !== selectedCategory) return false;
      if (selectedMember !== "all" && tx.memberId !== selectedMember) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = (tx.description || "").toLowerCase().includes(q);
        const notesMatch = (tx.notes || "").toLowerCase().includes(q);
        const methodMatch = (tx.paymentMethod || "").toLowerCase().includes(q);
        return descMatch || notesMatch || methodMatch;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = (id: string) => {
    if (confirm("Delete this transaction entry?")) {
      const updated = data.transactions.filter((t) => t.id !== id);
      onUpdateData({ ...data, transactions: updated });
    }
  };

  const handleQuickPreset = (preset: { desc: string; amount: number; catId: string; type: "expense" | "savings_deposit" }) => {
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount: preset.amount,
      type: preset.type,
      categoryId: preset.catId,
      memberId: data.members[0]?.id || "mem-1",
      description: preset.desc,
      paymentMethod: "Card",
    };
    onUpdateData({
      ...data,
      transactions: [newTx, ...data.transactions],
    });
  };

  // Find grocery / gas / dining / coffee categories for presets
  const groceryCat = data.categories.find((c) => c.name.toLowerCase().includes("grocer") || c.name.toLowerCase().includes("food")) || data.categories[0];
  const diningCat = data.categories.find((c) => c.name.toLowerCase().includes("dining") || c.name.toLowerCase().includes("coffee")) || data.categories[0];
  const transportCat = data.categories.find((c) => c.name.toLowerCase().includes("transport") || c.name.toLowerCase().includes("fuel")) || data.categories[0];
  const savingsCat = data.categories.find((c) => c.type === "savings") || data.categories[0];

  const categoryMap = new Map<string, any>(data.categories.map((c) => [c.id, c]));
  const memberMap = new Map<string, any>(data.members.map((m) => [m.id, m]));

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalFilteredSaved = filteredTransactions
    .filter((t) => t.type === "savings_deposit")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* 1-Click Quick Presets Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            1-Click Quick Presets
          </h3>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Tap to instantly record common household spending
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {diningCat && (
            <button
              onClick={() => handleQuickPreset({ desc: "Morning Coffee / Snack", amount: 6.5, catId: diningCat.id, type: "expense" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 transition-colors active:scale-95"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>Coffee $6.50</span>
            </button>
          )}

          {groceryCat && (
            <button
              onClick={() => handleQuickPreset({ desc: "Supermarket Grocery Run", amount: 85.0, catId: groceryCat.id, type: "expense" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 transition-colors active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
              <span>Groceries $85</span>
            </button>
          )}

          {transportCat && (
            <button
              onClick={() => handleQuickPreset({ desc: "Gas Station Fuel", amount: 45.0, catId: transportCat.id, type: "expense" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 transition-colors active:scale-95"
            >
              <Fuel className="w-3.5 h-3.5 text-blue-400" />
              <span>Gas $45</span>
            </button>
          )}

          {diningCat && (
            <button
              onClick={() => handleQuickPreset({ desc: "Takeaway Dinner", amount: 32.0, catId: diningCat.id, type: "expense" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 transition-colors active:scale-95"
            >
              <Utensils className="w-3.5 h-3.5 text-orange-400" />
              <span>Takeout $32</span>
            </button>
          )}

          {savingsCat && (
            <button
              onClick={() => handleQuickPreset({ desc: "Quick Save to Emergency Fund", amount: 50.0, catId: savingsCat.id, type: "savings_deposit" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-900/60 hover:bg-teal-800/80 border border-teal-700/80 rounded-lg text-xs text-teal-200 transition-colors active:scale-95"
            >
              <PiggyBank className="w-3.5 h-3.5 text-teal-400" />
              <span>Save $50</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Action Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="transaction-search-input"
              type="text"
              placeholder="Search by description, note, or card..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="export-csv-action-btn"
              onClick={() => exportToCSV(filteredTransactions, data)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export CSV
            </button>

            <button
              id="log-expense-btn"
              onClick={() => onOpenQuickAdd("expense")}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Expense
            </button>

            <button
              id="log-income-btn"
              onClick={() => onOpenQuickAdd("income")}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Income
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1 text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          {/* Type Filter */}
          <select
            id="tx-type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
            <option value="savings_deposit">Savings Deposits</option>
          </select>

          {/* Category Filter */}
          <select
            id="tx-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="all">All Categories</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Member Filter */}
          <select
            id="tx-member-filter"
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="all">All Members</option>
            {data.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Summary tags */}
          <div className="ml-auto text-xs text-slate-400">
            Showing <strong className="text-white">{filteredTransactions.length}</strong> items (Spent: <span className="text-rose-400">{formatCurrency(totalFilteredExpense, sym)}</span>)
          </div>
        </div>
      </div>

      {/* Transaction List Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No transactions match the selected filters.</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or log a new transaction.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredTransactions.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              const mem = memberMap.get(tx.memberId);

              const isExpense = tx.type === "expense";
              const isIncome = tx.type === "income";
              const isSavings = tx.type === "savings_deposit";

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: cat ? `${cat.color}20` : "#334155",
                        color: cat ? cat.color : "#94a3b8",
                      }}
                    >
                      <CategoryIcon name={cat?.iconName || "Tag"} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm truncate">
                          {tx.description || "Untitled Transaction"}
                        </span>
                        {tx.isRecurring && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            Recurring
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {tx.date}
                        </span>
                        <span>•</span>
                        <span className="text-slate-300">{cat?.name || "Uncategorized"}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: mem?.color || "#94a3b8" }}
                          />
                          {mem?.name || "Shared"}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">{tx.paymentMethod}</span>
                      </div>

                      {tx.notes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-sm">
                          Note: {tx.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-bold ${
                          isExpense
                            ? "text-rose-400"
                            : isIncome
                            ? "text-emerald-400"
                            : "text-teal-400"
                        }`}
                      >
                        {isExpense ? "-" : "+"}
                        {formatCurrency(tx.amount, sym)}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase">
                        {tx.type.replace("_", " ")}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
