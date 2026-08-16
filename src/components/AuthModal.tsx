import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  Shield,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup" | "personas";
  /** When false, hides the close button — used as a mandatory access gate. */
  dismissible?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = "signin",
  dismissible = true,
}) => {
  const {
    currentUser,
    users,
    loginWithGoogle,
    loginWithEmail,
    signup,
    switchUser,
  } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup" | "personas">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("manager");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Custom Google account input toggle
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
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMessage(res.error || "Login failed.");
      }
    }, 400);
  };


  const handleGoogleClick = (googleEmail: string, googleName?: string) => {
    setErrorMessage("");
    setIsLoading(true);
    setTimeout(() => {
      const res = loginWithGoogle(googleEmail, googleName);
      setIsLoading(false);
      if (res.success) {
        setSuccessMessage(`Connected as ${googleEmail}`);
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setErrorMessage(res.error || "Google sign-in failed.");
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        id="auth-modal-container"
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header with background glow */}
        <div className="relative p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
          {dismissible && (
            <button
              id="close-auth-modal-btn"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                BudgetPilot Access
              </h2>
              <p className="text-xs text-slate-400">
                Invite-only &middot; Approved accounts only
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl mt-4 border border-slate-800 text-xs">
            <button
              id="tab-signin-btn"
              onClick={() => {
                setTab("signin");
                setErrorMessage("");
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                tab === "signin"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
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
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                tab === "signup"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Request Access
            </button>
            <button
              id="tab-personas-btn"
              onClick={() => {
                setTab("personas");
                setErrorMessage("");
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                tab === "personas"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Demo Profiles
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SIGN IN VIEW */}
          {tab === "signin" && (
            <div className="space-y-4">
              {/* Google One-Click Button */}
              <div className="space-y-2">
                <button
                  id="google-signin-btn"
                  onClick={() => handleGoogleClick(customGoogleEmail, "Stephen Ngatia")}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google ({customGoogleEmail})</span>
                </button>

                <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
                  <button
                    type="button"
                    onClick={() => setShowGooglePrompt(!showGooglePrompt)}
                    className="text-emerald-400 hover:underline"
                  >
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
                <span className="text-[11px] uppercase tracking-wider text-slate-500">
                  Or login with email
                </span>
                <div className="flex-1 border-t border-slate-800"></div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
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
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-medium text-slate-300">Password</label>
                  </div>
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
                  <span>{isLoading ? "Verifying..." : "Sign In to Household Hub"}</span>
                </button>
              </form>
            </div>
          )}

          {/* REQUEST ACCESS VIEW (self-service sign-up is disabled) */}
          {tab === "signup" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl text-center space-y-2">
                <Shield className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">Access is invite-only</h3>
                <p className="text-xs text-slate-400">
                  Self-service sign-up is disabled. Only accounts approved by a household
                  administrator can access this app. Ask your administrator to create an
                  account for you from the Admin Panel, or use a Demo Profile below to explore.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setErrorMessage(signup(name, email, password, role).error || "Self-service sign-up is disabled.");
                }}
                className="space-y-3 opacity-50 pointer-events-none select-none"
                aria-disabled="true"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      disabled
                      placeholder="e.g. Stephen Ngatia"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* FAST 1-CLICK PERSONAS */}
          {tab === "personas" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Instantly switch to pre-configured household roles to test administrative controls, security settings, and read-only views:
              </p>

              <div className="space-y-2">
                {users.map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setSuccessMessage(`Switched active session to ${u.name}`);
                        setTimeout(() => {
                          onClose();
                        }, 500);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? "bg-emerald-950/40 border-emerald-500/50"
                          : "bg-slate-800/80 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                          alt={u.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{u.name}</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                u.role === "admin"
                                  ? "bg-purple-950 text-purple-300 border border-purple-800"
                                  : u.role === "manager"
                                  ? "bg-blue-950 text-blue-300 border border-blue-800"
                                  : u.role === "editor"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : u.role === "student"
                                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <Check className="w-4 h-4" /> Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          Switch <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
