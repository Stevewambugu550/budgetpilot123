import { useState, useEffect, useRef, useCallback } from 'react'
import { Mail, Lock, User, AlertCircle, Loader2, ArrowLeft, BarChart3, Target, CreditCard, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const FEATURES = [
  { icon: BarChart3,  label: 'Budget vs. actual dashboard' },
  { icon: TrendingUp, label: 'Income, expense & net worth tracking' },
  { icon: Target,     label: 'Savings goals & debt payoff planner' },
  { icon: CreditCard, label: 'Bills, accounts & household finances' },
]

const AuthPage = ({ initialMode = 'login', onBack }) => {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode]   = useState(initialMode)
  const [email, setEmail] = useState('')
  const [pwd, setPwd]     = useState('')
  const [name, setName]   = useState('')
  const [err, setErr]     = useState('')
  const [busy, setBusy]   = useState(false)
  const googleInitialized = useRef(false)

  const initGoogle = () => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id || googleInitialized.current) return
    googleInitialized.current = true
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        setErr(''); setBusy(true)
        try {
          const { error } = await signInWithGoogle(credential)
          if (error) throw error
        } catch (e) {
          setErr(e.message || 'Google sign-in failed.')
        } finally { setBusy(false) }
      },
    })
  }

  useEffect(() => {
    if (window.google?.accounts?.id) {
      initGoogle()
    } else {
      const script = document.querySelector('script[src*="accounts.google.com"]')
      script?.addEventListener('load', initGoogle, { once: true })
    }
  }, [])

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      setErr('Google sign-in is not configured. Please use email and password.')
      return
    }
    if (!window.google?.accounts?.id) {
      setErr('Google is still loading. Please wait a moment and try again.')
      return
    }
    initGoogle()
    window.google.accounts.id.prompt()
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, pwd)
        if (error) throw error
      } else {
        const { error } = await signUp(email, pwd, name)
        if (error) throw error
      }
    } catch (e) {
      setErr(e.message || 'Something went wrong.')
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">

      {/* ── Left panel ── */}
      <div className="lg:w-5/12 xl:w-1/2 bg-slate-950 text-white p-10 lg:p-16 flex flex-col justify-between">
        <div>
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition mb-12">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </button>
          )}

          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-slate-950" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">BudgetPilot</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4 tracking-tight">
            Take control of<br />your finances.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-sm">
            A professional personal finance dashboard built for individuals and households who want clarity, not complexity.
          </p>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-12">
          © {new Date().getFullYear()} BudgetPilot. All rights reserved.
        </p>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-slate-950">
        <div className="w-full max-w-sm">

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-slate-400">
              {mode === 'login'
                ? 'Sign in to your BudgetPilot account.'
                : 'Get started — free, no credit card required.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex border border-slate-700 rounded-lg p-1 mb-6">
            {[['login', 'Sign in'], ['signup', 'Create account']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setErr('') }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Google */}
          <div className="mb-5">
            <button onClick={handleGoogleClick}
              className="w-full flex items-center justify-center gap-3 border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium py-2.5 px-4 rounded-lg transition text-sm">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-xs text-slate-600">or</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" required autoComplete="email" className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Minimum 6 characters" />
              </div>
            </div>

            {err && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {err}
              </div>
            )}

            <button type="submit" disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-semibold py-2.5 rounded-lg transition text-sm mt-1">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-[11px] text-slate-600 text-center mt-6 leading-relaxed">
            By continuing you agree to our Terms of Service.<br />Your data is encrypted in transit and at rest.
          </p>

          {onBack && (
            <button onClick={onBack} className="mt-5 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition mx-auto">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthPage
