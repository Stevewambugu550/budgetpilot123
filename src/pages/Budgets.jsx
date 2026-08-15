import { useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, PiggyBank, AlertTriangle } from 'lucide-react'
import Modal from '../components/Modal'
import { addBudget, updateBudget, deleteBudget } from '../lib/storage'
import { fmtMoney, ymKey } from '../lib/format'
import { EXPENSE_CATEGORIES, catMeta } from '../lib/categories'
import { useToast } from '../context/ToastContext'

const BUCKET_META = {
  need: {
    label: 'Needs',
    ideal: 50,
    icon: '💙',
    desc: 'Rent, utilities, groceries, transport and healthcare',
    color: '#3b82f6',
    lightBg: '#eff6ff',
    textColor: '#1d4ed8',
    badgeBg: '#dbeafe',
  },
  want: {
    label: 'Wants',
    ideal: 30,
    icon: '💜',
    desc: 'Dining out, streaming, hobbies, shopping and travel',
    color: '#7c3aed',
    lightBg: '#f5f3ff',
    textColor: '#6d28d9',
    badgeBg: '#ede9fe',
  },
  savings: {
    label: 'Savings',
    ideal: 20,
    icon: '💚',
    desc: 'Emergency fund, investments, goals and financial freedom',
    color: '#059669',
    lightBg: '#ecfdf5',
    textColor: '#047857',
    badgeBg: '#d1fae5',
  },
}

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

  const enriched = useMemo(() => budgets.map(b => {
    const meta = catMeta(b.category, 'expense')
    const spent = spendByCategory.get(b.category) || 0
    const pct = b.monthlyLimit > 0 ? Math.min(100, (spent / b.monthlyLimit) * 100) : 0
    const bucket = meta.bucket || 'want'
    return { ...b, meta, spent, pct, over: spent > b.monthlyLimit, bucket }
  }), [budgets, spendByCategory])

  const grouped = useMemo(() => {
    const g = { need: [], want: [], savings: [] }
    for (const b of enriched) {
      if (g[b.bucket]) g[b.bucket].push(b)
      else g.want.push(b)
    }
    return g
  }, [enriched])

  const bucketTotals = useMemo(() => {
    const t = {}
    for (const [key, items] of Object.entries(grouped)) {
      t[key] = {
        budget: items.reduce((s, b) => s + b.monthlyLimit, 0),
        spent:  items.reduce((s, b) => s + b.spent, 0),
        count:  items.length,
      }
    }
    return t
  }, [grouped])

  const totalBudget = enriched.reduce((s, b) => s + b.monthlyLimit, 0)
  const totalSpent  = enriched.reduce((s, b) => s + b.spent, 0)

  const open = (b = null) => {
    setForm(b ? { ...b, monthlyLimit: String(b.monthlyLimit) } : empty())
    setModal({ mode: b ? 'edit' : 'new', b })
  }
  const close = () => { setModal(null); setForm(empty()) }

  const save = async () => {
    const limit = Number(form.monthlyLimit)
    if (!limit || limit <= 0) return toast.error('Enter a monthly limit greater than zero')
    const payload = { category: form.category, monthlyLimit: limit }
    try {
      if (modal.mode === 'new') {
        await addBudget(payload)
        toast.success(`Budget added for ${form.category}`)
      } else {
        await updateBudget(modal.b.id, payload)
        toast.success('Budget updated')
      }
      close()
    } catch { toast.error('Something went wrong — try again') }
  }

  const remove = async (id, category) => {
    if (!confirm(`Delete the budget for ${category}?`)) return
    try {
      await deleteBudget(id)
      toast.info(`Budget for ${category} removed`)
      close()
    } catch { toast.error('Something went wrong — try again') }
  }

  const formBucket = () => {
    const meta = catMeta(form.category, 'expense')
    return meta.bucket ? BUCKET_META[meta.bucket] : null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Budgets</h1>
          <p className="text-slate-500 text-sm mt-1">Organize your spending envelopes by Needs, Wants and Savings using the 50/30/20 rule.</p>
        </div>
        <button onClick={() => open()} disabled={!availableCategories.length} className="btn-primary disabled:opacity-50">
          <Plus className="w-4 h-4" /> New envelope
        </button>
      </div>

      {/* Monthly summary card */}
      {budgets.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Total</p>
              <p className="text-2xl font-black mt-0.5">
                {fmtMoney(totalSpent, cur)}
                <span className="text-sm text-slate-400 font-semibold ml-2">of {fmtMoney(totalBudget, cur)} budgeted</span>
              </p>
            </div>
            <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-brand-600" />
            </div>
          </div>

          {/* 3 bucket summary blocks */}
          <div className="grid sm:grid-cols-3 gap-3">
            {Object.entries(BUCKET_META).map(([key, bk]) => {
              const tot = bucketTotals[key] || { budget: 0, spent: 0, count: 0 }
              const pct = tot.budget > 0 ? Math.min(100, (tot.spent / tot.budget) * 100) : 0
              return (
                <div key={key} style={{ background: bk.lightBg }} className="rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{bk.icon}</span>
                    <p className="font-black text-sm" style={{ color: bk.textColor }}>{bk.label}</p>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: bk.badgeBg, color: bk.textColor }}>
                      {bk.ideal}% ideal
                    </span>
                  </div>
                  <p className="text-xl font-black text-slate-900">{fmtMoney(tot.spent, cur)}</p>
                  <p className="text-xs text-slate-500 mt-0.5 mb-2">of {fmtMoney(tot.budget, cur)}</p>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 100 ? '#ef4444' : bk.color }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">{pct.toFixed(0)}% used · {tot.count} envelope{tot.count !== 1 ? 's' : ''}</p>
                </div>
              )
            })}
          </div>

          {/* Combined allocation bar */}
          <div className="mt-5">
            <div className="flex rounded-full overflow-hidden h-2.5 bg-slate-100">
              {Object.entries(BUCKET_META).map(([key, bk]) => {
                const pct = totalBudget > 0 ? ((bucketTotals[key]?.budget || 0) / totalBudget) * 100 : 0
                return <div key={key} style={{ width: `${pct}%`, background: bk.color }} />
              })}
            </div>
            <div className="flex items-center gap-5 mt-2">
              {Object.entries(BUCKET_META).map(([key, bk]) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: bk.color }} />
                  {bk.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {budgets.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
            <PiggyBank className="w-8 h-8 text-brand-600" />
          </div>
          <p className="font-black text-xl">No envelopes yet</p>
          <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
            Create budget envelopes organized by Needs (50%), Wants (30%), and Savings (20%) — the proven 50/30/20 rule.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            {Object.entries(BUCKET_META).map(([key, bk]) => (
              <div key={key} className="rounded-xl px-3 py-2 text-xs font-bold" style={{ color: bk.textColor, background: bk.lightBg }}>
                {bk.icon} {bk.label} {bk.ideal}%
              </div>
            ))}
          </div>
          <button onClick={() => open()} className="btn-primary mt-5"><Plus className="w-4 h-4" /> Create first envelope</button>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(BUCKET_META).map(([key, bk]) => {
            const items = grouped[key]
            if (!items.length) return null
            const tot = bucketTotals[key]
            const pct = tot.budget > 0 ? Math.min(100, (tot.spent / tot.budget) * 100) : 0
            return (
              <div key={key}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{bk.icon}</span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-xl" style={{ color: bk.textColor }}>{bk.label}</h2>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: bk.badgeBg, color: bk.textColor }}>
                        {bk.ideal}% of income ideal
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{bk.desc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm text-slate-800">{fmtMoney(tot.spent, cur)}</p>
                    <p className="text-xs text-slate-400">of {fmtMoney(tot.budget, cur)}</p>
                  </div>
                </div>

                {/* Section progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: '#f1f5f9' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 100 ? '#ef4444' : bk.color }} />
                </div>

                {/* Budget cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(b => (
                    <div key={b.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border-2"
                      style={{ borderColor: b.over ? '#fecaca' : bk.color + '33' }}>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: bk.lightBg }}>
                              {b.meta.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black truncate">{b.category}</p>
                              <p className="text-xs text-slate-400 mt-0.5">Monthly envelope</p>
                            </div>
                          </div>
                          <button onClick={() => open(b)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-baseline justify-between mb-2.5">
                          <p className={`text-2xl font-black ${b.over ? 'text-rose-600' : 'text-slate-900'}`}>
                            {fmtMoney(b.spent, cur)}
                          </p>
                          <p className="text-xs text-slate-400 font-semibold">of {fmtMoney(b.monthlyLimit, cur)}</p>
                        </div>

                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${b.pct}%`, background: b.over ? '#ef4444' : b.pct > 80 ? '#f59e0b' : bk.color }}
                          />
                        </div>

                        {b.over ? (
                          <p className="text-xs text-rose-600 mt-2 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {fmtMoney(b.spent - b.monthlyLimit, cur)} over budget
                          </p>
                        ) : (
                          <p className="text-xs mt-2 font-semibold" style={{ color: bk.textColor }}>
                            {b.pct.toFixed(0)}% used · {fmtMoney(b.monthlyLimit - b.spent, cur)} remaining
                          </p>
                        )}
                      </div>
                      {/* Color footer accent */}
                      <div className="h-1" style={{ background: b.over ? '#ef4444' : bk.color, opacity: 0.5 }} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={!!modal}
        onClose={close}
        title={modal?.mode === 'edit' ? 'Edit envelope' : 'New envelope'}
        footer={
          <>
            {modal?.mode === 'edit' && (
              <button onClick={() => remove(modal.b.id, modal.b.category)} className="btn-danger mr-auto">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
            <button onClick={close} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </>
        }
      >
        <div className="space-y-4">
          {(() => {
            const bk = formBucket()
            return bk ? (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl" style={{ background: bk.lightBg }}>
                <span className="text-lg">{bk.icon}</span>
                <p className="text-xs font-bold" style={{ color: bk.textColor }}>
                  {bk.label} · {bk.ideal}% of income recommended
                </p>
              </div>
            ) : null
          })()}
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              disabled={modal?.mode === 'edit'}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {availableCategories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Monthly limit</label>
            <input
              type="number"
              min="0"
              autoFocus
              className="input"
              value={form.monthlyLimit}
              onChange={e => setForm(f => ({ ...f, monthlyLimit: e.target.value }))}
              placeholder="0"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Budgets
