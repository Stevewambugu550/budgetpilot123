import { useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, PiggyBank, AlertTriangle } from 'lucide-react'
import Modal from '../components/Modal'
import { addBudget, updateBudget, deleteBudget } from '../lib/storage'
import { fmtMoney, ymKey } from '../lib/format'
import { EXPENSE_CATEGORIES, catMeta } from '../lib/categories'
import { useToast } from '../context/ToastContext'

const empty = () => ({ category: EXPENSE_CATEGORIES[0].id, monthlyLimit: '' })

const Budgets = ({ data }) => {
  const { budgets, transactions, settings } = data
  const cur = settings.currency
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty())

  const thisYM = ymKey(new Date().toISOString())

  const spendByCategory = useMemo(() => {
    const map = new Map()
    for (const t of transactions) {
      if (t.type !== 'expense' || ymKey(t.date) !== thisYM) continue
      map.set(t.category, (map.get(t.category) || 0) + t.amount)
    }
    return map
  }, [transactions, thisYM])

  const usedCategories = new Set(budgets.map(b => b.category))
  const availableCategories = EXPENSE_CATEGORIES.filter(c => !usedCategories.has(c.id) || modal?.mode === 'edit')

  const totalBudget = budgets.reduce((s, b) => s + (b.monthlyLimit || 0), 0)
  const totalSpent  = budgets.reduce((s, b) => s + (spendByCategory.get(b.category) || 0), 0)

  const open = (b = null) => {
    setForm(b ? { ...b, monthlyLimit: String(b.monthlyLimit) } : empty())
    setModal({ mode: b ? 'edit' : 'new', b })
  }
  const close = () => { setModal(null); setForm(empty()) }

  const save = () => {
    const limit = Number(form.monthlyLimit)
    if (!limit || limit <= 0) return toast.error('Enter a monthly limit greater than zero')
    const payload = { category: form.category, monthlyLimit: limit }
    if (modal.mode === 'new') {
      addBudget(payload)
      toast.success(`Budget added for ${form.category}`)
    } else {
      updateBudget(modal.b.id, payload)
      toast.success('Budget updated')
    }
    close()
  }

  const remove = (id, category) => {
    if (!confirm(`Delete the budget for ${category}?`)) return
    deleteBudget(id)
    toast.info(`Budget for ${category} removed`)
    close()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Budgets</h1>
          <p className="text-slate-500 text-sm mt-1">Set monthly limits per category and track how you're doing.</p>
        </div>
        <button onClick={() => open()} disabled={!availableCategories.length} className="btn-primary disabled:opacity-50">
          <Plus className="w-4 h-4" /> New budget
        </button>
      </div>

      {budgets.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total budgeted this month</p>
            <PiggyBank className="w-5 h-5 text-brand-600" />
          </div>
          <p className="text-2xl font-black">{fmtMoney(totalSpent, cur)} <span className="text-sm text-slate-400 font-semibold">/ {fmtMoney(totalBudget, cur)}</span></p>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all ${totalSpent > totalBudget ? 'bg-gradient-to-r from-rose-400 to-rose-600' : 'bg-gradient-to-r from-brand-400 to-brand-600'}`}
              style={{ width: `${totalBudget ? Math.min(100, (totalSpent / totalBudget) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {budgets.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 mx-auto bg-brand-50 rounded-2xl flex items-center justify-center mb-3"><PiggyBank className="w-8 h-8 text-brand-600" /></div>
          <p className="font-bold">No budgets yet</p>
          <p className="text-slate-500 text-sm mt-1">Set a monthly limit for a category to start tracking your spending against it.</p>
          <button onClick={() => open()} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Create a budget</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(b => {
            const spent = spendByCategory.get(b.category) || 0
            const pct = b.monthlyLimit > 0 ? Math.min(100, (spent / b.monthlyLimit) * 100) : 0
            const over = spent > b.monthlyLimit
            const meta = catMeta(b.category, 'expense')
            return (
              <div key={b.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-3xl">{meta.icon}</div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{b.category}</p>
                      <p className="text-xs text-slate-500">Monthly limit</p>
                    </div>
                  </div>
                  <div className="flex">
                    <button onClick={() => open(b)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Edit2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <p className={`text-xl font-black ${over ? 'text-rose-600' : ''}`}>{fmtMoney(spent, cur)}</p>
                    <p className="text-xs text-slate-500 font-semibold">of {fmtMoney(b.monthlyLimit, cur)}</p>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div className={`h-full rounded-full transition-all ${over ? 'bg-gradient-to-r from-rose-400 to-rose-600' : pct > 80 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-brand-400 to-brand-600'}`} style={{ width: `${pct}%` }} />
                  </div>
                  {over ? (
                    <p className="text-xs text-rose-600 mt-1.5 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {fmtMoney(spent - b.monthlyLimit, cur)} over budget
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1.5 font-semibold">{pct.toFixed(0)}% used · {fmtMoney(b.monthlyLimit - spent, cur)} left</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={close}
        title={modal?.mode === 'edit' ? 'Edit budget' : 'New budget'}
        footer={
          <>
            {modal?.mode === 'edit' && <button onClick={() => remove(modal.b.id, modal.b.category)} className="btn-danger mr-auto"><Trash2 className="w-4 h-4" /> Delete</button>}
            <button onClick={close} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              disabled={modal?.mode === 'edit'}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {availableCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.id}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Monthly limit</label>
            <input type="number" min="0" autoFocus className="input" value={form.monthlyLimit} onChange={e => setForm(f => ({ ...f, monthlyLimit: e.target.value }))} placeholder="0" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Budgets
