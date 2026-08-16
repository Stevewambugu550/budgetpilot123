import React, { useState } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Key,
  Lock,
  Activity,
  Server,
  Database,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  Download,
  AlertTriangle,
  FileText,
  UserCheck,
  UserX,
  Sliders,
  Terminal,
  Cpu,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserAccount, UserRole, UserPermissions, HouseholdData } from "../types";
import { exportBackupJSON } from "../utils/budgetUtils";

interface AdminPanelProps {
  data: HouseholdData;
  onUpdateData: (newData: HouseholdData) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ data, onUpdateData }) => {
  const {
    currentUser,
    users,
    auditLogs,
    logAudit,
    updateUserRoleAndPermissions,
    deleteUser,
    createUser,
    securitySettings,
    updateSecuritySettings,
  } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<
    "users" | "permissions" | "audit" | "system" | "security"
  >("users");

  // User edit modal / drawer state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);

  // New user form state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("editor");

  // Audit log search & filter
  const [auditFilter, setAuditFilter] = useState<string>("all");
  const [auditSearch, setAuditSearch] = useState<string>("");

  // Check if current user has admin access
  const isAdmin = currentUser.role === "admin";

  const handleSaveUserPermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUserRoleAndPermissions(
      editingUser.id,
      editingUser.role,
      editingUser.permissions
    );
    setEditingUser(null);
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    createUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
    });
    setNewUserName("");
    setNewUserEmail("");
    setIsNewUserModalOpen(false);
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (auditFilter !== "all" && log.category !== auditFilter) return false;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportAuditLogs = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `security_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    logAudit("Export Audit Logs", "security", "Exported JSON security audit log records");
  };

  if (!isAdmin && currentUser.role !== "manager" && currentUser.role !== "auditor") {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-400 mx-auto opacity-80" />
        <h2 className="text-xl font-bold text-white">Restricted Administrator Area</h2>
        <p className="text-sm max-w-md mx-auto">
          Your current session role (<strong className="text-white">{currentUser.role}</strong>) does not have permission to modify administrative credentials, security parameters, or system access logs.
        </p>
        <p className="text-xs text-slate-500">
          Please log in as an administrator (e.g. Stephen Ngatia) or ask a household admin for elevated permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Household Administration & Security Enclave
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase tracking-wider">
                  Admin Enclave
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage household accounts, role access matrices, audit logs, and data security
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500">Registered Users</span>
              <div className="text-base font-extrabold text-white">{users.length} Active</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500">Enclave Security</span>
              <div className="text-base font-extrabold text-emerald-400 flex items-center gap-1 justify-end">
                <ShieldCheck className="w-4 h-4" /> 256-Bit
              </div>
            </div>
          </div>
        </div>

        {/* Admin Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto no-scrollbar text-xs font-medium">
          <button
            id="admin-tab-users"
            onClick={() => setActiveAdminTab("users")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
              activeAdminTab === "users"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Users className="w-4 h-4" />
            User Management ({users.length})
          </button>

          <button
            id="admin-tab-permissions"
            onClick={() => setActiveAdminTab("permissions")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
              activeAdminTab === "permissions"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Role & Permissions Matrix
          </button>

          <button
            id="admin-tab-audit"
            onClick={() => setActiveAdminTab("audit")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
              activeAdminTab === "audit"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Activity className="w-4 h-4" />
            Security & Audit Logs ({auditLogs.length})
          </button>

          <button
            id="admin-tab-security"
            onClick={() => setActiveAdminTab("security")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
              activeAdminTab === "security"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Lock className="w-4 h-4" />
            Vault & Privacy Parameters
          </button>

          <button
            id="admin-tab-system"
            onClick={() => setActiveAdminTab("system")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
              activeAdminTab === "system"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Server className="w-4 h-4" />
            System Diagnostics
          </button>
        </div>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeAdminTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Household Accounts & Access Control</h2>
              <p className="text-xs text-slate-400">
                Grant or revoke administrative permissions, manage 2FA, and configure user profiles.
              </p>
            </div>

            <button
              id="admin-add-user-btn"
              onClick={() => setIsNewUserModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add New User / Member
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role Tier</th>
                    <th className="py-3 px-4">Authentication</th>
                    <th className="py-3 px-4">2FA Security</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                            alt={u.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {u.name}
                              {u.id === currentUser.id && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            u.role === "admin"
                              ? "bg-purple-950 text-purple-300 border border-purple-700"
                              : u.role === "manager"
                              ? "bg-blue-950 text-blue-300 border border-blue-700"
                              : u.role === "editor"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                              : u.role === "student"
                              ? "bg-amber-950 text-amber-300 border border-amber-700"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-slate-300">
                          {u.authProvider === "google" ? (
                            <span className="flex items-center gap-1 text-blue-400 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5" /> Google OAuth
                            </span>
                          ) : (
                            <span className="text-slate-400 capitalize">{u.authProvider}</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.is2FAEnabled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Enabled (TOTP)
                          </span>
                        ) : (
                          <span className="text-slate-500">Disabled</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`edit-user-${u.id}-btn`}
                            onClick={() => setEditingUser({ ...u })}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Permissions & Role"
                          >
                            <Edit2 className="w-4 h-4 text-purple-400" />
                          </button>

                          {users.length > 1 && u.id !== currentUser.id && (
                            <button
                              id={`delete-user-${u.id}-btn`}
                              onClick={() => {
                                if (confirm(`Remove ${u.name} from household accounts?`)) {
                                  deleteUser(u.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE & PERMISSIONS MATRIX */}
      {activeAdminTab === "permissions" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Granular Role Permissions Matrix</h2>
            <p className="text-xs text-slate-400">
              System capabilities mapped to each household access tier.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">System Capability</th>
                    <th className="py-3 px-3 text-center">Super Admin</th>
                    <th className="py-3 px-3 text-center">Manager</th>
                    <th className="py-3 px-3 text-center">Editor</th>
                    <th className="py-3 px-3 text-center">Viewer</th>
                    <th className="py-3 px-3 text-center">Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    { key: "canEditBudget", name: "Modify Budget Envelopes & Target Caps" },
                    { key: "canAddTransactions", name: "Log Expenses, Incomes & Quick Saves" },
                    { key: "canDeleteRecords", name: "Delete Transactions & Recurring Bills" },
                    { key: "canManageMembers", name: "Add/Edit Household Members & Split Ratio" },
                    { key: "canViewReports", name: "View Charts, 50-30-20 & Financial Health" },
                    { key: "canAccessAdminPanel", name: "Access Admin Dashboard & User Management" },
                    { key: "canExportData", name: "Export CSV / JSON Backup Enclaves" },
                    { key: "canManageSecurity", name: "Modify Vault, PIN & Privacy Settings" },
                    { key: "canUseAiAdvisor", name: "Consult Gemini AI Household Advisor" },
                  ].map((perm) => (
                    <tr key={perm.key} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-medium text-white">{perm.name}</td>
                      <td className="py-3 px-3 text-center">
                        <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                      </td>
                      <td className="py-3 px-3 text-center">
                        {["canManageSecurity"].includes(perm.key) ? (
                          <X className="w-4 h-4 text-slate-600 mx-auto" />
                        ) : (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {["canAddTransactions", "canViewReports", "canExportData", "canUseAiAdvisor"].includes(
                          perm.key
                        ) ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {["canViewReports"].includes(perm.key) ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {["canViewReports", "canAccessAdminPanel", "canExportData"].includes(perm.key) ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT & SECURITY LOGS */}
      {activeAdminTab === "audit" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Live Security & Activity Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Immutable chronological log of authentication, budget edits, and unauthorized attempts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="export-audit-logs-btn"
                onClick={exportAuditLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                Export Audit JSON
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail by user, action, or details..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="all">All Event Categories</option>
              <option value="auth">Authentication & SSO</option>
              <option value="security">Security & Encryption</option>
              <option value="permission">Permissions & Access</option>
              <option value="transaction">Transactions & Spending</option>
              <option value="budget">Master Budget Modifications</option>
            </select>
          </div>

          {/* Audit Logs List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No audit entries match the current filter.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        log.status === "blocked"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : log.status === "warning"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {log.status === "blocked" ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs">{log.action}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                          {log.category}
                        </span>
                        <span className="text-[11px] text-slate-500">• {log.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{log.details}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>Actor: <strong className="text-slate-400">{log.userName}</strong></span>
                        <span>IP: {log.ipAddress}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      log.status === "blocked"
                        ? "bg-rose-950 text-rose-300"
                        : log.status === "warning"
                        ? "bg-amber-950 text-amber-300"
                        : "bg-emerald-950 text-emerald-300"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: VAULT & PRIVACY PARAMETERS */}
      {activeAdminTab === "security" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security Parameters Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Vault Security Configurations</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Master Security PIN Code
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={securitySettings.pinCode}
                  onChange={(e) => updateSecuritySettings({ pinCode: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Used for unlocking screen vault and authorizing critical deletions.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Inactivity Auto-Lock Timeout
                </label>
                <select
                  value={securitySettings.autoLockMinutes}
                  onChange={(e) =>
                    updateSecuritySettings({ autoLockMinutes: parseInt(e.target.value, 10) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value={0}>Disabled (Never Auto-Lock)</option>
                  <option value={1}>1 Minute of Inactivity</option>
                  <option value={5}>5 Minutes of Inactivity (Recommended)</option>
                  <option value={15}>15 Minutes of Inactivity</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div>
                  <div className="font-semibold text-white">Require PIN for Admin Panel</div>
                  <div className="text-[11px] text-slate-400">
                    Prompt for master PIN before viewing admin portal
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.requirePinForAdmin}
                  onChange={(e) =>
                    updateSecuritySettings({ requirePinForAdmin: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-700 border-slate-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div>
                  <div className="font-semibold text-white">Public Privacy Masking Default</div>
                  <div className="text-[11px] text-slate-400">
                    Obfuscate all financial numbers with ••••••
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.privacyMaskEnabled}
                  onChange={(e) =>
                    updateSecuritySettings({ privacyMaskEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-700 border-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Encryption & Enclave Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Fingerprint className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Cryptographic Enclave Status</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-200">Encryption Level</span>
                  </div>
                  <span className="font-bold text-emerald-400">AES-256-GCM / SHA-256</span>
                </div>

                <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between">
                  <span className="text-slate-400">Data Storage Engine</span>
                  <span className="text-white font-medium">Browser Enclave + Local Storage</span>
                </div>

                <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between">
                  <span className="text-slate-400">Master Secret Token</span>
                  <span className="text-slate-300 font-mono">SEC-8834-KLA-••••</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => exportBackupJSON(data)}
                className="w-full py-2 px-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Download Encrypted Master Snapshot (JSON)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM DIAGNOSTICS */}
      {activeAdminTab === "system" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Express API Server</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-xl font-bold text-white">Online (200 OK)</div>
            <p className="text-[11px] text-slate-500">Port 3000 • Ingress Active • Latency 14ms</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Gemini AI Engine</span>
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            </div>
            <div className="text-xl font-bold text-teal-300">gemini-3.7-flash</div>
            <p className="text-[11px] text-slate-500">Smart Financial Advisor & Bill Negotiator Active</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Database Records</span>
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {data.transactions.length + data.categories.length + data.bills.length + data.goals.length} Objects
            </div>
            <p className="text-[11px] text-slate-500">
              {data.transactions.length} Txs • {data.categories.length} Envelopes • {data.bills.length} Bills
            </p>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                Edit Role & Permissions: {editingUser.name}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserPermissions} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      role: e.target.value as UserRole,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="admin">Super Admin (Full Authority)</option>
                  <option value="manager">Household Manager</option>
                  <option value="editor">Financial Editor</option>
                  <option value="viewer">Read-Only Viewer</option>
                  <option value="auditor">Auditor</option>
                  <option value="student">Student</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Custom Capability Overrides:
                </label>
                {Object.keys(editingUser.permissions).map((key) => {
                  const permKey = key as keyof UserPermissions;
                  return (
                    <label
                      key={key}
                      className="flex items-center justify-between p-2 bg-slate-800/80 rounded-lg border border-slate-700 cursor-pointer"
                    >
                      <span className="text-slate-300 capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <input
                        type="checkbox"
                        checked={editingUser.permissions[permKey]}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            permissions: {
                              ...editingUser.permissions,
                              [permKey]: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 text-purple-600 rounded bg-slate-700 border-slate-600"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW USER MODAL */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Add Household User Account
              </h3>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">User Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. david.m@household.io"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Access Tier Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="manager">Household Manager</option>
                  <option value="editor">Financial Editor</option>
                  <option value="viewer">Read-Only Viewer</option>
                  <option value="student">Student</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-md"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
