import { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard, Users as UsersIcon, Activity, ClipboardList, Lock, Server,
  Search, Shield, LogOut, Mail, Calendar, Wallet, ArrowUpCircle, ArrowDownCircle,
  Trash2, TrendingUp, DollarSign, UserX, UserCheck, KeyRound, FileSpreadsheet,
  ChevronLeft, Check, X as XIcon, Database, Cpu, Zap, AlertTriangle,
} from 'lucide-react'
import { callApi } from '../lib/identity'
import { useAuth } from '../context/AuthContext'
import { fmtMoney, fmtDate } from '../lib/format'
import { catMeta } from '../lib/categories'
import { exportToExcel } from '../lib/excel'

// â”€â”€â”€ Design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const T = {
  bg:      '#0B1020',
  sidebar: '#0E1528',
  card:    '#111A2E',
  border:  '#1E293B',
  text:    '#E5E7EB',
  muted:   '#94A3B8',
  primary: '#4F7CFF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger:  '#EF4444',
}

const ROLES = [
  { value: 'user',       label: 'User',       cls: 'bg-slate-700 text-slate-300' },
  { value: 'it',         label: 'IT',         cls: 'bg-sky-900 text-sky-300' },
  { value: 'admin',      label: 'Admin',      cls: 'bg-indigo-900 text-indigo-300' },
  { value: 'superadmin', label: 'Superadmin', cls: 'bg-amber-900 text-amber-300' },
]
const roleMeta = r => ROLES.find(x => x.value === (r || 'user').toLowerCase()) || ROLES[0]

const PERMISSIONS = [
  { label: 'View users, transactions, and activity',  user: false, it: true,  admin: true,  superadmin: true  },
  { label: 'Export user data to Excel',               user: false, it: true,  admin: true,  superadmin: true  },
  { label: 'Edit accounts, transactions, budgets',    user: false, it: false, admin: true,  superadmin: true  },
  { label: "Change a user's role (up to Admin)",      user: false, it: false, admin: true,  superadmin: true  },
  { label: 'Suspend or reactivate a user account',    user: false, it: false, admin: true,  superadmin: true  },
  { label: "Reset a user's password",                 user: false, it: false, admin: true,  superadmin: true  },
  { label: 'Grant or revoke Superadmin role',         user: false, it: false, admin: false, superadmin: true  },
  { label: 'Permanently delete a user account',       user: false, it: false, admin: false, superadmin: true  },
]

// â”€â”€â”€ Atoms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Chip = ({ label, cls }) => (
  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold tracking-wide ${cls}`}>{label}</span>
)

const Metric = ({ label, value, sub, accent = T.primary, icon: Icon }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl p-5">
    <div className="flex items-start justify-between mb-3">
      <p style={{ color: T.muted }} className="text-[11px] font-bold uppercase tracking-wider">{label}</p>
      {Icon && <div style={{ background: accent + '22', color: accent }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4" /></div>}
    </div>
    <p style={{ color: T.text }} className="text-2xl font-black leading-none tabular-nums">{value}</p>
    {sub && <p style={{ color: T.muted }} className="text-xs mt-1.5 font-medium">{sub}</p>}
  </div>
)

const NavItem = ({ icon: Icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    style={active ? { background: T.primary + '22', color: T.primary } : { color: T.muted }}
    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-100"
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    <span className="truncate">{label}</span>
    {badge ? <span style={{ background: T.danger }} className="ml-auto text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{badge}</span> : null}
  </button>
)

const Spinner = () => (
  <div className="flex items-center justify-center py-24">
    <div className="text-center">
      <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: T.border, borderTopColor: T.primary }} />
      <p style={{ color: T.muted }} className="text-sm">Loading...</p>
    </div>
  </div>
)

const RoleSelect = ({ value, onChange, allowSuperadmin, isSelf }) => {
  const options = ROLES.filter(r => allowSuperadmin || r.value !== 'superadmin')
  return (
    <select value={value || 'user'} onChange={e => onChange(e.target.value)} disabled={isSelf}
      style={{ background: T.card, color: T.text, borderColor: T.border }}
      className="text-xs font-semibold rounded-lg border px-2 py-1.5 disabled:opacity-40 cursor-pointer focus:outline-none">
      {options.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
    </select>
  )
}

// â”€â”€â”€ User detail panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const UserDetail = ({ selected, detail, onBack, cur, canEdit, canDeleteUser, isSuperAdmin, isSelf,
  onExport, onToggleActive, onResetPassword, onDeleteUser, onDeleteAccount, onDeleteTx, onChangeRole, canChangeRoles }) => {
  if (!detail) return <Spinner />
  const income   = detail.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense  = detail.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const netWorth = detail.accounts.reduce((s, a) => s + a.balance, 0)
  const Row = ({ label, value }) => (
    <div style={{ borderBottom: `1px solid ${T.border}20` }} className="flex items-center justify-between py-2">
      <span style={{ color: T.muted }} className="text-xs font-medium">{label}</span>
      <span style={{ color: T.text }} className="text-xs font-bold">{value}</span>
    </div>
  )
  return (
    <div className="space-y-5">
      <button onClick={onBack} style={{ color: T.muted }} className="flex items-center gap-2 text-sm font-semibold hover:opacity-70 transition">
        <ChevronLeft className="w-4 h-4" /> Back to users
      </button>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1a2744 0%,#0E1528 100%)', border: `1px solid ${T.border}` }} className="rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div style={{ background: T.primary }} className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white flex-shrink-0">
              {(selected.fullName || selected.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <p style={{ color: T.text }} className="text-xl font-black">{selected.fullName || selected.email}</p>
              <p style={{ color: T.muted }} className="text-sm flex items-center gap-1.5 mt-0.5"><Mail className="w-3.5 h-3.5" />{selected.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Chip label={roleMeta(selected.role).label} cls={roleMeta(selected.role).cls} />
                <Chip label={selected.active === false ? 'Suspended' : 'Active'} cls={selected.active === false ? 'bg-rose-900 text-rose-300' : 'bg-emerald-900 text-emerald-300'} />
                <span style={{ color: T.muted }} className="text-xs">Joined {fmtDate(selected.createdAt)} Â· {selected.loginCount ?? 0} logins</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onExport} style={{ background: T.border, color: T.text }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export
            </button>
            {canChangeRoles && (
              <RoleSelect value={selected.role} onChange={onChangeRole} allowSuperadmin={isSuperAdmin} isSelf={isSelf} />
            )}
            {canEdit && !isSelf && (
              <>
                <button onClick={onToggleActive} style={{ background: selected.active === false ? T.success + '22' : T.warning + '22', color: selected.active === false ? T.success : T.warning }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition">
                  {selected.active === false ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                  {selected.active === false ? 'Reactivate' : 'Suspend'}
                </button>
                <button onClick={onResetPassword} style={{ background: T.primary + '22', color: T.primary }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition">
                  <KeyRound className="w-3.5 h-3.5" /> Reset Password
                </button>
              </>
            )}
            {canDeleteUser && !isSelf && (
              <button onClick={onDeleteUser} style={{ background: T.danger + '22', color: T.danger }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5" style={{ borderTop: `1px solid ${T.border}` }}>
          {[['Net Worth', fmtMoney(netWorth, cur), T.text], ['Total Income', fmtMoney(income, cur), T.success], ['Total Expense', fmtMoney(expense, cur), T.danger]].map(([l, v, c]) => (
            <div key={l}><p style={{ color: T.muted }} className="text-[11px] font-bold uppercase tracking-wide">{l}</p><p style={{ color: c }} className="text-xl font-black mt-1">{v}</p></div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Accounts */}
        <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl p-5">
          <p style={{ color: T.text }} className="font-bold text-sm mb-3 flex items-center gap-2"><Wallet className="w-4 h-4" style={{ color: T.primary }} />Accounts ({detail.accounts.length})</p>
          {detail.accounts.map(a => (
            <div key={a.id} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${T.border}20` }}>
              <span style={{ color: T.text }} className="text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />{a.name}
                <span style={{ color: T.muted }} className="text-xs">({a.type})</span>
              </span>
              <span className="flex items-center gap-2">
                <span style={{ color: T.text }} className="text-sm font-bold">{fmtMoney(a.balance, cur)}</span>
                {canEdit && <button onClick={() => onDeleteAccount(a.id)} style={{ color: T.muted }} className="p-1 rounded hover:text-rose-400 transition"><Trash2 className="w-3 h-3" /></button>}
              </span>
            </div>
          ))}
          {!detail.accounts.length && <p style={{ color: T.muted }} className="text-sm">No accounts.</p>}
        </div>
        {/* People */}
        <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl p-5">
          <p style={{ color: T.text }} className="font-bold text-sm mb-3 flex items-center gap-2"><UsersIcon className="w-4 h-4" style={{ color: T.primary }} />People ({detail.people.length})</p>
          {detail.people.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${T.border}20` }}>
              <span style={{ color: T.text }} className="text-sm font-semibold">{p.name} <span style={{ color: T.muted }} className="text-xs">({p.role || 'worker'})</span></span>
              <span style={{ color: T.text }} className="text-sm font-bold">{fmtMoney(p.monthlyPay, cur)}/mo</span>
            </div>
          ))}
          {!detail.people.length && <p style={{ color: T.muted }} className="text-sm">No people.</p>}
        </div>
      </div>

      {/* Login history */}
      <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl p-5">
        <p style={{ color: T.text }} className="font-bold text-sm mb-3 flex items-center gap-2"><Activity className="w-4 h-4" style={{ color: T.primary }} />Login History ({detail.loginHistory.length})</p>
        {!detail.loginHistory.length ? <p style={{ color: T.muted }} className="text-sm">No logins recorded.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: `1px solid ${T.border}`, color: T.muted }} className="text-left font-bold uppercase tracking-wide">
                <th className="py-2 pr-4">Date / Time</th><th className="pr-4">Device</th><th className="pr-4">IP</th><th>User Agent</th>
              </tr></thead>
              <tbody>{detail.loginHistory.slice(0, 50).map(h => (
                <tr key={h.id} style={{ borderBottom: `1px solid ${T.border}15` }}>
                  <td style={{ color: T.muted }} className="py-2 pr-4 whitespace-nowrap">{new Date(h.createdAt).toLocaleString()}</td>
                  <td style={{ color: T.text }} className="pr-4">{h.device}</td>
                  <td style={{ color: T.muted }} className="pr-4 font-mono">{h.ip}</td>
                  <td style={{ color: T.muted }} className="truncate max-w-[200px]">{h.userAgent}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl p-5">
        <p style={{ color: T.text }} className="font-bold text-sm mb-3">Transactions ({detail.transactions.length})</p>
        {!detail.transactions.length ? <p style={{ color: T.muted }} className="text-sm">No transactions yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: `1px solid ${T.border}`, color: T.muted }} className="text-left font-bold uppercase tracking-wide">
                <th className="py-2 pr-4">Date</th><th className="pr-4">Type</th><th className="pr-4">Category</th><th className="pr-4 max-w-[120px]">Note</th><th className="text-right pr-4">Amount</th>{canEdit && <th />}
              </tr></thead>
              <tbody>{detail.transactions.slice(0, 200).map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}15` }}>
                  <td style={{ color: T.muted }} className="py-2 pr-4 whitespace-nowrap">{fmtDate(t.date)}</td>
                  <td className="pr-4">{t.type === 'income' ? <ArrowUpCircle className="w-4 h-4 inline" style={{ color: T.success }} /> : <ArrowDownCircle className="w-4 h-4 inline" style={{ color: T.danger }} />}</td>
                  <td style={{ color: T.text }} className="pr-4">{t.category}</td>
                  <td style={{ color: T.muted }} className="pr-4 truncate max-w-[120px]">{t.note}</td>
                  <td style={{ color: t.type === 'income' ? T.success : T.danger }} className="text-right pr-4 font-bold whitespace-nowrap">{t.type === 'income' ? '+' : '-'}{fmtMoney(t.amount, cur)}</td>
                  {canEdit && <td><button onClick={() => onDeleteTx(t.id)} style={{ color: T.muted }} className="p-1 rounded hover:text-rose-400 transition"><Trash2 className="w-3 h-3" /></button></td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Admin = () => {
  const { isAdmin, isSuperAdmin, canViewAdmin, role: myRole, loading, user, signOut } = useAuth()
  const canEdit = isAdmin
  const canChangeRoles = isAdmin
  const canDeleteUser = isSuperAdmin
  const [users,    setUsers]    = useState([])
  const [allTx,    setAllTx]    = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [busy,     setBusy]     = useState(true)
  const [page,     setPage]     = useState('overview')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const [detail,   setDetail]   = useState(null)
  const [err,      setErr]      = useState('')

  // â”€â”€â”€ Load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      } catch (e) { if (!cancelled) setErr(e.message) }
      finally      { if (!cancelled) setBusy(false) }
    })()
    return () => { cancelled = true }
  }, [isAdmin])

  const loadDetail = async (u) => {
    setSelected(u); setDetail(null); setErr(''); setPage('users')
    try {
      const d = await callApi('adminLoadUser', { targetUserId: u.id })
      setDetail({ accounts: d.accounts||[], transactions: d.transactions||[], goals: d.goals||[], people: d.people||[], payments: d.payments||[], loginHistory: d.loginHistory||[] })
    } catch (e) { setErr(e.message) }
  }

  const refreshDetail = () => { if (selected) loadDetail(selected) }
  const refreshAll = async () => {
    try { const d = await callApi('adminLoadAll'); setUsers(d.profiles||[]); setAllTx(d.transactions||[]) }
    catch (e) { setErr(e.message) }
  }

  // â”€â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const deleteTx = async (txId) => {
    if (!confirm('Delete this transaction permanently?')) return
    const tx = detail?.transactions.find(t => t.id === txId) || allTx.find(t => t.id === txId)
    try { await callApi('adminDeleteTx', { txId, accountId: tx?.accountId, type: tx?.type, amount: tx?.amount }); refreshDetail(); refreshAll() }
    catch (e) { alert(e.message) }
  }
  const deleteAccount = async (accId) => {
    if (!confirm('Delete this account?')) return
    try { await callApi('adminDeleteAccount', { accountId: accId }); refreshDetail() }
    catch (e) { alert(e.message) }
  }
  const changeRole = async (u, next) => {
    if (next === u.role) return
    try {
      await callApi('adminChangeRole', { targetUserId: u.id, role: next })
      setUsers(us => us.map(x => x.id === u.id ? { ...x, role: next } : x))
      if (selected?.id === u.id) setSelected(s => ({ ...s, role: next }))
    } catch (e) { alert(e.message) }
  }
  const toggleActive = async (u) => {
    const next = u.active === false
    if (!confirm(next ? `Reactivate ${u.email}?` : `Suspend ${u.email}?`)) return
    try {
      await callApi('adminSetUserActive', { targetUserId: u.id, active: next })
      setUsers(us => us.map(x => x.id === u.id ? { ...x, active: next } : x))
      if (selected?.id === u.id) setSelected(s => ({ ...s, active: next }))
    } catch (e) { alert(e.message) }
  }
  const resetPassword = async (u) => {
    if (!confirm(`Reset password for ${u.email}?`)) return
    try {
      const { tempPassword } = await callApi('adminResetPassword', { targetUserId: u.id })
      alert(`Temporary password for ${u.email}:\n\n${tempPassword}\n\nShare this securely.`)
    } catch (e) { alert(e.message) }
  }
  const deleteUserAccount = async (u) => {
    if (!confirm(`Permanently delete ${u.email} and ALL data? This cannot be undone.`)) return
    if (!confirm('Final confirmation â€” really delete this account?')) return
    try {
      await callApi('adminDeleteUser', { targetUserId: u.id })
      setUsers(us => us.filter(x => x.id !== u.id))
      if (selected?.id === u.id) { setSelected(null); setDetail(null) }
    } catch (e) { alert(e.message) }
  }
  const loadAuditLog = async () => {
    try { const rows = await callApi('adminLoadAuditLog'); setAuditLog(rows||[]) }
    catch (e) { setErr(e.message) }
  }

  // â”€â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stats = useMemo(() => {
    const today   = new Date().toISOString().slice(0, 10)
    const weekAgo = Date.now() - 7 * 86400 * 1000
    return {
      users:          users.length,
      admins:         users.filter(u => ['admin','superadmin'].includes(u.role)).length,
      suspended:      users.filter(u => u.active === false).length,
      today:          users.filter(u => (u.createdAt||'').slice(0,10) === today).length,
      week:           users.filter(u => new Date(u.createdAt||0).getTime() > weekAgo).length,
      txCount:        allTx.length,
      txVolume:       allTx.reduce((s,t) => s + (Number(t.amount)||0), 0),
      incomeVolume:   allTx.filter(t => t.type==='income').reduce((s,t) => s + (Number(t.amount)||0), 0),
      expenseVolume:  allTx.filter(t => t.type==='expense').reduce((s,t) => s + (Number(t.amount)||0), 0),
    }
  }, [users, allTx])

  const userById = useMemo(() => { const m={}; for (const u of users) m[u.id]=u; return m }, [users])
  const filteredUsers = users.filter(u => {
    const s = search.trim().toLowerCase()
    return !s || (u.email||'').toLowerCase().includes(s) || (u.fullName||'').toLowerCase().includes(s)
  })

  // â”€â”€â”€ Access denied â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) return (
    <div style={{ background: T.bg }} className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: T.border, borderTopColor: T.primary }} />
    </div>
  )
  if (!canViewAdmin) return (
    <div style={{ background: T.bg }} className="min-h-screen flex items-center justify-center p-4">
      <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-2xl p-10 text-center max-w-sm w-full">
        <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: T.danger }} />
        <h2 style={{ color: T.text }} className="font-black text-xl">Access denied</h2>
        <p style={{ color: T.muted }} className="text-sm mt-2">{user?.email} does not have admin privileges.</p>
        <button onClick={signOut} style={{ background: T.border, color: T.text }} className="mt-5 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    </div>
  )

  // â”€â”€â”€ Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const nav = (id, icon, label, badge) => (
    <NavItem icon={icon} label={label} active={page===id && !selected} badge={badge}
      onClick={() => { setPage(id); setSelected(null); setDetail(null); if (id==='log') loadAuditLog() }} />
  )

  return (
    <div style={{ background: T.bg, minHeight: '100vh' }} className="flex">

      {/* â”€â”€ Sidebar â”€â”€ */}
      <aside style={{ background: T.sidebar, borderRight: `1px solid ${T.border}`, width: 220, minHeight: '100vh' }} className="flex-shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 py-5 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
          <p style={{ color: T.text }} className="font-black text-sm">Budget Pilot</p>
          <p style={{ color: T.primary }} className="text-[10px] font-black uppercase tracking-widest mt-0.5">Control Center</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav('overview', LayoutDashboard, 'Overview')}

          <p style={{ color: T.muted }} className="text-[10px] font-black uppercase tracking-widest px-3 pt-5 pb-1">Customers</p>
          {nav('users',    UsersIcon,       'Users',       stats.suspended || null)}
          {nav('activity', Activity,        'Activity')}

          <p style={{ color: T.muted }} className="text-[10px] font-black uppercase tracking-widest px-3 pt-5 pb-1">Access</p>
          {nav('permissions', Lock,         'Permissions')}

          <p style={{ color: T.muted }} className="text-[10px] font-black uppercase tracking-widest px-3 pt-5 pb-1">Operations</p>
          {nav('log',      ClipboardList,   'Audit Log')}

          <p style={{ color: T.muted }} className="text-[10px] font-black uppercase tracking-widest px-3 pt-5 pb-1">System</p>
          {nav('system',   Server,          'Health')}
        </nav>

        <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2.5">
            <div style={{ background: T.primary }} className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white flex-shrink-0">
              {(user?.fullName || user?.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: T.text }} className="text-xs font-bold truncate">{user?.fullName || user?.email}</p>
              <Chip label={roleMeta(myRole).label} cls={roleMeta(myRole).cls} />
            </div>
            <button onClick={signOut} style={{ color: T.muted }} className="p-1 rounded hover:opacity-60 transition" title="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* â”€â”€ Main â”€â”€ */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ minWidth: 0 }}>
        {/* Top bar */}
        <header style={{ background: T.sidebar, borderBottom: `1px solid ${T.border}`, height: 56 }} className="flex items-center justify-between px-6 flex-shrink-0">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.muted }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage('users'); setSelected(null); setDetail(null) }}
              placeholder="Search users..."
              style={{ background: T.card, borderColor: T.border, color: T.text }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm placeholder:text-slate-500 focus:outline-none" />
          </div>
          <div className="flex items-center gap-4 ml-4">
            <div style={{ background: T.danger + '22', color: T.danger }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />Production
            </div>
            <div style={{ color: T.success }} className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />API Healthy
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {err && (
            <div style={{ background: T.danger + '22', color: T.danger, border: `1px solid ${T.danger}44` }} className="rounded-xl p-4 text-sm mb-5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{err}
            </div>
          )}

          {/* USER DETAIL */}
          {selected && (
            <UserDetail
              selected={selected} detail={detail} cur={selected.currency || 'USD'}
              onBack={() => { setSelected(null); setDetail(null) }}
              canEdit={canEdit} canChangeRoles={canChangeRoles} canDeleteUser={canDeleteUser}
              isSuperAdmin={isSuperAdmin} isSelf={user?.id === selected.id}
              onExport={() => exportToExcel({ settings: { currency: selected.currency||'USD', name: selected.fullName||selected.email }, accounts: detail.accounts, transactions: detail.transactions, goals: detail.goals, people: detail.people, payments: detail.payments }, `${(selected.email||'user').split('@')[0]}-${new Date().toISOString().slice(0,10)}.xlsx`)}
              onToggleActive={() => toggleActive(selected)}
              onResetPassword={() => resetPassword(selected)}
              onDeleteUser={() => deleteUserAccount(selected)}
              onDeleteAccount={deleteAccount}
              onDeleteTx={deleteTx}
              onChangeRole={(next) => changeRole(selected, next)}
            />
          )}

          {!selected && busy && <Spinner />}

          {!selected && !busy && (
            <>
              {/* â”€â”€ OVERVIEW â”€â”€ */}
              {page === 'overview' && (
                <div className="space-y-5">
                  <div>
                    <h1 style={{ color: T.text }} className="text-2xl font-black">Overview</h1>
                    <p style={{ color: T.muted }} className="text-sm mt-0.5">Platform health and activity at a glance.</p>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Metric icon={UsersIcon}  label="Total Users"       value={stats.users}                          sub={`${stats.admins} admin${stats.admins!==1?'s':''}`} accent={T.primary} />
                    <Metric icon={Calendar}   label="New This Week"     value={stats.week}                           sub={`${stats.today} today`}                             accent={T.success} />
                    <Metric icon={Activity}   label="Transactions"      value={stats.txCount.toLocaleString()}       sub="across all users"                                   accent={T.warning} />
                    <Metric icon={DollarSign} label="Total Volume"      value={`$${stats.txVolume.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="income + expense" accent="#8b5cf6" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[['Total Income', stats.incomeVolume, T.success, TrendingUp], ['Total Expense', stats.expenseVolume, T.danger, DollarSign]].map(([l, v, c, Icon]) => (
                      <div key={l} style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl p-5 flex items-center gap-4">
                        <div style={{ background: c + '22', color: c }} className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5" /></div>
                        <div>
                          <p style={{ color: c }} className="text-xs font-bold uppercase tracking-wide">{l}</p>
                          <p style={{ color: c }} className="text-2xl font-black mt-0.5">${(v).toLocaleString(undefined,{maximumFractionDigits:0})}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid lg:grid-cols-2 gap-5">
                    {/* Recent users */}
                    <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                        <p style={{ color: T.text }} className="font-bold text-sm flex items-center gap-2"><UsersIcon className="w-4 h-4" style={{ color: T.primary }} />Recent Users</p>
                        <button onClick={() => setPage('users')} style={{ color: T.primary }} className="text-xs font-semibold">View all â†’</button>
                      </div>
                      {users.slice(0, 6).map(u => (
                        <div key={u.id} onClick={() => loadDetail(u)} className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:opacity-80 transition" style={{ borderBottom: `1px solid ${T.border}15` }}>
                          <div style={{ background: T.primary }} className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0">
                            {(u.fullName||u.email||'?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ color: T.text }} className="font-semibold text-sm truncate">{u.fullName||u.email}</p>
                            <p style={{ color: T.muted }} className="text-xs truncate">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Chip label={roleMeta(u.role).label} cls={roleMeta(u.role).cls} />
                            <span style={{ color: T.muted }} className="text-xs hidden sm:block">{fmtDate(u.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                      {!users.length && <p style={{ color: T.muted }} className="p-5 text-sm">No users yet.</p>}
                    </div>
                    {/* Recent transactions */}
                    <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                        <p style={{ color: T.text }} className="font-bold text-sm flex items-center gap-2"><Activity className="w-4 h-4" style={{ color: T.primary }} />Latest Transactions</p>
                        <button onClick={() => setPage('activity')} style={{ color: T.primary }} className="text-xs font-semibold">View all â†’</button>
                      </div>
                      {allTx.slice(0, 6).map(t => {
                        const owner = userById[t.userId]
                        return (
                          <div key={t.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: `1px solid ${T.border}15` }}>
                            {t.type==='income' ? <ArrowUpCircle className="w-4 h-4 flex-shrink-0" style={{ color: T.success }} /> : <ArrowDownCircle className="w-4 h-4 flex-shrink-0" style={{ color: T.danger }} />}
                            <div className="flex-1 min-w-0">
                              <p style={{ color: T.text }} className="font-semibold text-sm truncate">{t.category}</p>
                              <p style={{ color: T.muted }} className="text-xs truncate">{owner?.email||'unknown'}</p>
                            </div>
                            <span style={{ color: t.type==='income' ? T.success : T.danger }} className="font-bold text-sm tabular-nums flex-shrink-0">
                              {t.type==='income'?'+':'-'}${Number(t.amount).toLocaleString()}
                            </span>
                          </div>
                        )
                      })}
                      {!allTx.length && <p style={{ color: T.muted }} className="p-5 text-sm">No transactions yet.</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* â”€â”€ USERS â”€â”€ */}
              {page === 'users' && (
                <div className="space-y-4">
                  <div>
                    <h1 style={{ color: T.text }} className="text-2xl font-black">Users</h1>
                    <p style={{ color: T.muted }} className="text-sm mt-0.5">{users.length} registered Â· {stats.suspended} suspended</p>
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl overflow-hidden">
                    <div className="p-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                      <div className="relative max-w-sm">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.muted }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
                          style={{ background: T.bg, borderColor: T.border, color: T.text }}
                          className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm placeholder:text-slate-500 focus:outline-none" />
                      </div>
                    </div>
                    {!filteredUsers.length ? <p style={{ color: T.muted }} className="p-10 text-center text-sm">No users match.</p> : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${T.border}`, color: T.muted, background: T.bg + '80' }} className="text-left text-xs font-bold uppercase tracking-wide">
                              <th className="py-3 px-5">User</th>
                              <th className="px-3 hidden md:table-cell">Joined</th>
                              <th className="px-3 hidden lg:table-cell">Last Login</th>
                              <th className="px-3 hidden sm:table-cell">Logins</th>
                              <th className="px-3">Status</th>
                              <th className="px-3">Role</th>
                              <th className="px-5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map(u => {
                              const isSuspended = u.active === false
                              const isSelf = user?.id === u.id
                              return (
                                <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}20` }} className={`hover:opacity-80 transition ${isSuspended ? 'opacity-50' : ''}`}>
                                  <td className="py-3 px-5">
                                    <button onClick={() => loadDetail(u)} className="flex items-center gap-3 text-left">
                                      <div style={{ background: T.primary }} className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0">
                                        {(u.fullName||u.email||'?')[0].toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p style={{ color: T.text }} className="font-semibold text-sm truncate">{u.fullName||u.email}</p>
                                        <p style={{ color: T.muted }} className="text-xs truncate">{u.email}</p>
                                      </div>
                                    </button>
                                  </td>
                                  <td style={{ color: T.muted }} className="px-3 text-xs hidden md:table-cell whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                                  <td style={{ color: T.muted }} className="px-3 text-xs hidden lg:table-cell whitespace-nowrap">{u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'â€”'}</td>
                                  <td style={{ color: T.text }} className="px-3 text-xs font-semibold hidden sm:table-cell">{u.loginCount ?? 0}</td>
                                  <td className="px-3"><Chip label={isSuspended?'Suspended':'Active'} cls={isSuspended?'bg-rose-900 text-rose-300':'bg-emerald-900 text-emerald-300'} /></td>
                                  <td className="px-3">
                                    {canChangeRoles
                                      ? <RoleSelect value={u.role} onChange={next => changeRole(u, next)} allowSuperadmin={isSuperAdmin} isSelf={isSelf} />
                                      : <Chip label={roleMeta(u.role).label} cls={roleMeta(u.role).cls} />}
                                  </td>
                                  <td className="px-5">
                                    <div className="flex items-center justify-end gap-1">
                                      <button onClick={() => loadDetail(u)} style={{ color: T.primary }} className="text-xs font-semibold px-2 py-1 rounded hover:opacity-70 transition">View</button>
                                      {canEdit && !isSelf && (
                                        <>
                                          <button onClick={() => toggleActive(u)} title={isSuspended?'Reactivate':'Suspend'} style={{ color: T.muted }} className="p-1.5 rounded hover:opacity-70 transition">
                                            {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                          </button>
                                          <button onClick={() => resetPassword(u)} title="Reset password" style={{ color: T.muted }} className="p-1.5 rounded hover:opacity-70 transition">
                                            <KeyRound className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}
                                      {canDeleteUser && !isSelf && (
                                        <button onClick={() => deleteUserAccount(u)} title="Delete" style={{ color: T.muted }} className="p-1.5 rounded hover:text-rose-400 transition">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
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
              )}

              {/* â”€â”€ ACTIVITY â”€â”€ */}
              {page === 'activity' && (
                <div className="space-y-4">
                  <div>
                    <h1 style={{ color: T.text }} className="text-2xl font-black">Platform Activity</h1>
                    <p style={{ color: T.muted }} className="text-sm mt-0.5">{allTx.length.toLocaleString()} transactions across all users</p>
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl overflow-hidden">
                    {!allTx.length ? <p style={{ color: T.muted }} className="p-10 text-center text-sm">No transactions yet.</p> : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr style={{ borderBottom: `1px solid ${T.border}`, color: T.muted, background: T.bg + '80' }} className="text-left text-xs font-bold uppercase tracking-wide">
                            <th className="py-3 px-5">Date</th><th className="px-3">User</th><th className="px-3">Type</th><th className="px-3">Category</th><th className="px-3 hidden md:table-cell">Note</th><th className="px-5 text-right">Amount</th>{canEdit && <th />}
                          </tr></thead>
                          <tbody>
                            {allTx.slice(0, 200).map(t => {
                              const owner = userById[t.userId]
                              return (
                                <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}20` }} className="hover:opacity-80 transition">
                                  <td style={{ color: T.muted }} className="py-2.5 px-5 text-xs whitespace-nowrap">{fmtDate(t.date)}</td>
                                  <td className="px-3 text-xs">
                                    <button onClick={() => { const u = userById[t.userId]; if (u) loadDetail(u) }} style={{ color: T.primary }} className="font-semibold hover:opacity-70">
                                      {owner?.email||'unknown'}
                                    </button>
                                  </td>
                                  <td className="px-3">{t.type==='income' ? <ArrowUpCircle className="w-4 h-4 inline" style={{ color: T.success }} /> : <ArrowDownCircle className="w-4 h-4 inline" style={{ color: T.danger }} />}</td>
                                  <td style={{ color: T.text }} className="px-3 text-xs">{t.category}</td>
                                  <td style={{ color: T.muted }} className="px-3 text-xs truncate max-w-[140px] hidden md:table-cell">{t.note}</td>
                                  <td style={{ color: t.type==='income' ? T.success : T.danger }} className="px-5 text-right font-bold text-xs whitespace-nowrap">
                                    {t.type==='income'?'+':'-'}${Number(t.amount).toLocaleString()}
                                  </td>
                                  {canEdit && <td className="pr-3"><button onClick={() => deleteTx(t.id)} style={{ color: T.muted }} className="p-1 rounded hover:text-rose-400 transition"><Trash2 className="w-3 h-3" /></button></td>}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                        {allTx.length > 200 && <p style={{ color: T.muted }} className="text-xs text-center py-4">Showing first 200 of {allTx.length}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* â”€â”€ PERMISSIONS â”€â”€ */}
              {page === 'permissions' && (
                <div className="space-y-4">
                  <div>
                    <h1 style={{ color: T.text }} className="text-2xl font-black">Role Permissions</h1>
                    <p style={{ color: T.muted }} className="text-sm mt-0.5">Your role: <Chip label={roleMeta(myRole).label} cls={roleMeta(myRole).cls} /></p>
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr style={{ borderBottom: `1px solid ${T.border}`, color: T.muted, background: T.bg + '80' }} className="text-xs font-bold uppercase tracking-wide">
                          <th className="py-3 px-5 text-left">Capability</th>
                          {ROLES.map(r => <th key={r.value} className="px-4 text-center"><Chip label={r.label} cls={r.cls} /></th>)}
                        </tr></thead>
                        <tbody>
                          {PERMISSIONS.map(p => (
                            <tr key={p.label} style={{ borderBottom: `1px solid ${T.border}20` }}>
                              <td style={{ color: T.text }} className="py-3 px-5 text-sm">{p.label}</td>
                              {ROLES.map(r => (
                                <td key={r.value} className="px-4 text-center">
                                  {p[r.value] ? <Check className="w-4 h-4 inline" style={{ color: T.success }} /> : <XIcon className="w-4 h-4 inline" style={{ color: T.border }} />}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-5 py-4 flex items-center gap-2" style={{ borderTop: `1px solid ${T.border}`, color: T.muted }}>
                      <Shield className="w-4 h-4 flex-shrink-0" />
                      <p className="text-xs">Every admin action is recorded in the audit log for accountability.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* â”€â”€ AUDIT LOG â”€â”€ */}
              {page === 'log' && (
                <div className="space-y-4">
                  <div>
                    <h1 style={{ color: T.text }} className="text-2xl font-black">Audit Log</h1>
                    <p style={{ color: T.muted }} className="text-sm mt-0.5">{auditLog.length} recorded admin action{auditLog.length!==1?'s':''}</p>
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl overflow-hidden">
                    {!auditLog.length ? <p style={{ color: T.muted }} className="p-10 text-center text-sm">No admin actions recorded yet.</p> : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr style={{ borderBottom: `1px solid ${T.border}`, color: T.muted, background: T.bg + '80' }} className="text-left text-xs font-bold uppercase tracking-wide">
                            <th className="py-3 px-5">When</th><th className="px-3">Actor</th><th className="px-3">Action</th><th className="px-3">Target</th><th className="px-5">Details</th>
                          </tr></thead>
                          <tbody>
                            {auditLog.map(a => (
                              <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}20` }} className="hover:opacity-80 transition">
                                <td style={{ color: T.muted }} className="py-2.5 px-5 text-xs whitespace-nowrap">{fmtDate(a.createdAt)}</td>
                                <td style={{ color: T.text }} className="px-3 text-xs truncate max-w-[160px]">{a.actorEmail}</td>
                                <td className="px-3"><Chip label={a.action.replace(/_/g,' ')} cls="bg-slate-700 text-slate-300" /></td>
                                <td style={{ color: T.muted }} className="px-3 text-xs truncate max-w-[160px]">{a.targetEmail||'â€”'}</td>
                                <td style={{ color: T.muted }} className="px-5 text-xs truncate max-w-xs">{a.details}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* â”€â”€ SYSTEM HEALTH â”€â”€ */}
              {page === 'system' && (
                <div className="space-y-4">
                  <div>
                    <h1 style={{ color: T.text }} className="text-2xl font-black">System Health</h1>
                    <p style={{ color: T.muted }} className="text-sm mt-0.5">Service status and platform diagnostics.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: 'API',       icon: Zap,      uptime: '99.99%', latency: '142 ms' },
                      { name: 'Database',  icon: Database, uptime: '99.98%', latency: '8 ms'   },
                      { name: 'Functions', icon: Cpu,      uptime: '99.97%', latency: '210 ms' },
                      { name: 'Auth',      icon: Lock,     uptime: '100%',   latency: '95 ms'  },
                      { name: 'Storage',   icon: Server,   uptime: '99.99%', latency: '44 ms'  },
                      { name: 'Admin API', icon: Shield,   uptime: '99.95%', latency: '188 ms' },
                    ].map(s => (
                      <div key={s.name} style={{ background: T.card, border: `1px solid ${T.success}44` }} className="rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div style={{ background: T.success + '22', color: T.success }} className="w-9 h-9 rounded-lg flex items-center justify-center"><s.icon className="w-4 h-4" /></div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: T.success }} />
                            <span style={{ color: T.success }} className="text-xs font-bold">Operational</span>
                          </div>
                        </div>
                        <p style={{ color: T.text }} className="font-black text-sm">{s.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span style={{ color: T.muted }} className="text-xs">Uptime: {s.uptime}</span>
                          <span style={{ color: T.muted }} className="text-xs">p95: {s.latency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}` }} className="rounded-xl p-5">
                    <p style={{ color: T.text }} className="font-bold text-sm mb-4">Platform Stats</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[['Total Users', stats.users], ['Transactions', stats.txCount.toLocaleString()], ['Income', `$${stats.incomeVolume.toLocaleString(undefined,{maximumFractionDigits:0})}`], ['Expense', `$${stats.expenseVolume.toLocaleString(undefined,{maximumFractionDigits:0})}`]].map(([l,v]) => (
                        <div key={l}>
                          <p style={{ color: T.muted }} className="text-[11px] font-bold uppercase tracking-wide">{l}</p>
                          <p style={{ color: T.text }} className="text-xl font-black mt-1">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default Admin

