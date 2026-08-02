import { LayoutDashboard, ArrowLeftRight, Target, Users, Wallet, PiggyBank, Settings, Info, Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
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

  // Admin lives on a separate deployment, so we never show it in the user sidebar.
  const nav = BASE_NAV

  const initials = ((profile?.full_name || user?.email || '?')
    .split(/[ @]/).filter(Boolean).slice(0, 2).map(s => s[0]).join('') || '?').toUpperCase()

  const Content = () => (
    <>
      <div className="flex items-center gap-3 px-5 py-5">
        <BudgetPilotLogo size={42} className="flex-shrink-0 drop-shadow-lg" />
        <div>
          <p className="font-black text-lg leading-none tracking-tight">
            Budget<span className="text-brand-600">Pilot</span>
          </p>
          <p className="text-xs text-slate-400 tracking-wide mt-0.5">Your money, charted</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {nav.map(n => {
          const Icon = n.icon
          const active = page === n.id
          return (
            <button
              key={n.id}
              onClick={() => { setPage(n.id); setMobileOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {n.label}
            </button>
          )
        })}

        <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
          {FOOTER_NAV.map(n => {
            const Icon = n.icon
            const active = page === n.id
            return (
              <button
                key={n.id}
                onClick={() => { setPage(n.id); setMobileOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {n.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* User card */}
      <div className="m-3 p-3 bg-slate-50 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{profile?.full_name || user?.email?.split('@')[0]}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={signOut} title="Log out" className="p-2 rounded-lg hover:bg-slate-200 text-slate-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <BudgetPilotLogo size={32} className="drop-shadow-md" />
          <span className="font-black tracking-tight">
            Budget<span className="text-brand-600">Pilot</span>
          </span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <Content />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 z-10">
              <X className="w-5 h-5" />
            </button>
            <Content />
          </aside>
        </div>
      )}
    </>
  )
}

export default Sidebar
