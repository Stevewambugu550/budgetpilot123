import { useEffect, useMemo, useState } from 'react'
import {
  Shield, Search, ChevronLeft, Mail, Calendar, Wallet, ArrowUpCircle, ArrowDownCircle,
  Users as UsersIcon, FileSpreadsheet, Trash2, Activity, DollarSign, TrendingUp, LogOut,
} from 'lucide-react'
import { callApi } from '../lib/identity'
import { useAuth } from '../context/AuthContext'
import { fmtMoney, fmtDate } from '../lib/format'
import { catMeta } from '../lib/categories'
import { exportToExcel } from '../lib/excel'

const ROLES = [
  { value: 'user',       label: 'User',       chip: 'bg-slate-100 text-slate-700' },
  { value: 'it',         label: 'IT',         chip: 'bg-sky-100 text-sky-700' },
  { value: 'admin',      label: 'Admin',      chip: 'bg-brand-100 text-brand-700' },
  { value: 'superadmin', label: 'Superadmin', chip: 'bg-amber-100 text-amber-800' },
]

const roleMeta = (r) => ROLES.find(x => x.value === (r || 'user').toLowerCase()) || ROLES[0]

const RoleSelect = ({ value, onChange, allowSuperadmin, disabled, currentUserId, targetUserId }) => {
  const isSelf = currentUserId === targetUserId
  const options = ROLES.filter(r => allowSuperadmin || r.value !== 'superadmin')
  return (
    <select
      value={value || 'user'}
      onChange={e => onChange(e.target.value)}
      disabled={disabled || isSelf}
      title={isSelf ? "You can't change your own role" : 'Change role'}
      className={`text-xs font-semibold rounded-lg border px-2 py-1 bg-white disabled:opacity-50 disabled:cursor-not-allowed
        ${roleMeta(value).chip} border-slate-200`}
    >
      {options.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
    </select>
  )
}

const Admin = () => {
  const { isAdmin, isSuperAdmin, isIT, canViewAdmin, role: myRole, loading, user, signOut } = useAuth()
  // IT is read-only; admin can edit but not change roles to/from superadmin; superadmin can do anything.
  const canEdit = isAdmin // admin or superadmin
  const canChangeRoles = isAdmin // any admin/superadmin can change roles, but UI restricts targets below
  const [users, setUsers] = useState([])
  const [allTx, setAllTx] = useState([])
  const [busy, setBusy] = useState(true)
  const [tab, setTab] = useState('overview') // 'overview' | 'users' | 'activity'
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [err, setErr] = useState('')

  // ─── Load global data ─────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    ;(async () => {
      setBusy(true); setErr('')
      try {
        const d = await callApi('adminLoadAll')
        if (cancelled) return
        setUsers(d.profiles || [])
        setAllTx(d.transactions || [])
      } catch (e) {
        if (!cancelled) setErr(e.message)
      } finally {
        if (!cancelled) setBusy(false)
      }
    })()
    return () => { cancelled = true }
  }, [isAdmin])

  // ─── Drill into single user ───────────────────────────────
  const loadDetail = async (u) => {
    setSelected(u); setDetail(null); setErr('')
    try {
      const d = await callApi('adminLoadUser', { targetUserId: u.id })
      // Data is already camelCase from Blobs
      setDetail({
        accounts:     d.accounts     || [],
        transactions: d.transactions || [],
        goals:        d.goals        || [],
        people:       d.people       || [],
        payments:     d.payments     || [],
      })
    } catch (e) { setErr(e.message) }
  }

  const refreshDetail = () => { if (selected) loadDetail(selected) }

  const refreshAll = async () => {
    try {
      const d = await callApi('adminLoadAll')
      setUsers(d.profiles || [])
      setAllTx(d.transactions || [])
    } catch (e) { setErr(e.message) }
  }

  const deleteTx = async (txId) => {
    if (!confirm('Delete this transaction permanently?')) return
    const tx = detail?.transactions.find(t => t.id === txId) || allTx.find(t => t.id === txId)
    try {
      await callApi('adminDeleteTx', { txId, accountId: tx?.accountId, type: tx?.type, amount: tx?.amount })
      refreshDetail(); refreshAll()
    } catch (e) { alert(e.message) }
  }

  const deleteAccount = async (accId) => {
    if (!confirm('Delete this account?')) return
    try {
      await callApi('adminDeleteAccount', { accountId: accId })
      refreshDetail()
    } catch (e) { alert(e.message) }
  }

  const changeRole = async (u, next) => {
    if (next === u.role) return
    try {
      await callApi('adminChangeRole', { targetUserId: u.id, role: next })
      setUsers(us => us.map(x => x.id === u.id ? { ...x, role: next } : x))
      if (selected?.id === u.id) setSelected({ ...selected, role: next })
    } catch (e) { alert(e.message) }
  }

  // ─── Global stats ─────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const weekAgo = Date.now() - 7 * 86400 * 1000
    return {
      users: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      today: users.filter(u => (u.createdAt || '').slice(0, 10) === today).length,
      week: users.filter(u => new Date(u.createdAt || 0).getTime() > weekAgo).length,
      txCount: allTx.length,
      txVolume: allTx.reduce((s, t) => s + (Number(t.amount) || 0), 0),
      incomeVolume: allTx.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0),
      expenseVolume: allTx.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0),
    }
  }, [users, allTx])

  const userById = useMemo(() => {
    const m = {}
    for (const u of users) m[u.id] = u
    return m
  }, [users])

  if (loading) {
    return <p className="text-slate-500 p-6">Loading session...</p>
  }
  if (!canViewAdmin) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto mt-10">
        <Shield className="w-12 h-12 mx-auto text-rose-500 mb-3" />
        <h2 className="font-black text-xl">Admin access required</h2>
        <p className="text-sm text-slate-500 mt-2">
          The account <strong>{user?.email}</strong> does not have admin privileges.
        </p>
        <button onClick={signOut} className="btn-ghost mt-5 mx-auto">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    )
  }

  // ─── Drill-in detail view ─────────────────────────────────
  if (selected && detail) {
    const income  = detail.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = detail.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const networth = detail.accounts.reduce((s, a) => s + a.balance, 0)
    const cur = selected.currency || 'USD'

    return (
      <div className="space-y-5">
        <button onClick={() => { setSelected(null); setDetail(null) }} className="btn-ghost">
          <ChevronLeft className="w-4 h-4" /> Back to admin console
        </button>

        <div className="card p-6 bg-gradient-to-br from-slate-900 to-slate-700 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-300">VIEWING USER</p>
              <p className="text-2xl font-black mt-1">{selected.fullName || selected.email}</p>
              <p className="text-sm text-slate-300 flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5" /> {selected.email}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <Calendar className="w-3 h-3" /> Joined {fmtDate(selected.createdAt)}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => exportToExcel({
                  settings: { currency: cur, name: selected.fullName || selected.email },
                  accounts: detail.accounts, transactions: detail.transactions,
                  goals: detail.goals, people: detail.people, payments: detail.payments,
                }, `${(selected.email || 'user').split('@')[0]}-${new Date().toISOString().slice(0,10)}.xlsx`)}
                className="btn bg-white text-slate-900 hover:bg-slate-100"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export to Excel
              </button>
              {canChangeRoles && (
                <RoleSelect
                  value={selected.role}
                  onChange={(next) => changeRole(selected, next)}
                  allowSuperadmin={isSuperAdmin}
                  currentUserId={user?.id}
                  targetUserId={selected.id}
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div><p className="text-xs font-bold text-slate-300">NET WORTH</p><p className="text-xl font-black mt-1">{fmtMoney(networth, cur)}</p></div>
            <div><p className="text-xs font-bold text-slate-300">TOTAL INCOME</p><p className="text-xl font-black mt-1 text-emerald-300">{fmtMoney(income, cur)}</p></div>
            <div><p className="text-xs font-bold text-slate-300">TOTAL EXPENSE</p><p className="text-xl font-black mt-1 text-rose-300">{fmtMoney(expense, cur)}</p></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Wallet className="w-4 h-4" /> Accounts ({detail.accounts.length})</h3>
            <ul className="divide-y divide-slate-100">
              {detail.accounts.map(a => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                    {a.name} <span className="text-slate-400 text-xs">({a.type})</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-bold">{fmtMoney(a.balance, cur)}</span>
                    {canEdit && (
                      <button onClick={() => deleteAccount(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                </li>
              ))}
              {!detail.accounts.length && <p className="text-sm text-slate-500">No accounts.</p>}
            </ul>
          </div>
          <div className="card p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><UsersIcon className="w-4 h-4" /> People ({detail.people.length})</h3>
            <ul className="divide-y divide-slate-100">
              {detail.people.map(p => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-semibold">{p.name} <span className="text-slate-400 text-xs">({p.role || 'worker'})</span></span>
                  <span className="font-bold">{fmtMoney(p.monthlyPay, cur)}/mo</span>
                </li>
              ))}
              {!detail.people.length && <p className="text-sm text-slate-500">No people.</p>}
            </ul>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-3">Transactions ({detail.transactions.length})</h3>
          {detail.transactions.length === 0 ? (
            <p className="text-sm text-slate-500">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-slate-500 border-b">
                    <th className="py-2">Date</th><th>Type</th><th>Category</th><th>Account</th><th>Note</th><th className="text-right">Amount</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {detail.transactions.slice(0, 200).map(t => {
                    const m = catMeta(t.category, t.type)
                    const acc = detail.accounts.find(a => a.id === t.accountId)
                    return (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2 text-slate-500 whitespace-nowrap">{fmtDate(t.date)}</td>
                        <td>{t.type === 'income'
                          ? <ArrowUpCircle className="w-4 h-4 text-emerald-600 inline" />
                          : <ArrowDownCircle className="w-4 h-4 text-rose-600 inline" />}</td>
                        <td><span className={`chip ${m.color}`}>{m.icon} {t.category}</span></td>
                        <td className="text-slate-600">{acc?.name || ''}</td>
                        <td className="text-slate-600 truncate max-w-xs">{t.note}</td>
                        <td className={`text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+' : '-'} {fmtMoney(t.amount, cur)}
                        </td>
                        <td className="text-right pl-2">
                          {canEdit && (
                            <button onClick={() => deleteTx(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Main admin dashboard ─────────────────────────────────
  const filteredUsers = users.filter(u => {
    const s = search.trim().toLowerCase()
    if (!s) return true
    return (u.email || '').toLowerCase().includes(s) || (u.fullName || '').toLowerCase().includes(s)
  })

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Admin Console</h1>
            <p className="text-slate-500 text-sm flex items-center gap-2 flex-wrap">
              Logged in as <strong>{user?.email}</strong>
              <span className={`chip ${roleMeta(myRole).chip}`}>{roleMeta(myRole).label}</span>
            </p>
          </div>
        </div>
        <button onClick={signOut} className="btn-ghost">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>

      {err && (
        <div className="card p-4 bg-rose-50 text-rose-700 text-sm">{err}</div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Users', value: stats.users, sub: `${stats.admins} admin${stats.admins !== 1 ? 's' : ''}`, icon: UsersIcon, bg: 'bg-sky-50', fg: 'text-sky-600' },
          { label: 'New this week', value: stats.week, sub: `${stats.today} today`, icon: Calendar, bg: 'bg-violet-50', fg: 'text-violet-600' },
          { label: 'Transactions', value: stats.txCount, sub: 'across all users', icon: Activity, bg: 'bg-amber-50', fg: 'text-amber-600' },
          { label: 'Volume processed', value: `$${stats.txVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: 'income + expense', icon: DollarSign, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="card p-5 flex flex-col gap-3">
            <div className={`w-11 h-11 rounded-xl ${s.bg} ${s.fg} flex items-center justify-center`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{s.label}</p>
              <p className="text-2xl font-black mt-1 leading-tight">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5 flex items-center gap-4 bg-emerald-50/60 border-emerald-100">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Total income</p>
            <p className="text-2xl font-black mt-1 text-emerald-700">${stats.incomeVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4 bg-rose-50/60 border-rose-100">
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Total expense</p>
            <p className="text-2xl font-black mt-1 text-rose-700">${stats.expenseVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Overview',     icon: Activity },
          { id: 'users',    label: 'Users',        icon: UsersIcon },
          { id: 'activity', label: 'All activity', icon: TrendingUp },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {busy ? (
        <p className="text-slate-500">Loading data...</p>
      ) : (
        <>
          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2"><UsersIcon className="w-4 h-4" /> Newest users</h3>
                <ul className="divide-y divide-slate-100">
                  {users.slice(0, 6).map(u => (
                    <li key={u.id} className="flex items-center gap-3 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white flex items-center justify-center font-black text-xs">
                        {(u.fullName || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{u.fullName || u.email}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                      <span className={`chip ${roleMeta(u.role).chip}`}>{roleMeta(u.role).label}</span>
                      <span className="text-xs text-slate-400">{fmtDate(u.createdAt)}</span>
                    </li>
                  ))}
                  {users.length === 0 && <p className="text-sm text-slate-500">No users yet.</p>}
                </ul>
                {users.length > 6 && (
                  <button onClick={() => setTab('users')} className="text-xs font-semibold text-brand-600 mt-3">
                    See all {users.length} users →
                  </button>
                )}
              </div>

              <div className="card p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Activity className="w-4 h-4" /> Latest transactions</h3>
                <ul className="divide-y divide-slate-100">
                  {allTx.slice(0, 6).map(t => {
                    const owner = userById[t.userId]
                    const m = catMeta(t.category, t.type)
                    return (
                      <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                        {t.type === 'income'
                          ? <ArrowUpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          : <ArrowDownCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{t.category} <span className="text-slate-400 text-xs">({m.icon})</span></p>
                          <p className="text-xs text-slate-500 truncate">{owner?.email || 'unknown user'}</p>
                        </div>
                        <span className={`font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString()}
                        </span>
                      </li>
                    )
                  })}
                  {allTx.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
                </ul>
                {allTx.length > 6 && (
                  <button onClick={() => setTab('activity')} className="text-xs font-semibold text-brand-600 mt-3">
                    See all activity →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Users tab */}
          {tab === 'users' && (
            <div className="space-y-3">
              <div className="card p-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="input pl-9"
                  />
                </div>
              </div>
              <div className="card overflow-hidden">
                {filteredUsers.length === 0 ? (
                  <p className="p-10 text-center text-slate-500">No users match.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-400 bg-slate-50 border-b border-slate-100">
                        <th className="py-3 px-4">User</th>
                        <th className="px-2 hidden md:table-cell">Joined</th>
                        <th className="px-2">Role</th>
                        <th className="px-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <button onClick={() => loadDetail(u)} className="flex items-center gap-3 text-left">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                                {(u.fullName || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{u.fullName || u.email}</p>
                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                              </div>
                            </button>
                          </td>
                          <td className="px-2 text-xs text-slate-400 hidden md:table-cell whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                          <td className="px-2">
                            {canChangeRoles ? (
                              <RoleSelect
                                value={u.role}
                                onChange={(next) => changeRole(u, next)}
                                allowSuperadmin={isSuperAdmin}
                                currentUserId={user?.id}
                                targetUserId={u.id}
                              />
                            ) : (
                              <span className={`chip ${roleMeta(u.role).chip}`}>{roleMeta(u.role).label}</span>
                            )}
                          </td>
                          <td className="px-4 text-right">
                            <button onClick={() => loadDetail(u)} className="btn-ghost text-xs px-2 py-1">View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Activity tab */}
          {tab === 'activity' && (
            <div className="card p-5">
              <h3 className="font-bold mb-4">All transactions across the platform ({allTx.length})</h3>
              {allTx.length === 0 ? (
                <p className="text-sm text-slate-500">No transactions yet. Add some on the user app.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold text-slate-500 border-b">
                        <th className="py-2">Date</th><th>User</th><th>Type</th><th>Category</th><th>Note</th><th className="text-right">Amount</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTx.slice(0, 200).map(t => {
                        const owner = userById[t.userId]
                        const m = catMeta(t.category, t.type)
                        return (
                          <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2 text-slate-500 whitespace-nowrap">{fmtDate(t.date)}</td>
                            <td className="truncate max-w-[180px]">
                              <button onClick={() => { const u = userById[t.userId]; if (u) loadDetail(u) }}
                                className="text-left hover:text-brand-700 font-semibold">
                                {owner?.email || 'unknown'}
                              </button>
                            </td>
                            <td>{t.type === 'income'
                              ? <ArrowUpCircle className="w-4 h-4 text-emerald-600 inline" />
                              : <ArrowDownCircle className="w-4 h-4 text-rose-600 inline" />}</td>
                            <td><span className={`chip ${m.color}`}>{m.icon} {t.category}</span></td>
                            <td className="text-slate-600 truncate max-w-xs">{t.note}</td>
                            <td className={`text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString()}
                            </td>
                            <td className="text-right pl-2">
                              {canEdit && (
                                <button onClick={() => deleteTx(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {allTx.length > 200 && (
                    <p className="text-xs text-slate-500 text-center mt-3">Showing first 200 of {allTx.length}.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Admin
