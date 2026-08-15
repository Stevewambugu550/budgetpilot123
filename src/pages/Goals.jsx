import { useState } from 'react'
import { Plus, Edit2, Trash2, Target, Calendar, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import Modal from '../components/Modal'
import { addGoal, updateGoal, deleteGoal, contributeGoal } from '../lib/storage'
import { fmtMoney, fmtDate, daysUntil } from '../lib/format'
import { useToast } from '../context/ToastContext'

const ICONS = ['🎯', '🏠', '🚗', '✈️', '🎓', '💍', '👶', '🩺', '💻', '📱', '🐷', '🏖️', '💼', '🛠️']

const empty = () => ({ name: '', target: '', saved: '', deadline: '', category: '🎯', note: '' })

const RingProgress = ({ pct, size = 88, done = false }) => {
  const stroke = 7
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, pct) / 100) * c
  const color = done ? '#059669' : pct >= 80 ? '#f59e0b' : '#0a9659'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  )
}

const Goals = ({ data }) => {
  const { goals, settings } = data
  const cur = settings.currency
  const toast = useToast()
  const [modal, setModal]   = useState(null)
  const [form, setForm]     = useState(empty())
  const [contrib, setContrib] = useState({ open: false, id: null, amount: '' })
  const [busy, setBusy]     = useState(false)

  const open = (g = null) => {
    setForm(g ? { ...g, target: String(g.target), saved: String(g.saved) } : empty())
    setModal({ mode: g ? 'edit' : 'new', g })
  }
  const close = () => { setModal(null); setForm(empty()) }

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name your goal first')
    setBusy(true)
    try {
      const payload = { ...form, target: Number(form.target) || 0, saved: Number(form.saved) || 0 }
      if (modal.mode === 'new') { await addGoal(payload); toast.success('Goal created!') }
      else { await updateGoal(modal.g.id, payload); toast.success('Goal updated') }
      close()
    } catch { toast.error('Something went wrong — try again') }
    finally { setBusy(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this goal?')) return
    await deleteGoal(id)
    toast.info('Goal deleted')
    close()
  }

  const doContrib = async () => {
    const amt = Number(contrib.amount) || 0
    if (amt <= 0) return toast.error('Enter an amount greater than zero')
    setBusy(true)
    try {
      await contributeGoal(contrib.id, amt)
      toast.success(`${fmtMoney(amt, cur)} added to your goal 🎉`)
      setContrib({ open: false, id: null, amount: '' })
    } catch { toast.error('Something went wrong — try again') }
    finally { setBusy(false) }
  }

  const done  = goals.filter(g => g.target > 0 && g.saved >= g.target)
  const active = goals.filter(g => !(g.target > 0 && g.saved >= g.target))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Goals & Targets</h1>
          <p className="text-slate-500 text-sm mt-1">Pick a number, set a deadline, and watch your progress grow.</p>
        </div>
        <button onClick={() => open()} className="btn-primary">
          <Plus className="w-4 h-4" /> New goal
        </button>
      </div>

      {/* Summary strip */}
      {goals.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'Active goals', value: active.length, icon: '🎯', color: '#0a9659' },
            { label: 'Completed', value: done.length, icon: '✅', color: '#059669' },
            { label: 'Total saved', value: fmtMoney(goals.reduce((s, g) => s + g.saved, 0), cur), icon: '💰', color: '#3b82f6' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-50 flex-shrink-0">{s.icon}</div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
                <p className="text-xl font-black text-slate-900" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="card p-14 text-center">
          <div className="w-20 h-20 mx-auto bg-brand-50 rounded-3xl flex items-center justify-center mb-5">
            <Target className="w-10 h-10 text-brand-600" />
          </div>
          <p className="font-black text-xl">No goals yet</p>
          <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
            Set your first savings target — a house deposit, dream vacation, emergency fund, or anything else.
          </p>
          <button onClick={() => open()} className="btn-primary mt-6">
            <Plus className="w-4 h-4" /> Create your first goal
          </button>
        </div>
      )}

      {/* Active goals */}
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">In progress</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {active.map(g => {
              const pct  = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0
              const days = daysUntil(g.deadline)
              const remaining = Math.max(0, g.target - g.saved)
              return (
                <div key={g.id} className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="min-w-0">
                        <p className="font-black text-base truncate">{g.name}</p>
                        {g.deadline && (
                          <div className={`inline-flex items-center gap-1 text-[11px] font-bold mt-1 px-2 py-0.5 rounded-full ${
                            days === null ? 'bg-slate-100 text-slate-500'
                            : days < 0   ? 'bg-rose-100 text-rose-600'
                            : days < 30  ? 'bg-amber-100 text-amber-600'
                            : 'bg-slate-100 text-slate-500'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {days === null ? fmtDate(g.deadline)
                              : days < 0  ? `${Math.abs(days)}d overdue`
                              : days === 0 ? 'Due today'
                              : `${days}d left`}
                          </div>
                        )}
                        {g.note && <p className="text-xs text-slate-400 mt-1 truncate">{g.note}</p>}
                      </div>
                      <button onClick={() => open(g)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Ring + amounts */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative flex-shrink-0">
                        <RingProgress pct={pct} size={80} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg leading-none">{g.category}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-2xl font-black text-slate-900 leading-none">{fmtMoney(g.saved, cur)}</p>
                        <p className="text-xs text-slate-400 mt-1">of <span className="font-bold text-slate-600">{fmtMoney(g.target, cur)}</span></p>
                        <p className="text-xs font-bold text-brand-600 mt-1">{pct.toFixed(0)}% complete</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: pct >= 80 ? '#f59e0b' : '#0a9659' }} />
                    </div>
                    <p className="text-xs text-slate-400 font-semibold mb-4">{fmtMoney(remaining, cur)} remaining</p>

                    {/* Add savings */}
                    <button
                      onClick={() => setContrib({ open: true, id: g.id, amount: '' })}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add savings
                    </button>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${pct}%`, minWidth: pct > 0 ? 8 : 0 }} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed goals */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-emerald-600 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Completed
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {done.map(g => (
              <div key={g.id} className="bg-gradient-to-br from-emerald-50 to-white rounded-3xl border-2 border-emerald-200 p-5 relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">{g.category}</div>
                  <div>
                    <p className="font-black truncate">{g.name}</p>
                    <p className="text-xs text-emerald-600 font-bold">Goal reached! 🎉</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-700">{fmtMoney(g.saved, cur)}</p>
                <p className="text-xs text-slate-400 mt-0.5">of {fmtMoney(g.target, cur)} target</p>
                <button onClick={() => open(g)} className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                  <Edit2 className="w-3 h-3 inline mr-1" />Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal modal */}
      <Modal open={!!modal} onClose={close}
        title={modal?.mode === 'edit' ? 'Edit goal' : 'New goal'}
        footer={
          <>
            {modal?.mode === 'edit' && (
              <button onClick={() => remove(modal.g.id)} className="btn-danger mr-auto">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
            <button onClick={close} className="btn-ghost">Cancel</button>
            <button onClick={save} disabled={busy} className="btn-primary">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Goal name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Emergency fund" autoFocus />
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="grid grid-cols-7 gap-2">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, category: ic }))}
                  className={`text-2xl py-2 rounded-xl border-2 transition ${form.category === ic ? 'border-brand-500 bg-brand-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target amount</label>
              <input type="number" min="0" className="input" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="label">Already saved</label>
              <input type="number" min="0" className="input" value={form.saved} onChange={e => setForm(f => ({ ...f, saved: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="label">Deadline (optional)</label>
            <input type="date" className="input" value={form.deadline || ''} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input className="input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Add a note…" />
          </div>
        </div>
      </Modal>

      {/* Contribute modal */}
      <Modal open={contrib.open} onClose={() => setContrib({ open: false, id: null, amount: '' })}
        title="Add savings to goal"
        size="sm"
        footer={
          <>
            <button onClick={() => setContrib({ open: false, id: null, amount: '' })} className="btn-ghost">Cancel</button>
            <button onClick={doContrib} disabled={busy} className="btn-primary">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </>
        }
      >
        <div>
          <label className="label">Amount to add ({cur})</label>
          <input type="number" min="0" autoFocus className="input text-lg font-bold" value={contrib.amount}
            onChange={e => setContrib(c => ({ ...c, amount: e.target.value }))} placeholder="0.00" />
          <p className="text-xs text-slate-400 mt-2">This will be added to your saved amount and your progress updated instantly.</p>
        </div>
      </Modal>
    </div>
  )
}

export default Goals
