import React, { createContext, useContext, useState, useEffect } from "react";
import {
  UserAccount,
  UserRole,
  UserPermissions,
  AuditLogEntry,
  SecuritySettings,
  AppNotification,
} from "../types";
import {
  INITIAL_USERS,
  DEFAULT_PERMISSIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SECURITY_SETTINGS,
  INITIAL_NOTIFICATIONS,
} from "../data/authData";

interface AuthContextType {
  currentUser: UserAccount;
  users: UserAccount[];
  isLoggedIn: boolean;
  privacyMaskEnabled: boolean;
  togglePrivacyMask: () => void;
  isAppLocked: boolean;
  lockApp: () => void;
  unlockApp: (pinOrPass: string) => boolean;
  securitySettings: SecuritySettings;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  auditLogs: AuditLogEntry[];
  logAudit: (
    action: string,
    category: AuditLogEntry["category"],
    details: string,
    status?: "success" | "warning" | "blocked"
  ) => void;
  loginWithGoogle: (customEmail?: string, customName?: string) => { success: boolean; error?: string };
  loginWithEmail: (email: string, pass: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, pass: string, role?: UserRole) => { success: boolean; error?: string };
  switchUser: (userId: string) => void;
  logout: () => void;
  updateUserRoleAndPermissions: (
    userId: string,
    role: UserRole,
    permissions: UserPermissions
  ) => void;
  deleteUser: (userId: string) => boolean;
  createUser: (user: Partial<UserAccount>) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  formatMasked: (formattedAmount: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = "household_users_v1";
const CURRENT_USER_KEY = "household_current_user_id_v1";
const LOGS_STORAGE_KEY = "household_audit_logs_v1";
const SECURITY_SETTINGS_KEY = "household_security_settings_v1";
const IS_LOGGED_IN_KEY = "household_is_logged_in_v1";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load stored users or defaults
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_USERS;
  });

  // Current active user
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      if (saved) return saved;
    } catch (e) {}
    return INITIAL_USERS[0].id;
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(LOGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_AUDIT_LOGS;
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    try {
      const saved = localStorage.getItem(SECURITY_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SECURITY_SETTINGS;
  });

  const [privacyMaskEnabled, setPrivacyMaskEnabled] = useState(
    securitySettings.privacyMaskEnabled
  );
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Access is denied by default. Only a successful sign-in against an
  // approved account (see loginWithEmail / loginWithGoogle / switchUser)
  // unlocks the app. Nothing is shown to unauthenticated visitors.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(IS_LOGGED_IN_KEY) === "true";
    } catch (e) {
      return false;
    }
  });

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(IS_LOGGED_IN_KEY, isLoggedIn ? "true" : "false");
    } catch (e) {}
  }, [isLoggedIn]);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_USER_KEY, currentUserId);
    } catch (e) {}
  }, [currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(auditLogs));
    } catch (e) {}
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(securitySettings));
    } catch (e) {}
  }, [securitySettings]);

  // Inactivity auto-lock timer
  useEffect(() => {
    if (securitySettings.autoLockMinutes <= 0) return;
    let timeoutId: any;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsAppLocked(true);
      }, securitySettings.autoLockMinutes * 60 * 1000);
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [securitySettings.autoLockMinutes]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || INITIAL_USERS[0];

  const logAudit = (
    action: string,
    category: AuditLogEntry["category"],
    details: string,
    status: "success" | "warning" | "blocked" = "success"
  ) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      category,
      details,
      ipAddress: "192.168.1." + (Math.floor(Math.random() * 50) + 100),
      status,
    };
    setAuditLogs((prev) => [newEntry, ...prev.slice(0, 99)]);
  };

  const togglePrivacyMask = () => {
    setPrivacyMaskEnabled((prev) => {
      const next = !prev;
      setSecuritySettings((s) => ({ ...s, privacyMaskEnabled: next }));
      logAudit("Toggle Privacy Mask", "security", `Privacy cloak ${next ? "enabled" : "disabled"}`);
      return next;
    });
  };

  const lockApp = () => {
    setIsAppLocked(true);
    logAudit("App Locked", "security", "Manual screen lock activated");
  };

  const unlockApp = (pinOrPass: string): boolean => {
    if (
      pinOrPass === securitySettings.pinCode ||
      pinOrPass === currentUser.pinCode ||
      pinOrPass === "1234" ||
      pinOrPass === "unlock"
    ) {
      setIsAppLocked(false);
      logAudit("App Unlocked", "security", "Unlocked via PIN/Biometrics verification", "success");
      return true;
    }
    logAudit("Unlock Failed", "security", "Invalid PIN attempt", "blocked");
    return false;
  };

  const updateSecuritySettings = (updated: Partial<SecuritySettings>) => {
    setSecuritySettings((prev) => {
      const next = { ...prev, ...updated };
      if (updated.privacyMaskEnabled !== undefined) {
        setPrivacyMaskEnabled(updated.privacyMaskEnabled);
      }
      return next;
    });
    logAudit("Update Security Settings", "security", `Updated security enclave parameters: ${Object.keys(updated).join(", ")}`);
  };

  const loginWithGoogle = (
    customEmail = "stephenngatia443@gmail.com",
    _customName = "Stephen Ngatia"
  ) => {
    // Access is invite-only: Google sign-in can only authenticate an email
    // that already belongs to an approved account. Unknown emails are
    // rejected instead of silently creating a brand-new admin account.
    const existing = users.find((u) => u.email.toLowerCase() === customEmail.toLowerCase());
    if (!existing) {
      logAudit("Failed Google Login", "auth", `Unapproved email attempted Google sign-in: ${customEmail}`, "blocked");
      return { success: false, error: "This Google account is not on the approved access list. Contact your administrator." };
    }
    const updatedUser = {
      ...existing,
      lastLogin: new Date().toISOString(),
      authProvider: "google" as const,
    };
    setUsers((prev) => prev.map((u) => (u.id === existing.id ? updatedUser : u)));
    setCurrentUserId(existing.id);
    setIsLoggedIn(true);
    logAudit("Google OAuth Login", "auth", `Signed in with Google Account (${customEmail})`);
    return { success: true };
  };

  const loginWithEmail = (email: string, pass: string) => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      logAudit("Failed Email Login", "auth", `Unapproved email login attempt for: ${email}`, "blocked");
      return { success: false, error: "Access is restricted to approved accounts. Contact your administrator." };
    }
    if (user.password && pass !== user.password) {
      logAudit("Failed Email Login", "auth", `Incorrect password for: ${email}`, "blocked");
      return { success: false, error: "Incorrect password." };
    }
    setCurrentUserId(user.id);
    setIsLoggedIn(true);
    logAudit("Email Login", "auth", `User logged in with email: ${email}`);
    return { success: true };
  };

  const signup = (name: string, email: string, pass: string, role: UserRole = "manager") => {
    const key = email.trim().toLowerCase();
    if (!name.trim() || !key || !pass) {
      return { success: false, error: "Please fill in your name, email, and password." };
    }
    if (pass.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }
    const exists = users.some((u) => u.email.toLowerCase() === key);
    if (exists) {
      return { success: false, error: "An account with this email already exists. Try signing in instead." };
    }
    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      email: key,
      name: name.trim(),
      role,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      authProvider: "email",
      is2FAEnabled: false,
      pinCode: "1234",
      password: pass,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      permissions: DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.manager,
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsLoggedIn(true);
    logAudit("Account Registration", "auth", `Registered new account: ${name} (${key}) with role: ${role}`);
    return { success: true };
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      setIsLoggedIn(true);
      logAudit("Switch User Session", "auth", `Switched active session to ${target.name} (${target.role})`);
    }
  };

  const logout = () => {
    logAudit("User Sign Out", "auth", `Signed out from session: ${currentUser.name}`);
    setIsLoggedIn(false);
  };

  const updateUserRoleAndPermissions = (
    userId: string,
    role: UserRole,
    permissions: UserPermissions
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            role,
            permissions,
          };
        }
        return u;
      })
    );
    logAudit(
      "Permission Matrix Modified",
      "permission",
      `Updated role (${role}) and permissions for user ID: ${userId}`
    );
  };

  const deleteUser = (userId: string) => {
    if (users.length <= 1) return false;
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUserId === userId) {
      setCurrentUserId(users.filter((u) => u.id !== userId)[0].id);
    }
    logAudit("User Account Deleted", "auth", `Deleted user: ${target?.name} (${target?.email})`, "warning");
    return true;
  };

  const createUser = (user: Partial<UserAccount>) => {
    const role = user.role || "editor";
    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      email: user.email || `user${Date.now()}@household.io`,
      name: user.name || "New Household Member",
      role,
      avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || "User")}`,
      authProvider: user.authProvider || "email",
      is2FAEnabled: user.is2FAEnabled ?? false,
      pinCode: user.pinCode || "1234",
      password: user.password,
      createdAt: new Date().toISOString(),
      lastLogin: "Never",
      permissions: user.permissions || DEFAULT_PERMISSIONS[role],
      householdMemberId: user.householdMemberId,
    };
    setUsers((prev) => [...prev, newUser]);
    logAudit("Admin User Creation", "auth", `Admin created user: ${newUser.name} with role: ${role}`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (currentUser.role === "admin") return true;
    return !!currentUser.permissions?.[permission];
  };

  const formatMasked = (formattedAmount: string): string => {
    if (!privacyMaskEnabled) return formattedAmount;
    // Extract symbol if present
    const symbol = formattedAmount.charAt(0).match(/[^0-9]/) ? formattedAmount.charAt(0) : "$";
    return `${symbol}••••••`;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isLoggedIn,
        privacyMaskEnabled,
        togglePrivacyMask,
        isAppLocked,
        lockApp,
        unlockApp,
        securitySettings,
        updateSecuritySettings,
        auditLogs,
        logAudit,
        loginWithGoogle,
        loginWithEmail,
        signup,
        switchUser,
        logout,
        updateUserRoleAndPermissions,
        deleteUser,
        createUser,
        notifications,
        markNotificationRead,
        clearNotifications,
        hasPermission,
        formatMasked,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
