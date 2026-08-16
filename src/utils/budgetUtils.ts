import { HouseholdData, Transaction } from "../types";
import confetti from "canvas-confetti";

const STORAGE_KEY = "household_budget_hub_v1";

export function loadHouseholdData(defaultData: HouseholdData): HouseholdData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure required properties exist
      return {
        ...defaultData,
        ...parsed,
      };
    }
  } catch (e) {
    console.error("Failed to load saved data:", e);
  }
  return defaultData;
}

export function saveHouseholdData(data: HouseholdData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

export function formatCurrency(amount: number, symbol: string = "$"): string {
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateSummary(data: HouseholdData) {
  const currentMonthPrefix = data.currentMonth; // "YYYY-MM"

  // Calculate total monthly income
  const totalIncome = data.incomes.reduce((sum, item) => {
    if (item.frequency === "monthly") return sum + item.amount;
    if (item.frequency === "bi-weekly") return sum + item.amount * 2.16;
    if (item.frequency === "weekly") return sum + item.amount * 4.33;
    if (item.frequency === "yearly") return sum + item.amount / 12;
    return sum + item.amount;
  }, 0);

  // Filter transactions for the selected month
  const monthTransactions = data.transactions.filter((tx) =>
    tx.date.startsWith(currentMonthPrefix)
  );

  // Total expenses (excluding pure savings deposits)
  const totalSpent = monthTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Total saved this month via savings deposits
  const totalSaved = monthTransactions
    .filter((tx) => tx.type === "savings_deposit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Total budgeted amount across all categories
  const totalBudgeted = data.categories.reduce(
    (sum, cat) => sum + cat.allocatedAmount,
    0
  );

  // Needs, Wants, Savings allocation vs actual
  const needsBudget = data.categories
    .filter((c) => c.type === "needs")
    .reduce((s, c) => s + c.allocatedAmount, 0);
  const wantsBudget = data.categories
    .filter((c) => c.type === "wants")
    .reduce((s, c) => s + c.allocatedAmount, 0);
  const savingsDebtBudget = data.categories
    .filter((c) => c.type === "savings" || c.type === "debt")
    .reduce((s, c) => s + c.allocatedAmount, 0);

  // Actual spending by type
  const categoryMap = new Map(data.categories.map((c) => [c.id, c]));

  let needsSpent = 0;
  let wantsSpent = 0;
  let savingsDebtSpent = 0;

  monthTransactions.forEach((tx) => {
    const cat = categoryMap.get(tx.categoryId);
    if (!cat) return;
    if (cat.type === "needs") needsSpent += tx.amount;
    else if (cat.type === "wants") wantsSpent += tx.amount;
    else if (cat.type === "savings" || cat.type === "debt")
      savingsDebtSpent += tx.amount;
  });

  // Calculate days remaining in current month for daily pacing
  const now = new Date();
  const year = parseInt(currentMonthPrefix.slice(0, 4), 10) || now.getFullYear();
  const month = parseInt(currentMonthPrefix.slice(5, 7), 10) || (now.getMonth() + 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);

  const remainingBudget = Math.max(0, totalBudgeted - totalSpent);
  const dailySafeToSpend = remainingBudget / daysRemaining;

  const netCashRemaining = totalIncome - totalSpent - totalSaved;
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalSaved + (totalIncome - totalSpent - totalSaved > 0 ? totalIncome - totalSpent - totalSaved : 0)) / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalBudgeted,
    totalSpent,
    totalSaved,
    remainingBudget,
    netCashRemaining,
    dailySafeToSpend,
    daysRemaining,
    daysInMonth,
    savingsRate,
    needsBudget,
    wantsBudget,
    savingsDebtBudget,
    needsSpent,
    wantsSpent,
    savingsDebtSpent,
    monthTransactions,
  };
}

export function calculateCategorySpent(
  categoryId: string,
  transactions: Transaction[],
  currentMonth: string
): number {
  return transactions
    .filter(
      (tx) =>
        tx.categoryId === categoryId &&
        tx.date.startsWith(currentMonth)
    )
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function calculateMemberFairShare(data: HouseholdData) {
  const currentMonthPrefix = data.currentMonth;
  const monthTxs = data.transactions.filter((tx) =>
    tx.date.startsWith(currentMonthPrefix) && tx.type === "expense"
  );

  const totalHouseholdIncome = data.members.reduce(
    (sum, m) => sum + (m.role !== "Shared" ? m.monthlyIncome : 0),
    0
  );

  const totalSharedSpent = monthTxs.reduce((sum, tx) => sum + tx.amount, 0);

  return data.members
    .filter((m) => m.role !== "Shared")
    .map((member) => {
      const incomePercent =
        totalHouseholdIncome > 0
          ? (member.monthlyIncome / totalHouseholdIncome) * 100
          : 50;

      // Expenses paid by this member
      const paidByMember = monthTxs
        .filter((tx) => tx.memberId === member.id)
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Fair share based on proportional income
      const fairShareAmount = (incomePercent / 100) * totalSharedSpent;
      const netBalance = paidByMember - fairShareAmount;

      return {
        member,
        incomePercent: Math.round(incomePercent),
        paidByMember,
        fairShareAmount,
        netBalance, // >0 means owed refund/credit, <0 means owes into shared fund
      };
    });
}

export function exportToCSV(transactions: Transaction[], data: HouseholdData): void {
  const catMap = new Map(data.categories.map((c) => [c.id, c.name]));
  const memMap = new Map(data.members.map((m) => [m.id, m.name]));

  const headers = ["Date", "Description", "Type", "Category", "Member", "Amount", "Payment Method", "Notes"];
  const rows = transactions.map((t) => [
    t.date,
    `"${(t.description || "").replace(/"/g, '""')}"`,
    t.type,
    `"${catMap.get(t.categoryId) || "Uncategorized"}"`,
    `"${memMap.get(t.memberId) || "Shared"}"`,
    t.amount.toFixed(2),
    t.paymentMethod,
    `"${(t.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `household_budget_${data.currentMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportBackupJSON(data: HouseholdData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `household_budget_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function fireConfettiCelebration(): void {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"],
    });
  } catch (e) {
    // Gracefully handle if canvas is restricted
  }
}
