import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Tag,
  TrendingDown,
  Info,
  DollarSign,
  Filter,
} from "lucide-react";
import { BudgetCategory, CategoryType, HouseholdData } from "../types";
import { formatCurrency, calculateCategorySpent } from "../utils/budgetUtils";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryBudgetManagerProps {
  data: HouseholdData;
  onUpdateData: (newData: HouseholdData) => void;
  onOpenQuickAdd: (type: "expense" | "income" | "savings_deposit", categoryId?: string) => void;
}

export const CategoryBudgetManager: React.FC<CategoryBudgetManagerProps> = ({
  data,
  onUpdateData,
  onOpenQuickAdd,
}) => {
  const [filterType, setFilterType] = useState<CategoryType | "all">("all");
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<CategoryType>("needs");
  const [formAmount, setFormAmount] = useState<number>(200);
  const [formIcon, setFormIcon] = useState("Tag");
  const [formColor, setFormColor] = useState("#3b82f6");
  const [formNotes, setFormNotes] = useState("");

  const sym = data.currencySymbol;

  const handleOpenCreate = () => {
    setFormName("");
    setFormType("needs");
    setFormAmount(200);
    setFormIcon("Tag");
    setFormColor("#3b82f6");
    setFormNotes("");
    setIsCreating(true);
    setEditingCategory(null);
  };

  const handleOpenEdit = (cat: BudgetCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormType(cat.type);
    setFormAmount(cat.allocatedAmount);
    setFormIcon(cat.iconName);
    setFormColor(cat.color);
    setFormNotes(cat.notes || "");
    setIsCreating(false);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCategory) {
      // Update existing
      const updatedCategories = data.categories.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: formName.trim(),
              type: formType,
              allocatedAmount: Number(formAmount) || 0,
              iconName: formIcon,
              color: formColor,
              notes: formNotes,
            }
          : c
      );
      onUpdateData({ ...data, categories: updatedCategories });
      setEditingCategory(null);
    } else {
      // Create new
      const newCategory: BudgetCategory = {
        id: `cat-${Date.now()}`,
        name: formName.trim(),
        type: formType,
        allocatedAmount: Number(formAmount) || 0,
        iconName: formIcon,
        color: formColor,
        isEssential: formType === "needs",
        notes: formNotes,
      };
      onUpdateData({ ...data, categories: [...data.categories, newCategory] });
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm("Delete this budget category? Transactions in this category will become uncategorized.")) {
      const updatedCategories = data.categories.filter((c) => c.id !== id);
      onUpdateData({ ...data, categories: updatedCategories });
      if (editingCategory?.id === id) setEditingCategory(null);
    }
  };

  const categoriesByType = {
    needs: data.categories.filter((c) => c.type === "needs"),
    wants: data.categories.filter((c) => c.type === "wants"),
    savings: data.categories.filter((c) => c.type === "savings"),
    debt: data.categories.filter((c) => c.type === "debt"),
  };

  const totalAllocated = data.categories.reduce((s, c) => s + c.allocatedAmount, 0);

  const availableIcons = [
    "Home", "ShoppingCart", "Zap", "Car", "HeartPulse", "Utensils", "Tv",
    "Gamepad2", "CreditCard", "ShieldCheck", "Palmtree", "Sparkles", "Building",
    "Fuel", "Coffee", "Smartphone", "BookOpen", "Gift", "Briefcase", "Tag"
  ];

  const colorPalette = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#06b6d4", "#14b8a6", "#eab308", "#6366f1"
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Envelope Budgets & Spending Caps
          </h2>
          <p className="text-xs text-slate-400">
            Total Allocated: <strong className="text-white">{formatCurrency(totalAllocated, sym)}</strong> across {data.categories.length} envelopes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === "all" ? "bg-slate-700 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("needs")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === "needs" ? "bg-blue-600/30 text-blue-300 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Needs
            </button>
            <button
              onClick={() => setFilterType("wants")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === "wants" ? "bg-purple-600/30 text-purple-300 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Wants
            </button>
            <button
              onClick={() => setFilterType("savings")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === "savings" ? "bg-emerald-600/30 text-emerald-300 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Savings
            </button>
            <button
              onClick={() => setFilterType("debt")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === "debt" ? "bg-rose-600/30 text-rose-300 font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              Debt
            </button>
          </div>

          <button
            id="add-new-category-btn"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Category
          </button>
        </div>
      </div>

      {/* Category List by Groups */}
      {(["needs", "wants", "savings", "debt"] as CategoryType[])
        .filter((type) => filterType === "all" || filterType === type)
        .map((type) => {
          const catList = categoriesByType[type];
          if (catList.length === 0) return null;

          const typeLabel =
            type === "needs"
              ? "Essential Living Needs (50% Target)"
              : type === "wants"
              ? "Lifestyle & Discretionary Wants (30% Target)"
              : type === "savings"
              ? "Savings Sinking Funds (20% Target)"
              : "Debt Principal & Loan Payoff";

          const typeBadgeColor =
            type === "needs"
              ? "bg-blue-950 text-blue-300 border-blue-800"
              : type === "wants"
              ? "bg-purple-950 text-purple-300 border-purple-800"
              : type === "savings"
              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
              : "bg-rose-950 text-rose-300 border-rose-800";

          const typeTotalAllocated = catList.reduce((s, c) => s + c.allocatedAmount, 0);
          const typeTotalSpent = catList.reduce(
            (s, c) => s + calculateCategorySpent(c.id, data.transactions, data.currentMonth),
            0
          );

          return (
            <div key={type} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeBadgeColor}`}>
                    {type.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{typeLabel}</span>
                </div>
                <div className="text-xs text-slate-300">
                  Total Spent: <strong className="text-white">{formatCurrency(typeTotalSpent, sym)}</strong> / {formatCurrency(typeTotalAllocated, sym)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catList.map((cat) => {
                  const spent = calculateCategorySpent(cat.id, data.transactions, data.currentMonth);
                  const remaining = cat.allocatedAmount - spent;
                  const percentUsed =
                    cat.allocatedAmount > 0 ? Math.round((spent / cat.allocatedAmount) * 100) : 0;
                  const isOver = spent > cat.allocatedAmount;

                  return (
                    <div
                      key={cat.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                            >
                              <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm leading-tight">{cat.name}</h4>
                              {cat.notes && (
                                <p className="text-[11px] text-slate-400 truncate max-w-[170px] mt-0.5">
                                  {cat.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Numbers */}
                        <div className="flex items-baseline justify-between mb-1.5 text-xs">
                          <div>
                            <span className="text-slate-400">Spent: </span>
                            <span className={`font-bold ${isOver ? "text-rose-400" : "text-white"}`}>
                              {formatCurrency(spent, sym)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Cap: </span>
                            <span className="font-semibold text-slate-300">
                              {formatCurrency(cat.allocatedAmount, sym)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOver
                                ? "bg-rose-500"
                                : percentUsed > 80
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                            }`}
                            style={{ width: `${Math.min(100, percentUsed)}%` }}
                          />
                        </div>

                        {/* Status Footer */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className={`flex items-center gap-1 ${
                              isOver
                                ? "text-rose-400 font-medium"
                                : percentUsed > 80
                                ? "text-amber-400 font-medium"
                                : "text-emerald-400 font-medium"
                            }`}
                          >
                            {isOver ? (
                              <>
                                <AlertCircle className="w-3 h-3" /> Over by {formatCurrency(Math.abs(remaining), sym)}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" /> {formatCurrency(remaining, sym)} left
                              </>
                            )}
                          </span>
                          <span className="text-slate-400 font-mono">{percentUsed}% used</span>
                        </div>
                      </div>

                      {/* Quick Log Button for this category */}
                      <button
                        onClick={() => onOpenQuickAdd(cat.type === "savings" ? "savings_deposit" : "expense", cat.id)}
                        className="mt-3 pt-2.5 border-t border-slate-800/80 w-full text-center text-xs text-slate-300 hover:text-emerald-400 font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Log {cat.type === "savings" ? "Deposit" : "Expense"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      {/* Add / Edit Category Modal */}
      {(isCreating || editingCategory) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-3">
              {editingCategory ? "Edit Category Envelope" : "Create New Budget Category"}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category Name</label>
                <input
                  id="cat-name-input"
                  type="text"
                  required
                  placeholder="e.g. Groceries, Car Repair, Baby Fund"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category Type</label>
                  <select
                    id="cat-type-select"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CategoryType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="needs">Needs (Essential 50%)</option>
                    <option value="wants">Wants (Lifestyle 30%)</option>
                    <option value="savings">Savings (Goal/Sinking 20%)</option>
                    <option value="debt">Debt Principal Repayment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Monthly Budget Cap ({sym})
                  </label>
                  <input
                    id="cat-amount-input"
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Icon</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1 bg-slate-800/60 rounded-lg border border-slate-700">
                  {availableIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setFormIcon(ic)}
                      className={`p-2 rounded-lg transition-colors ${
                        formIcon === ic
                          ? "bg-emerald-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-700"
                      }`}
                    >
                      <CategoryIcon name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Color Accent</label>
                <div className="flex gap-2">
                  {colorPalette.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFormColor(col)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        formColor === col ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Description (Optional)</label>
                <input
                  id="cat-notes-input"
                  type="text"
                  placeholder="e.g. Shared weekly supermarket trips"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingCategory(null);
                  }}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-category-btn"
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                >
                  {editingCategory ? "Save Changes" : "Create Envelope"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
