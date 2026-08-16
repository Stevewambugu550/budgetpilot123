import React, { useState, useEffect } from "react";
import { DEFAULT_HOUSEHOLD_DATA } from "./data/initialData";
import { HouseholdData } from "./types";
import { loadHouseholdData, saveHouseholdData } from "./utils/budgetUtils";
import { HeaderNavbar, NavTabType } from "./components/HeaderNavbar";
import { HouseholdSummary } from "./components/HouseholdSummary";
import { CategoryBudgetManager } from "./components/CategoryBudgetManager";
import { TransactionTracker } from "./components/TransactionTracker";
import { RecurringBillsManager } from "./components/RecurringBillsManager";
import { SavingsGoalsTracker } from "./components/SavingsGoalsTracker";
import { CompoundSimulator } from "./components/CompoundSimulator";
import { HouseholdMembersManager } from "./components/HouseholdMembersManager";
import { AiSavingsAdvisor } from "./components/AiSavingsAdvisor";
import { QuickAddModal } from "./components/QuickAddModal";
import { AdminPanel } from "./components/AdminPanel";
import { TransactionVisuals } from "./components/TransactionVisuals";
import { AuthModal } from "./components/AuthModal";
import { UserProfileModal } from "./components/UserProfileModal";
import { MobileAppSimulator } from "./components/MobileAppSimulator";
import { SecurityLockScreen } from "./components/SecurityLockScreen";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { currentUser, isAppLocked, isLoggedIn } = useAuth();

  const [data, setData] = useState<HouseholdData>(() =>
    loadHouseholdData(DEFAULT_HOUSEHOLD_DATA)
  );

  const [activeTab, setActiveTab] = useState<NavTabType>("overview");
  const [selectedMemberId, setSelectedMemberId] = useState<string | "all">("all");

  // Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<
    "expense" | "income" | "savings_deposit" | "bill" | "goal"
  >("expense");
  const [quickAddCategoryId, setQuickAddCategoryId] = useState<string | undefined>(undefined);

  // Auth & Mobile Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileSimulatorOpen, setIsMobileSimulatorOpen] = useState(false);

  // Auto-save to LocalStorage whenever data changes
  useEffect(() => {
    saveHouseholdData(data);
  }, [data]);

  const handleUpdateData = (newData: HouseholdData) => {
    setData(newData);
  };

  const handleResetData = () => {
    setData(DEFAULT_HOUSEHOLD_DATA);
    saveHouseholdData(DEFAULT_HOUSEHOLD_DATA);
  };

  const handleOpenQuickAdd = (
    type: "expense" | "income" | "savings_deposit" | "bill" | "goal",
    categoryId?: string
  ) => {
    setQuickAddType(type);
    setQuickAddCategoryId(categoryId);
    setIsQuickAddOpen(true);
  };

  // Access gate: nothing about the app is rendered until an approved
  // account has signed in. Access is invite-only (see AuthContext).
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <AuthModal isOpen={true} onClose={() => {}} dismissible={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Security Lock Screen Overlay */}
      <SecurityLockScreen />

      {/* Sticky Top Navigation Bar */}
      <HeaderNavbar
        data={data}
        onUpdateData={handleUpdateData}
        selectedMemberId={selectedMemberId}
        onSelectMemberId={setSelectedMemberId}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenQuickAdd={handleOpenQuickAdd}
        onResetData={handleResetData}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenMobileSimulator={() => setIsMobileSimulatorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" && (
          <HouseholdSummary
            data={data}
            onSelectTab={setActiveTab}
            onOpenQuickAdd={handleOpenQuickAdd}
          />
        )}

        {activeTab === "visuals" && (
          <TransactionVisuals
            data={data}
            onSelectCategory={(catId) => {
              setActiveTab("categories");
            }}
          />
        )}

        {activeTab === "categories" && (
          <CategoryBudgetManager
            data={data}
            onUpdateData={handleUpdateData}
            onOpenQuickAdd={handleOpenQuickAdd}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionTracker
            data={data}
            onUpdateData={handleUpdateData}
            onOpenQuickAdd={handleOpenQuickAdd}
          />
        )}

        {activeTab === "bills" && (
          <RecurringBillsManager
            data={data}
            onUpdateData={handleUpdateData}
            onOpenQuickAdd={handleOpenQuickAdd}
          />
        )}

        {activeTab === "goals" && (
          <SavingsGoalsTracker data={data} onUpdateData={handleUpdateData} />
        )}

        {activeTab === "simulator" && <CompoundSimulator data={data} />}

        {activeTab === "members" && (
          <HouseholdMembersManager
            data={data}
            onUpdateData={handleUpdateData}
            onOpenQuickAdd={handleOpenQuickAdd}
          />
        )}

        {activeTab === "advisor" && <AiSavingsAdvisor data={data} />}

        {activeTab === "admin" && (
          <AdminPanel data={data} onUpdateData={handleUpdateData} />
        )}
      </main>

      {/* Unified Fast Transaction Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        initialType={quickAddType}
        initialCategoryId={quickAddCategoryId}
        data={data}
        onClose={() => setIsQuickAddOpen(false)}
        onUpdateData={handleUpdateData}
      />

      {/* Auth Modal (Login / Sign Up / Google OAuth) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* User Profile & 2FA Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenAuthModal={() => {
          setIsProfileModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Interactive Mobile Phone App Simulator & PWA Install Modal */}
      <MobileAppSimulator
        isOpen={isMobileSimulatorOpen}
        onClose={() => setIsMobileSimulatorOpen(false)}
        data={data}
        onUpdateData={handleUpdateData}
        onOpenQuickAdd={handleOpenQuickAdd}
      />

      {/* Professional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>BudgetPilot Security Enclave (AES-256)</span>
            <span className="text-slate-500">•</span>
            <span>Logged in as: <strong className="text-slate-300">{currentUser.name}</strong> ({currentUser.role})</span>
          </div>
          <span>Zero-Based Budgeting • 50/30/20 Rule • AI Receipt Optical Scanner</span>
        </div>
      </footer>
    </div>
  );
}

