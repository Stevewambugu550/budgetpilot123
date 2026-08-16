import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Crown,
  Briefcase,
  PenLine,
  ClipboardList,
  GraduationCap,
  Wallet,
  TrendingUp,
  Sparkles,
  LineChart,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserAccount, UserRole } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup" | "personas";
  /** When false, renders as a full-page gate instead of a small dismissible modal. */
  dismissible?: boolean;
}

const ROLE_META: Record<UserRole, { label: string; icon: React.ElementType; badge: string }> = {
  admin: { label: "Super Admin", icon: Crown, badge: "bg-purple-950 text-purple-300 border border-purple-800" },
  manager: { label: "Manager", icon: Briefcase, badge: "bg-blue-950 text-blue-300 border border-blue-800" },
  editor: { label: "Editor", icon: PenLine, badge: "bg-emerald-950 text-emerald-300 border border-emerald-800" },
  viewer: { label: "Viewer", icon: Eye, badge: "bg-slate-800 text-slate-300 border border-slate-700" },
  auditor: { label: "Auditor", icon: ClipboardList, badge: "bg-cyan-950 text-cyan-300 border border-cyan-800" },
  student: { label: "Student", icon: GraduationCap, badge: "bg-amber-950 text-amber-300 border border-amber-800" },
};

const FEATURES = [
  { icon: Wallet, text: "Zero-based envelope budgeting" },
  { icon: TrendingUp, text: "Savings goals & compound growth simulator" },
  { icon: Sparkles, text: "AI-powered savings advisor" },
  { icon: LineChart, text: "Real-time spending visuals & reports" },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = "signin",
  dismissible = true,
}) => {
  const { users, loginWithGoogle, loginWithEmail, signup } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup" | "personas">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("editor");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [customGoogleEmail, setCustomGoogleEmail] = useState("stephenngatia443@gmail.com");
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);

  if (!isOpen) return null;

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const res = loginWithEmail(email, password);
      setIsLoading(false);
      if (res.success) {
        setSuccessMessage("Signed in successfully!");
        setTimeout(() => onClose(), 500);
      } else {
        setErrorMessage(res.error || "Login failed.");
      }
    }, 350);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!name || !email || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const res = signup(name, email, password, role);
      setIsLoading(false);
      if (res.success) {
        setSuccessMessage("Account created! Signing you in...");
        setTimeout(() => onClose(), 500);
      } else {
        setErrorMessage(res.error || "Signup failed.");
      }
    }, 350);
  };

  const handleGoogleClick = (googleEmail: string, googleName?: string) => {
    setErrorMessage("");
    setIsLoading(true);
    setTimeout(() => {
      const res = loginWithGoogle(googleEmail, googleName);
      setIsLoading(false);
      if (res.success) {
        setSuccessMessage(`Connected as ${googleEmail}`);
        setTimeout(() => onClose(), 500);
      } else {
        setErrorMessage(res.error || "Google sign-in failed.");
      }
    }, 400);
  };

  // Quick Access only autofills the email — it never bypasses the password
  // check, so the approved-accounts allowlist stays enforced either way.
  const handleQuickFill = (user: UserAccount) => {
    setEmail(user.email);
    setPassword("");
    setErrorMessage("");
    setSuccessMessage(`Email filled for ${user.name}. Enter their password to continue.`);
    setTab("signin");
  };

  const grouped: { title: string; users: UserAccount[] }[] = [
    { title: "Administrator", users: users.filter((u) => u.role === "admin") },
    { title: "Household Team", users: users.filter((u) => ["manager", "editor", "viewer", "auditor"].includes(u.role)) },
    { title: "Students", users: users.filter((u) => u.role === "student") },
  ].filter((g) => g.users.length > 0);

  const errorBanner = errorMessage && (
    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-shake">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{errorMessage}</span>
    </div>
  );

  const successBanner = successMessage && (
    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      <span>{successMessage}</span>
    </div>
  );

  const tabSelector = (
    <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
      <button
        id="tab-signin-btn"
        onClick={() => {
          setTab("signin");
          setErrorMessage("");
        }}
        className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
          tab === "signin" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Sign In
      </button>
      <button
        id="tab-signup-btn"
        onClick={() => {
          setTab("signup");
          setErrorMessage("");
        }}
        className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
          tab === "signup" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Create Account
      </button>
      <button
        id="tab-personas-btn"
        onClick={() => {
          setTab("personas");
          setErrorMessage("");
        }}
        className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
          tab === "personas" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Quick Access
      </button>
    </div>
  );

  const signInForm = (
    <div className="space-y-4">
      <div className="space-y-2">
        <button
          id="google-signin-btn"
          onClick={() => handleGoogleClick(customGoogleEmail, "Stephen Ngatia")}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-98"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z" />
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
          </svg>
          <span>Continue with Google ({customGoogleEmail})</span>
        </button>

        <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
          <button type="button" onClick={() => setShowGooglePrompt(!showGooglePrompt)} className="text-emerald-400 hover:underline">
            {showGooglePrompt ? "Hide custom Google email" : "Use different Google account"}
          </button>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" /> OAuth 2.0
          </span>
        </div>

        {showGooglePrompt && (
          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2 animate-fade-in">
            <label className="text-[11px] text-slate-300 font-medium">Google Account Email:</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                placeholder="your-name@gmail.com"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => handleGoogleClick(customGoogleEmail, customGoogleEmail.split("@")[0])}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Connect
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 border-t border-slate-800"></div>
        <span className="text-[11px] uppercase tracking-wider text-slate-500">Or sign in with email</span>
        <div className="flex-1 border-t border-slate-800"></div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="signin-email-input"
              type="email"
              required
              placeholder="e.g. sarah.jenkins@household.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="signin-password-input"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          id="submit-signin-btn"
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
        >
          <KeyRound className="w-4 h-4" />
          <span>{isLoading ? "Verifying..." : "Sign In to BudgetPilot"}</span>
        </button>

        <p className="text-[11px] text-slate-500 text-center pt-1">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setErrorMessage("");
            }}
            className="text-emerald-400 hover:underline font-medium"
          >
            Create one
          </button>
        </p>
      </form>
    </div>
  );

  const signupForm = (
    <form onSubmit={handleSignup} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
        <div className="relative">
          <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="signup-name-input"
            type="text"
            required
            placeholder="e.g. Jamie Rivera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="signup-email-input"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
        <select
          id="signup-role-select"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="manager">Manager (Manage Budgets, Bills, Members)</option>
          <option value="editor">Editor (Add Transactions, View Goals)</option>
          <option value="viewer">Viewer (Read-Only Dashboards & Reports)</option>
          <option value="student">Student (Track Personal Spending & Goals)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="signup-password-input"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        id="submit-signup-btn"
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
      >
        <UserPlus className="w-4 h-4" />
        <span>{isLoading ? "Creating account..." : "Create Account"}</span>
      </button>

      <p className="text-[11px] text-slate-500 text-center pt-1">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => {
            setTab("signin");
            setErrorMessage("");
          }}
          className="text-emerald-400 hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </form>
  );

  const quickAccess = (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        Select an approved account to autofill its email — you'll still need its password to sign in.
      </p>
      {grouped.map((group) => (
        <div key={group.title} className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{group.title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.users.map((u) => {
              const meta = ROLE_META[u.role];
              const RoleIcon = meta.icon;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickFill(u)}
                  className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:border-emerald-500/60 hover:bg-slate-800 transition-all flex items-center gap-2.5 text-left"
                >
                  <img
                    src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                    alt={u.name}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{u.name}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${meta.badge}`}>
                        <RoleIcon className="w-2.5 h-2.5" /> {meta.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Full-page mandatory gate (unauthenticated visitors) ──────────────
  if (!dismissible) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
        <div className="min-h-screen grid lg:grid-cols-2">
          {/* Left: brand hero */}
          <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-950 overflow-hidden">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-400/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">
                  Budget<span className="text-emerald-200">Pilot</span>
                </span>
              </div>
              <h1 className="text-4xl font-bold text-white mt-10 leading-tight">
                Your money,<br />charted.
              </h1>
              <p className="text-emerald-100/90 text-sm mt-4 max-w-sm">
                A secure, role-based financial hub for your household — built for admins,
                managers, editors, and students alike.
              </p>
            </div>
            <div className="relative space-y-3">
              {FEATURES.map((f) => (
                <div key={f.text} className="flex items-center gap-3 text-emerald-50/90 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-4 h-4" />
                  </div>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: auth card */}
          <div className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md space-y-5">
              <div className="lg:hidden flex items-center gap-2.5 justify-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Wallet className="w-5 h-5 text-slate-950" />
                </div>
                <span className="text-xl font-bold text-white">
                  Budget<span className="text-emerald-400">Pilot</span>
                </span>
              </div>

              <div className="text-center lg:text-left">
                <h2 className="text-xl font-bold text-white">Welcome back</h2>
                <p className="text-xs text-slate-400 mt-1">Invite-only access &middot; approved accounts only</p>
              </div>

              {tabSelector}
              {errorBanner}
              {successBanner}
              {tab === "signin" ? signInForm : tab === "signup" ? signupForm : quickAccess}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Compact dismissible modal (reopened from inside the app) ─────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        id="auth-modal-container"
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        <div className="relative p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">BudgetPilot Access</h2>
              <p className="text-xs text-slate-400">Invite-only &middot; Approved accounts only</p>
            </div>
          </div>

          <div className="mt-4">{tabSelector}</div>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorBanner}
          {successBanner}
          {tab === "signin" ? signInForm : tab === "signup" ? signupForm : quickAccess}
        </div>
      </div>
    </div>
  );
};
