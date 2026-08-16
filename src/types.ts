export type CategoryType = "needs" | "wants" | "savings" | "debt";

export type FrequencyType = "monthly" | "bi-weekly" | "weekly" | "yearly" | "irregular";

export type PaymentMethod = "Card" | "Debit" | "Cash" | "Bank Transfer" | "Mobile Money" | "Other";

export type UserRole = "admin" | "manager" | "editor" | "viewer" | "auditor";

export interface UserPermissions {
  canEditBudget: boolean;
  canAddTransactions: boolean;
  canDeleteRecords: boolean;
  canManageMembers: boolean;
  canViewReports: boolean;
  canAccessAdminPanel: boolean;
  canExportData: boolean;
  canManageSecurity: boolean;
  canUseAiAdvisor: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  authProvider: "google" | "email" | "demo";
  is2FAEnabled: boolean;
  twoFactorSecret?: string;
  pinCode?: string;
  createdAt: string;
  lastLogin: string;
  permissions: UserPermissions;
  householdMemberId?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  category: "auth" | "permission" | "transaction" | "budget" | "security" | "system";
  details: string;
  ipAddress: string;
  status: "success" | "warning" | "blocked";
}

export interface SecuritySettings {
  privacyMaskEnabled: boolean;
  isAppLocked: boolean;
  autoLockMinutes: number; // 0 for off, 2, 5, 15
  requirePinForAdmin: boolean;
  pinCode: string;
  twoFactorEnabled: boolean;
  encryptionLevel: "AES-256-GCM" | "End-to-End Vault";
  sessionTimeoutHours: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "warning" | "success" | "security";
  read: boolean;
}

export interface HouseholdMember {
  id: string;
  name: string;
  role: "Primary" | "Partner" | "Roommate" | "Family" | "Shared";
  color: string;
  avatarInitials: string;
  monthlyIncome: number;
  email?: string;
}

export interface IncomeItem {
  id: string;
  memberId: string;
  sourceName: string;
  amount: number;
  frequency: FrequencyType;
  date: string;
  notes?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  iconName: string;
  type: CategoryType;
  allocatedAmount: number;
  color: string;
  isEssential: boolean;
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: "expense" | "income" | "savings_deposit";
  categoryId: string;
  memberId: string;
  description: string;
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
  notes?: string;
  payee?: string;
  receiptUrl?: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  frequency: "monthly" | "quarterly" | "yearly";
  categoryId: string;
  memberId: string;
  isPaidThisMonth: boolean;
  autoPay: boolean;
  notes?: string;
  serviceCategory?: "Utilities" | "Housing" | "Streaming & Media" | "Insurance" | "Software" | "Gym & Health" | "Other";
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: "Emergency" | "Debt Payoff" | "Vacation" | "Home" | "Vehicle" | "Retirement" | "Education" | "Custom";
  color: string;
  notes?: string;
  iconName: string;
}

export interface HouseholdData {
  members: HouseholdMember[];
  incomes: IncomeItem[];
  categories: BudgetCategory[];
  transactions: Transaction[];
  bills: RecurringBill[];
  goals: SavingsGoal[];
  currencySymbol: string;
  currentMonth: string; // "YYYY-MM"
  budgetModel: "50-30-20" | "zero-based" | "custom";
}

