import { useState } from 'react'
import {
  LayoutDashboard, ArrowLeftRight, Target, Users, Wallet, PiggyBank,
  Settings, Info, Menu, X, LogOut, Sparkles
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BudgetPilotLogo from './BudgetPilotLogo'

const BASE_NAV = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budgets',      label: 'Budgets',      icon: PiggyBank },
  { id: 'goals',        label: 'Goals',        icon: Target },
  { id: 'people',       label: 'People',       icon: Users },
  { id: 'accounts',     label: 'Accounts',     icon: Wallet },
]

const FOOTER_NAV = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about',    label: 'About',    icon: Info },
]

const Sidebar = ({ page, setPage }) => {
  const { profile, user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = ((profile?.full_name || user?.email || '?')
    .split(/[ @]/).filter(Boolean).slice(0, 2).map(s => s[0]).join('') || '?').toUpperCase()

  const Content = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <BudgetPilotLogo size={40} className="flex-shrink-0 drop-shadow-lg" />
        <div>
          <p className="font-black text-lg leading-none tracking-tight text-slate-900">
            Budget<span className="text-brand-600">Pilot</span>
          </p>
          <p className="text-[10px] text-slate-500 tracking-wide mt-0.5 uppercase font-bold">Your money, charted</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        {BASE_NAV.map(n => {
          const Icon = n.icon
          const active = page === n.id
          return (
            <button
              key={n.id}
              onClick={() => { setPage(n.id); setMobileOpen(false) }}
              className={`group w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'text-slate-600 hover:bg-white hover:shadow-sm'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500'}`} />
              {n.label}
              {active && <Sparkles className="w-3.5 h-3.5 ml-auto opacity-80" />}
            </button>
          )
        })}

        <div className="pt-3 mt-3 border-t border-slate-100/80 space-y-1.5">
          {FOOTER_NAV.map(n => {
            const Icon = n.icon
            const active = page === n.id
            return (
              <button
                key={n.id}
                onClick={() => { setPage(n.id); setMobileOpen(false) }}
                className={`group w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'text-slate-500 hover:bg-white hover:shadow-sm'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400'}`} />
                {n.label}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="m-4 p-3.5 glass rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-glow">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate text-slate-900">{profile?.full_name || user?.email?.split('@')[0]}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={signOut} title="Log out" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between glass px-4 py-3">
        <div className="flex items-center gap-2">
          <BudgetPilotLogo size={32} className="drop-shadow-md" />
          <span className="font-black tracking-tight text-slate-900">
            Budget<span className="text-brand-600">Pilot</span>
          </span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 glass border-r border-slate-200/50">
        <Content />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <aside className="absolute left-0 top-0 bottom-0 w-72 glass flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 z-10">
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <Content />
          </aside>
        </div>
      )}
    </>
  )
}

export default Sidebar
