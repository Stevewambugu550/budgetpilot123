import React, { useState } from "react";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  Scale,
  CheckCircle2,
  ArrowRight,
  Shield,
  Briefcase,
  Calendar,
} from "lucide-react";
import { HouseholdData, HouseholdMember, IncomeItem } from "../types";
import { formatCurrency, calculateMemberFairShare } from "../utils/budgetUtils";

interface HouseholdMembersManagerProps {
  data: HouseholdData;
  onUpdateData: (newData: HouseholdData) => void;
  onOpenQuickAdd: (type: "income") => void;
}

export const HouseholdMembersManager: React.FC<HouseholdMembersManagerProps> = ({
  data,
  onUpdateData,
  onOpenQuickAdd,
}) => {
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);
  const [isCreatingMember, setIsCreatingMember] = useState(false);

  // Member form state
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<any>("Partner");
  const [formIncome, setFormIncome] = useState<number>(3000);
  const [formColor, setFormColor] = useState("#3b82f6");

  const sym = data.currencySymbol;

  const fairShareReport = calculateMemberFairShare(data);
  const totalIncome = data.members.reduce(
    (sum, m) => sum + (m.role !== "Shared" ? m.monthlyIncome : 0),
    0
  );

  const handleOpenCreate = () => {
    setFormName("");
    setFormRole("Partner");
    setFormIncome(3000);
    setFormColor("#10b981");
    setIsCreatingMember(true);
    setEditingMember(null);
  };

  const handleOpenEdit = (m: HouseholdMember) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormRole(m.role);
    setFormIncome(m.monthlyIncome);
    setFormColor(m.color);
    setIsCreatingMember(false);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const initials = formName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    if (editingMember) {
      const updated = data.members.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              name: formName.trim(),
              role: formRole,
              monthlyIncome: Number(formIncome) || 0,
              color: formColor,
              avatarInitials: initials,
            }
          : m
      );
      onUpdateData({ ...data, members: updated });
      setEditingMember(null);
    } else {
      const newMember: HouseholdMember = {
        id: `mem-${Date.now()}`,
        name: formName.trim(),
        role: formRole,
        monthlyIncome: Number(formIncome) || 0,
        color: formColor,
        avatarInitials: initials,
      };
      onUpdateData({ ...data, members: [...data.members, newMember] });
      setIsCreatingMember(false);
    }
  };

  const handleDeleteMember = (id: string) => {
    if (data.members.length <= 1) {
      alert("At least one household member must remain.");
      return;
    }
    if (confirm("Delete this household member?")) {
      const updated = data.members.filter((m) => m.id !== id);
      onUpdateData({ ...data, members: updated });
      if (editingMember?.id === id) setEditingMember(null);
    }
  };

  const handleDeleteIncome = (id: string) => {
    if (confirm("Delete this income stream?")) {
      const updated = data.incomes.filter((i) => i.id !== id);
      onUpdateData({ ...data, incomes: updated });
    }
  };

  const memberColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Household Members & Fair-Share Split
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Total Household Net Income: <strong className="text-white">{formatCurrency(totalIncome, sym)}/mo</strong> across {data.members.filter(m => m.role !== "Shared").length} income contributors
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="add-income-stream-btn"
              onClick={() => onOpenQuickAdd("income")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Income Stream
            </button>

            <button
              id="add-member-btn"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Member
            </button>
          </div>
        </div>
      </div>

      {/* Proportional Split & Fair Share Settlement Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-teal-400" />
            <h3 className="font-semibold text-white text-sm">
              Equitable Proportional Expense Split ({data.currentMonth})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Split proportionally by income contribution
          </span>
        </div>

        <p className="text-xs text-slate-400">
          In a fair proportional budget, each partner contributes according to their percentage of total income.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fairShareReport.map(({ member, incomePercent, paidByMember, fairShareAmount, netBalance }) => {
            const isOwed = netBalance > 5;
            const owes = netBalance < -5;

            return (
              <div
                key={member.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.avatarInitials}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{member.name}</h4>
                        <span className="text-[11px] text-slate-400">{member.role}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 text-xs font-semibold">
                      {incomePercent}% of income
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Monthly Income:</span>
                      <strong className="text-white">{formatCurrency(member.monthlyIncome, sym)}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Expenses Paid:</span>
                      <span className="text-slate-200 font-semibold">{formatCurrency(paidByMember, sym)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Fair Target Share:</span>
                      <span className="text-slate-400">{formatCurrency(fairShareAmount, sym)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Balance:</span>
                    <span
                      className={`font-bold ${
                        isOwed
                          ? "text-emerald-400"
                          : owes
                          ? "text-amber-400"
                          : "text-slate-300"
                      }`}
                    >
                      {isOwed
                        ? `Owed ${formatCurrency(netBalance, sym)}`
                        : owes
                        ? `Owes ${formatCurrency(Math.abs(netBalance), sym)}`
                        : "Settled Even"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Household Members Directory */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">
            Household Profile Directory ({data.members.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-800">
          {data.members.map((m) => (
            <div
              key={m.id}
              className="p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{ backgroundColor: m.color }}
                >
                  {m.avatarInitials}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    {m.name}
                    {m.role === "Primary" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800">
                        Primary User
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Role: <span className="text-slate-300">{m.role}</span> • Income:{" "}
                    <strong className="text-emerald-400">{formatCurrency(m.monthlyIncome, sym)}/mo</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(m)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit Member"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {m.role !== "Primary" && m.role !== "Shared" && (
                  <button
                    onClick={() => handleDeleteMember(m.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income Streams Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-400" />
            Recurring Income Streams ({data.incomes.length})
          </h3>
          <button
            onClick={() => onOpenQuickAdd("income")}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            + Add Stream
          </button>
        </div>

        <div className="divide-y divide-slate-800">
          {data.incomes.map((inc) => {
            const member = data.members.find((m) => m.id === inc.memberId);
            return (
              <div
                key={inc.id}
                className="p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-white text-sm">{inc.sourceName}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="text-slate-300">{member?.name || "Shared"}</span>
                    <span>•</span>
                    <span className="capitalize">{inc.frequency}</span>
                    {inc.notes && (
                      <>
                        <span>•</span>
                        <span className="text-slate-500">{inc.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">
                      +{formatCurrency(inc.amount, sym)}
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize">{inc.frequency}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteIncome(inc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {(isCreatingMember || editingMember) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-3">
              {editingMember ? "Edit Household Member" : "Add Household Member"}
            </h3>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Name</label>
                <input
                  id="member-name-input"
                  type="text"
                  required
                  placeholder="e.g. Jordan, Sam, Roommate"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                  <select
                    id="member-role-select"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Primary">Primary User</option>
                    <option value="Partner">Partner / Spouse</option>
                    <option value="Roommate">Roommate</option>
                    <option value="Family">Family Member</option>
                    <option value="Shared">Shared Household</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Monthly Income ({sym})
                  </label>
                  <input
                    id="member-income-input"
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={formIncome}
                    onChange={(e) => setFormIncome(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Avatar Color</label>
                <div className="flex gap-2">
                  {memberColors.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFormColor(col)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formColor === col ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingMember(false);
                    setEditingMember(null);
                  }}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="submit-member-btn"
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                >
                  {editingMember ? "Save Changes" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
