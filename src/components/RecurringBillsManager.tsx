import React, { useState } from "react";
import {
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  Trash2,
  Edit2,
  DollarSign,
  TrendingDown,
  Scissors,
  Check,
  CreditCard,
  Zap,
} from "lucide-react";
import { HouseholdData, RecurringBill } from "../types";
import { formatCurrency, fireConfettiCelebration } from "../utils/budgetUtils";
import { CategoryIcon } from "./CategoryIcon";

interface RecurringBillsManagerProps {
  data: HouseholdData;
  onUpdateData: (newData: HouseholdData) => void;
  onOpenQuickAdd: (type: "bill") => void;
}

export const RecurringBillsManager: React.FC<RecurringBillsManagerProps> = ({
  data,
  onUpdateData,
  onOpenQuickAdd,
}) => {
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState<number>(50);
  const [formDueDay, setFormDueDay] = useState<number>(15);
  const [formFrequency, setFormFrequency] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formMemberId, setFormMemberId] = useState("");
  const [formAutoPay, setFormAutoPay] = useState(true);
  const [formServiceCat, setFormServiceCat] = useState<any>("Utilities");

  const sym = data.currencySymbol;
  const currentDay = new Date().getDate();

  const handleOpenCreate = () => {
    setFormName("");
    setFormAmount(50);
    setFormDueDay(15);
    setFormFrequency("monthly");
    setFormCategoryId(data.categories[0]?.id || "");
    setFormMemberId(data.members[0]?.id || "");
    setFormAutoPay(true);
    setFormServiceCat("Utilities");
    setIsCreating(true);
    setEditingBill(null);
  };

  const handleOpenEdit = (bill: RecurringBill) => {
    setEditingBill(bill);
    setFormName(bill.name);
    setFormAmount(bill.amount);
    setFormDueDay(bill.dueDay);
    setFormFrequency(bill.frequency);
    setFormCategoryId(bill.categoryId);
    setFormMemberId(bill.memberId);
    setFormAutoPay(bill.autoPay);
    setFormServiceCat(bill.serviceCategory || "Utilities");
    setIsCreating(false);
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingBill) {
      const updated = data.bills.map((b) =>
        b.id === editingBill.id
          ? {
              ...b,
              name: formName.trim(),
              amount: Number(formAmount) || 0,
              dueDay: Number(formDueDay) || 1,
              frequency: formFrequency,
              categoryId: formCategoryId || data.categories[0]?.id || "",
              memberId: formMemberId || data.members[0]?.id || "",
              autoPay: formAutoPay,
              serviceCategory: formServiceCat,
            }
          : b
      );
      onUpdateData({ ...data, bills: updated });
      setEditingBill(null);
    } else {
      const newBill: RecurringBill = {
        id: `bill-${Date.now()}`,
        name: formName.trim(),
        amount: Number(formAmount) || 0,
        dueDay: Number(formDueDay) || 1,
        frequency: formFrequency,
        categoryId: formCategoryId || data.categories[0]?.id || "",
        memberId: formMemberId || data.members[0]?.id || "",
        isPaidThisMonth: false,
        autoPay: formAutoPay,
        serviceCategory: formServiceCat,
      };
      onUpdateData({ ...data, bills: [...data.bills, newBill] });
      setIsCreating(false);
    }
  };

  const handleDeleteBill = (id: string) => {
    if (confirm("Delete this recurring bill / subscription?")) {
      const updated = data.bills.filter((b) => b.id !== id);
      onUpdateData({ ...data, bills: updated });
      if (editingBill?.id === id) setEditingBill(null);
    }
  };

  const handleTogglePaid = (bill: RecurringBill) => {
    const nextPaidState = !bill.isPaidThisMonth;

    let updatedTransactions = [...data.transactions];

    if (nextPaidState) {
      // Auto-log transaction for this bill if paid
      const newTx = {
        id: `tx-bill-${bill.id}-${Date.now()}`,
        date: `${data.currentMonth}-${String(bill.dueDay).padStart(2, "0")}`,
        amount: bill.amount,
        type: "expense" as const,
        categoryId: bill.categoryId,
        memberId: bill.memberId,
        description: `Recurring Bill: ${bill.name}`,
        paymentMethod: "Bank Transfer" as const,
        isRecurring: true,
      };
      updatedTransactions = [newTx, ...updatedTransactions];
      fireConfettiCelebration();
    }

    const updatedBills = data.bills.map((b) =>
      b.id === bill.id ? { ...b, isPaidThisMonth: nextPaidState } : b
    );

    onUpdateData({
      ...data,
      bills: updatedBills,
      transactions: updatedTransactions,
    });
  };

  // Calculations
  const totalMonthlyBills = data.bills.reduce((sum, b) => {
    if (b.frequency === "monthly") return sum + b.amount;
    if (b.frequency === "yearly") return sum + b.amount / 12;
    if (b.frequency === "quarterly") return sum + b.amount / 3;
    return sum + b.amount;
  }, 0);

  const totalPaid = data.bills
    .filter((b) => b.isPaidThisMonth)
    .reduce((sum, b) => sum + b.amount, 0);

  const totalPending = data.bills
    .filter((b) => !b.isPaidThisMonth)
    .reduce((sum, b) => sum + b.amount, 0);

  // Sort bills by dueDay
  const sortedBills = [...data.bills].sort((a, b) => a.dueDay - b.dueDay);

  const categoryMap = new Map<string, any>(data.categories.map((c) => [c.id, c]));
  const memberMap = new Map<string, any>(data.members.map((m) => [m.id, m]));

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Add Button */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Monthly Commitments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Monthly Recurring</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(totalMonthlyBills, sym)}
            <span className="text-xs text-slate-400 font-normal ml-1">/ month</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatCurrency(totalMonthlyBills * 12, sym)} annualized commitment
          </p>
        </div>

        {/* Paid vs Due Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Paid vs Pending this Month</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totalPaid, sym)}
            </span>
            <span className="text-xs text-slate-400">paid</span>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold text-amber-400">
              {formatCurrency(totalPending, sym)} due
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{
                width: `${
                  totalMonthlyBills > 0 ? (totalPaid / totalMonthlyBills) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300">Recurring Management</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Never miss a utility or subscription due date
            </p>
          </div>
          <button
            id="add-recurring-bill-btn"
            onClick={handleOpenCreate}
            className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Recurring Bill
          </button>
        </div>
      </div>

      {/* Subscription Audit / Cut The Clutter Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">
              Cut The Clutter Audit
            </h4>
            <p className="text-xs text-slate-400">
              You have {data.bills.filter((b) => b.serviceCategory === "Streaming & Media" || b.serviceCategory === "Software").length} digital streaming/software subscriptions active.
            </p>
          </div>
        </div>
        <button
          onClick={() => alert("Tip: Audit unused subscriptions every 90 days. Canceling 2 subscriptions saves ~$300/year!")}
          className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors"
        >
          View Savings Tips
        </button>
      </div>

      {/* Bill List Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Upcoming Due Schedule (Sorted by Day of Month)
          </h3>
          <span className="text-xs text-slate-400">
            {data.bills.length} recurring item{data.bills.length === 1 ? "" : "s"}
          </span>
        </div>

        {sortedBills.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No recurring bills added yet.</p>
            <p className="text-xs text-slate-500 mt-1">Add your rent, utilities, insurance, or subscriptions.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {sortedBills.map((bill) => {
              const cat = categoryMap.get(bill.categoryId);
              const mem = memberMap.get(bill.memberId);
              const isPastDue = !bill.isPaidThisMonth && currentDay > bill.dueDay;
              const isDueSoon = !bill.isPaidThisMonth && bill.dueDay - currentDay >= 0 && bill.dueDay - currentDay <= 3;

              return (
                <div
                  key={bill.id}
                  className={`p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 ${
                    bill.isPaidThisMonth ? "opacity-75" : ""
                  }`}
                >
                  {/* Left: Due Date Badge & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase leading-none">DAY</span>
                      <span className="text-base font-extrabold text-white leading-none mt-0.5">
                        {bill.dueDay}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">{bill.name}</span>
                        {bill.autoPay && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                            AutoPay ON
                          </span>
                        )}
                        {bill.serviceCategory && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                            {bill.serviceCategory}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span className="text-slate-300">{cat?.name || "General"}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: mem?.color || "#94a3b8" }}
                          />
                          {mem?.name || "Shared"}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{bill.frequency}</span>
                      </div>

                      <div className="mt-1">
                        {bill.isPaidThisMonth ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid for {data.currentMonth}
                          </span>
                        ) : isPastDue ? (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                            <AlertCircle className="w-3.5 h-3.5" /> Overdue (Due day {bill.dueDay})
                          </span>
                        ) : isDueSoon ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                            <Clock className="w-3.5 h-3.5" /> Due in {bill.dueDay - currentDay} days
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Upcoming on {data.currentMonth}-{String(bill.dueDay).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Toggle Paid */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-base font-bold text-white">
                        {formatCurrency(bill.amount, sym)}
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {bill.frequency}
                      </span>
                    </div>

                    <button
                      onClick={() => handleTogglePaid(bill)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                        bill.isPaidThisMonth
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                    >
                      {bill.isPaidThisMonth ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Mark Unpaid
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark as Paid
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(bill)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                        title="Edit Bill"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Delete Bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Bill Modal */}
      {(isCreating || editingBill) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-3">
              {editingBill ? "Edit Recurring Bill" : "Add Recurring Bill / Subscription"}
            </h3>

            <form onSubmit={handleSaveBill} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bill Name</label>
                <input
                  id="bill-name-input"
                  type="text"
                  required
                  placeholder="e.g. Electric Utility, Netflix, Rent"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Amount ({sym})
                  </label>
                  <input
                    id="bill-amount-input"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Due Day of Month (1-31)
                  </label>
                  <input
                    id="bill-due-day-input"
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={formDueDay}
                    onChange={(e) => setFormDueDay(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Frequency</label>
                  <select
                    id="bill-frequency-select"
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Service Type</label>
                  <select
                    id="bill-service-cat-select"
                    value={formServiceCat}
                    onChange={(e) => setFormServiceCat(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Utilities">Utilities</option>
                    <option value="Housing">Housing</option>
                    <option value="Streaming & Media">Streaming & Media</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Software">Software</option>
                    <option value="Gym & Health">Gym & Health</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    id="bill-category-select"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {data.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Member</label>
                  <select
                    id="bill-member-select"
                    value={formMemberId}
                    onChange={(e) => setFormMemberId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {data.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="bill-autopay-checkbox"
                  type="checkbox"
                  checked={formAutoPay}
                  onChange={(e) => setFormAutoPay(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700"
                />
                <label htmlFor="bill-autopay-checkbox" className="text-xs text-slate-300 cursor-pointer">
                  AutoPay enabled with provider
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingBill(null);
                  }}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-bill-btn"
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                >
                  {editingBill ? "Save Changes" : "Add Recurring Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
