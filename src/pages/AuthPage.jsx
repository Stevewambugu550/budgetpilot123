import { useState } from 'react'
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BudgetPilotLogo from '../components/BudgetPilotLogo'

const AuthPage = () => {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]   = useState('login')
  const [email, setEmail] = useState('')
  const [pwd, setPwd]     = useState('')
  const [name, setName]   = useState('')
  const [err, setErr]     = useState('')
  const [msg, setMsg]     = useState('')
  const [busy, setBusy]   = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setBusy(true)
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-100 via-slate-50 to-slate-200">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <BudgetPilotLogo size={56} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Budget<span className="text-brand-600">Pilot</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Your money, charted.</p>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
            {[['login', 'Log in'], ['signup', 'Sign up']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(''); setMsg('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${mode === m ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                {label}
              </button>
            ))}
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
            {msg && (
              <div className="bg-emerald-50 text-emerald-700 text-sm rounded-xl px-3 py-2">{msg}</div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-5">
            Secured by Netlify Identity. Encrypted in transit.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
