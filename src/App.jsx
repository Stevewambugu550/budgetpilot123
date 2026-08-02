import { useEffect, useState } from 'react'
import { Loader2, Shield, LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import AuthPage from './pages/AuthPage'
import Sidebar from './components/Sidebar'
import ChatWidget from './components/ChatWidget'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import People from './pages/People'
import Accounts from './pages/Accounts'
import SettingsPage from './pages/Settings'
import About from './pages/About'
import Admin from './pages/Admin'
import { getData, subscribe, loadAll, resetCache } from './lib/storage'
import { IS_ADMIN_BUILD } from './lib/mode'

const PAGES = {
  dashboard:    Dashboard,
  transactions: Transactions,
  budgets:      Budgets,
  goals:        Goals,
  people:       People,
  accounts:     Accounts,
  settings:     SettingsPage,
  about:        About,
  admin:        Admin,
}

const Shell = () => {
  const { user, canViewAdmin, loading, signOut: signOutSafe } = useAuth()
  const [page, setPage] = useState(() => localStorage.getItem('bp_page') || 'dashboard')
  const [data, setData] = useState(getData())

  // Persist current page across reloads
  useEffect(() => { localStorage.setItem('bp_page', page) }, [page])

  // (Re)load data + subscribe whenever the signed-in user changes
  useEffect(() => {
    const off = subscribe(setData)
    if (user) loadAll(user.id)
    else resetCache()
    return off
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!user) return <AuthPage />

  // ─── Admin-only deployment ───────────────────────────────
  if (IS_ADMIN_BUILD) {
    if (!canViewAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="card p-8 max-w-md w-full text-center">
            <Shield className="w-12 h-12 mx-auto text-rose-500 mb-3" />
            <h2 className="text-xl font-black">Admin access required</h2>
            <p className="text-sm text-slate-600 mt-2">
              This is the BudgetPilot admin console. Your account does not have admin privileges.
            </p>
            <p className="text-xs text-slate-400 mt-3">Logged in as <strong>{user.email}</strong></p>
            <button onClick={signOutSafe} className="btn-ghost mt-5 mx-auto">
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <Admin />
        </div>
      </div>
    )
  }

  // ─── Regular user app ────────────────────────────────────
  if (!data.ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Loading your finances…</p>
        </div>
      </div>
    )
  }

  const safePage = (page === 'admin') ? 'dashboard' : page
  const PageComp = PAGES[safePage] || Dashboard

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar page={safePage} setPage={setPage} />
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <PageComp data={data} setPage={setPage} />
        </div>
      </main>
      <ChatWidget data={data} />
    </div>
  )
}

const App = () => (
  <ToastProvider>
    <AuthProvider>
      <Shell />
    </AuthProvider>
  </ToastProvider>
)

export default App
