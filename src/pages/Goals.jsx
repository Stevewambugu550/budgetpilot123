import { useState } from 'react'
import { Plus, Edit2, Trash2, Target, Plane, Calendar } from 'lucide-react'
import Modal from '../components/Modal'
import { addGoal, updateGoal, deleteGoal, contributeGoal } from '../lib/storage'
import { fmtMoney, fmtDate, daysUntil } from '../lib/format'

const ICONS = ['🎯', '🏠', '🚗', '✈️', '🎓', '💍', '👶', '🩺', '💻', '📱', '🐷', '🏖️', '💼', '🛠️']

const empty = () => ({ name: '', target: '', saved: '', deadline: '', category: '🎯', note: '' })

const Goals = ({ data }) => {
  const { goals, settings } = data
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty())
  const [contrib, setContrib] = useState({ open: false, id: null, amount: '' })

  const open = (g = null) => {
    setForm(g ? { ...g, target: String(g.target), saved: String(g.saved) } : empty())
    setModal({ mode: g ? 'edit' : 'new', g })
  }
  const close = () => { setModal(null); setForm(empty()) }
  const save = () => {
    if (!form.name.trim()) return alert('Name your goal')
    const payload = { ...form, target: Number(form.target) || 0, saved: Number(form.saved) || 0 }
    if (modal.mode === 'new') addGoal(payload)
    else updateGoal(modal.g.id, payload)
    close()
  }
  const remove = (id) => { if (confirm('Delete this goal?')) { deleteGoal(id); close() } }

  const doContrib = () => {
    const amt = Number(contrib.amount) || 0
    if (amt <= 0) return alert('Enter an amount')
    contributeGoal(contrib.id, amt)
    setContrib({ open: false, id: null, amount: '' })
  }

  const cur = settings.currency

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Goals & Targets</h1>
          <p className="text-slate-500 text-sm mt-1">Pick a number, hit a deadline, win.</p>
        </div>
        <button onClick={() => open()} className="btn-primary"><Plus className="w-4 h-4" /> New goal</button>
      </div>

      {goals.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 mx-auto bg-brand-50 rounded-2xl flex items-center justify-center mb-3"><Target className="w-8 h-8 text-brand-600" /></div>
          <p className="font-bold">No goals yet</p>
          <p className="text-slate-500 text-sm mt-1">Set your first savings target — house, car, trip, anything.</p>
          <button onClick={() => open()} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Create a goal</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(g => {
            const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0
            const days = daysUntil(g.deadline)
            return (
              <div key={g.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-3xl">{g.category}</div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{g.name}</p>
                      {g.deadline && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(g.deadline)}
                          {days !== null && (
                            <span className={`ml-1 font-bold ${days < 0 ? 'text-rose-600' : days < 30 ? 'text-amber-600' : 'text-slate-500'}`}>
                              ({days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex">
                    <button onClick={() => open(g)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Edit2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xl font-black">{fmtMoney(g.saved, cur)}</p>
                    <p className="text-xs text-slate-500 font-semibold">of {fmtMoney(g.target, cur)}</p>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 font-semibold">{pct.toFixed(0)}% complete</p>
                </div>
                <button onClick={() => setContrib({ open: true, id: g.id, amount: '' })} className="btn-ghost w-full mt-3">
                  <Plus className="w-4 h-4" /> Add savings
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={close}
        title={modal?.mode === 'edit' ? 'Edit goal' : 'New goal'}
        footer={
          <>
            {modal?.mode === 'edit' && <button onClick={() => remove(modal.g.id)} className="btn-danger mr-auto"><Trash2 className="w-4 h-4" /> Delete</button>}
            <button onClick={close} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Goal name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. New car deposit" autoFocus />
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="grid grid-cols-7 gap-2">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, category: ic }))}
                  className={`text-2xl py-2 rounded-xl border-2 ${form.category === ic ? 'border-brand-500 bg-brand-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>{ic}</button>
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
            <input className="input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal open={contrib.open} onClose={() => setContrib({ open: false, id: null, amount: '' })}
        title="Add to goal"
        size="sm"
        footer={
          <>
            <button onClick={() => setContrib({ open: false, id: null, amount: '' })} className="btn-ghost">Cancel</button>
            <button onClick={doContrib} className="btn-primary">Add</button>
          </>
        }
      >
        <label className="label">Amount to add</label>
        <input type="number" min="0" autoFocus className="input" value={contrib.amount} onChange={e => setContrib(c => ({ ...c, amount: e.target.value }))} placeholder="0" />
      </Modal>
    </div>
  )
}

export default Goals
