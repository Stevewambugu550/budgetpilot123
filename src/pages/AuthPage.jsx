import { useState } from 'react'
import { Mail, Lock, User, AlertCircle, Loader2, Shield, Target, Bell, BarChart3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import BudgetPilotLogo from '../components/BudgetPilotLogo'

const AuthPage = () => {
  const { signIn, signUp } = useAuth()
  const toast = useToast()
  const [mode, setMode]   = useState('login')
  const [email, setEmail] = useState('')
  const [pwd, setPwd]     = useState('')
  const [name, setName]   = useState('')
  const [err, setErr]     = useState('')
  const [busy, setBusy]   = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, pwd)
        if (error) throw error
      } else {
        const { data, error } = await signUp(email, pwd, name)
        if (error) throw error
      }
    } catch (e) {
      setErr(e.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const socialComing = (provider) => {
    toast.info(`${provider} sign-in is coming soon. Use email and password for now.`)
  }

  const features = [
    { icon: BarChart3, title: 'Custom budgets', body: 'Set up budgets by category and watch your spending automatically tracked.' },
    { icon: Target, title: 'Goal trackers', body: 'Create savings goals and see your progress month by month.' },
    { icon: Bell, title: 'Smart alerts', body: 'Get notified when you are nearing your spending targets so you stay on track.' },
    { icon: Shield, title: 'Serious security', body: 'Your data is protected with secure hashing and encrypted connections.' },
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: marketing */}
      <div className="lg:w-1/2 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 lg:p-12 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <BudgetPilotLogo size={44} />
            <span className="text-2xl font-black tracking-tight">BudgetPilot</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-black leading-tight mb-4">
            Take control of your money today
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-md">
            BudgetPilot makes it easy to track spending, build savings, and reach your financial goals — all in one simple app.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
            {features.map(f => (
              <div key={f.title} className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
                <f.icon className="w-6 h-6 text-brand-300 mb-2" />
                <p className="font-bold text-sm mb-1">{f.title}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} BudgetPilot</p>
        </div>
      </div>

      {/* Right: auth */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 lg:hidden">
            <h1 className="text-2xl font-black tracking-tight">
              Budget<span className="text-brand-600">Pilot</span>
            </h1>
          </div>

          <div className="card p-6 sm:p-8 shadow-xl">
            <div className="flex bg-slate-100 rounded-2xl p-1 mb-5">
              {[['login', 'Log in'], ['signup', 'Sign up']].map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErr('') }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${mode === m ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 mb-5">
              <button onClick={() => socialComing('Google')} className="btn w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <button onClick={() => socialComing('Apple')} className="btn w-full bg-slate-900 hover:bg-slate-800 text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05 1.37-3.25 1.37-1.55 0-2.97-1.18-4.64-1.18-1.74 0-3.2 1.17-4.85 1.17-1.55 0-2.88-.93-3.95-2.36-2.17-3.04-1.9-8.93 1.15-12.62 1.47-1.76 3.2-2.72 4.98-2.72 1.58 0 3.05 1.06 4.06 1.06 1.1 0 2.8-1.1 4.7-1.1 1.07 0 3.33.22 5.13 2.17-.22.14-2.5 1.47-2.5 4.42 0 3.5 3.03 4.68 3.05 4.68-.02.11-.4 1.37-1.62 3.25-.98 1.52-2.06 2.96-3.4 2.96zm-1.43-12.4c.45-1.37 1.25-2.85 2.66-3.5.35-.16.7-.24 1.05-.24 1.5 0 2.96 1.33 3.46 2.68-.4.1-.78.33-1.08.58-.55.45-.98 1.05-1.2 1.7-.22.65-.3 1.35-.23 2.02-.7.1-1.4.02-2.06-.24-.66-.26-1.23-.7-1.66-1.25-.43-.55-.73-1.2-.9-1.88-.06-.23-.1-.47-.1-.72 0-.08 0-.16.01-.25-.03.04-.07.08-.1.12-.33.42-.58.9-.74 1.42h.02z"/></svg>
                Continue with Apple
              </button>
            </div>

            <div className="relative flex items-center gap-3 my-5">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-xs text-slate-400 font-semibold">or use email</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="label">Full name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="input pl-9" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
                  </div>
                </div>
              )}
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required autoComplete="email" className="input pl-9" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="input pl-9" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="At least 6 characters" />
                </div>
              </div>

              {err && (
                <div className="bg-rose-50 text-rose-700 text-sm rounded-xl px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {err}
                </div>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' ? 'Log in' : 'Create account'}
              </button>
            </form>

            <p className="text-[10px] text-slate-400 text-center mt-5 leading-relaxed">
              By continuing, you agree to our Terms & Conditions. Your data is encrypted in transit.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
