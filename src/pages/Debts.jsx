import { useState, useMemo } from 'react'
import { Plus, TrendingDown, Edit2, Trash2, Info, ChevronDown } from 'lucide-react'
import { addDebt, updateDebt, deleteDebt } from '../lib/storage'
import { useToast } from '../context/ToastContext'

const TYPES = [
  { v: 'credit_card', l: 'Credit Card', icon: '💳' },
  { v: 'mortgage',    l: 'Mortgage',    icon: '🏠' },
  { v: 'car',         l: 'Car Loan',    icon: '🚗' },
  { v: 'student',     l: 'Student Loan',icon: '🎓' },
  { v: 'personal',    l: 'Personal Loan',icon: '💼' },
  { v: 'medical',     l: 'Medical',     icon: '🏥' },
  { v: 'other',       l: 'Other',       icon: '📄' },
]
const typeIcon = v => TYPES.find(t => t.v === v)?.icon || '📄'
const typeLabel = v => TYPES.find(t => t.v === v)?.l || v

const EMPTY_FORM = { name: '', debtType: 'credit_card', balance: '', interestRate: '', minimumPayment: '', dueDay: '', notes: '' }

const fmtMoney = (n, cur = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 0 }).format(n || 0)
const fmtPct   = n => `${Number(n || 0).toFixed(1)}%`

// months to pay off debt with fixed payment and APR
function calcPayoffMonths(balance, apr, payment) {
  if (!balance || balance <= 0) return 0
  const r = (apr / 100) / 12
  if (r === 0) return payment > 0 ? Math.ceil(balance / payment) : Infinity
  if (payment <= balance * r) return Infinity // payment doesn't cover interest
  return Math.ceil(-Math.log(1 - (balance * r / payment)) / Math.log(1 + r))
}

function monthsLabel(m) {
  if (!isFinite(m) || m <= 0) return 'Never (raise payment)'
  if (m < 12) return `${m} mo`
  const yrs = Math.floor(m / 12), mos = m % 12
  return mos ? `${yrs}y ${mos}mo` : `${yrs} yr${yrs > 1 ? 's' : ''}`
}

export default function Debts({ data }) {
  const toast = useToast()
  const { debts = [], settings } = data
  const currency = settings?.currency || 'USD'
  const [strategy, setStrategy] = useState('snowball') // snowball | avalanche
  const [extraPayment, setExtraPayment] = useState(0)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const open = (mode, debt = null) => {
    setForm(debt ? { name: debt.name, debtType: debt.debtType, balance: String(debt.balance), interestRate: String(debt.interestRate), minimumPayment: String(debt.minimumPayment), dueDay: String(debt.dueDay || ''), notes: debt.notes } : EMPTY_FORM)
    setModal({ mode, debt })
  }
  const close = () => { setModal(null); setForm(EMPTY_FORM) }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.name.trim()) return toast.error('Enter a debt name')
    if (!form.balance || Number(form.balance) <= 0) return toast.error('Enter a valid balance')
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), debtType: form.debtType, balance: Number(form.balance), interestRate: Number(form.interestRate) || 0, minimumPayment: Number(form.minimumPayment) || 0, dueDay: form.dueDay ? Number(form.dueDay) : null, notes: form.notes }
      if (modal.mode === 'new') { await addDebt(payload); toast.success('Debt added') }
      else { await updateDebt(modal.debt.id, payload); toast.success('Debt updated') }
      close()
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const remove = async (debt) => {
    if (!confirm(`Delete "${debt.name}"?`)) return
    try { await deleteDebt(debt.id); toast.info(`"${debt.name}" removed`) } catch { toast.error('Could not delete') }
  }

  const sorted = useMemo(() => {
    const extra = Number(extraPayment) || 0
    return [...debts].sort((a, b) =>
      strategy === 'snowball' ? a.balance - b.balance : b.interestRate - a.interestRate
    ).map((d, i) => {
      const addl = i === 0 ? extra : 0 // simplified: extra to first in order
      const payment = d.minimumPayment + addl
      return { ...d, payoffMonths: calcPayoffMonths(d.balance, d.interestRate, payment), monthlyInterest: (d.balance * d.interestRate / 100) / 12 }
    })
  }, [debts, strategy, extraPayment])

  const totalBalance = useMemo(() => debts.reduce((s, d) => s + d.balance, 0), [debts])
  const totalMinPayment = useMemo(() => debts.reduce((s, d) => s + d.minimumPayment, 0), [debts])
  const totalInterest = useMemo(() => debts.reduce((s, d) => s + (d.balance * d.interestRate / 100) / 12, 0), [debts])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Debt Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">Snowball or avalanche your way to financial freedom.</p>
        </div>
        <button onClick={() => open('new')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Debt
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Debt',       value: fmtMoney(totalBalance, currency),   sub: `across ${debts.length} debt${debts.length !== 1 ? 's' : ''}`, color: 'text-slate-900' },
          { label: 'Min. Payments',    value: fmtMoney(totalMinPayment, currency), sub: 'due each month',       color: 'text-rose-600'    },
          { label: 'Monthly Interest', value: fmtMoney(totalInterest, currency),   sub: 'cost of carrying debt', color: 'text-amber-600'  },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {debts.length === 0 ? (
        <div className="card p-16 text-center">
          <TrendingDown className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-bold text-slate-700">No debts tracked</p>
          <p className="text-sm text-slate-400 mt-1 mb-5">Add mortgages, student loans, credit cards, or any debt you're paying off.</p>
          <button onClick={() => open('new')} className="btn-primary mx-auto">Add your first debt</button>
        </div>
      ) : (
        <>
          {/* Strategy + Extra payment */}
          <div className="card p-5 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Payoff Strategy</p>
              <div className="flex gap-2">
                {[['snowball', 'Snowball', 'Lowest balance first'], ['avalanche', 'Avalanche', 'Highest interest first']].map(([v, l, tip]) => (
                  <button key={v} onClick={() => setStrategy(v)} title={tip}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${strategy === v ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-48">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Extra Monthly Payment</p>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">$</span>
                <input type="number" min="0" step="10" className="input w-32" value={extraPayment} onChange={e => setExtraPayment(e.target.value)} placeholder="0" />
                <span className="text-xs text-slate-400">applied to first debt in order</span>
              </div>
            </div>
          </div>

          {/* Debt list */}
          <div className="space-y-3">
            {sorted.map((debt, i) => {
              const pct = Math.min(100, totalBalance > 0 ? ((totalBalance - debt.balance) / totalBalance) * 100 : 0)
              return (
                <div key={debt.id} className="card p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">{typeIcon(debt.debtType)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
                            <p className="font-bold">{debt.name}</p>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{typeLabel(debt.debtType)} · {fmtPct(debt.interestRate)} APR</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-rose-600">{fmtMoney(debt.balance, currency)}</p>
                          <p className="text-xs text-slate-400">remaining</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                        {[
                          { label: 'Min. Payment', value: fmtMoney(debt.minimumPayment, currency) + '/mo' },
                          { label: 'Monthly Interest', value: fmtMoney(debt.monthlyInterest, currency) },
                          { label: 'Payoff Est.', value: monthsLabel(debt.payoffMonths) },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-50 rounded-2xl p-3">
                            <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
                            <p className="font-black text-sm mt-0.5">{s.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => open('edit', debt)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => remove(debt)} className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && close()}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{modal.mode === 'new' ? 'Add Debt' : 'Edit Debt'}</h2>
              <button onClick={close} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Name</label>
                <input className="input mt-1 w-full" placeholder="e.g. Chase Visa, Student Loan" value={form.name} onChange={set('name')} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Type</label>
                <select className="input mt-1 w-full" value={form.debtType} onChange={set('debtType')}>
                  {TYPES.map(t => <option key={t.v} value={t.v}>{t.icon} {t.l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Current Balance</label>
                <input className="input mt-1 w-full" type="number" min="0" step="0.01" placeholder="0.00" value={form.balance} onChange={set('balance')} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Interest Rate (APR %)</label>
                <input className="input mt-1 w-full" type="number" min="0" step="0.1" placeholder="0.0" value={form.interestRate} onChange={set('interestRate')} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Min. Payment / mo</label>
                <input className="input mt-1 w-full" type="number" min="0" step="0.01" placeholder="0.00" value={form.minimumPayment} onChange={set('minimumPayment')} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Due Day</label>
                <input className="input mt-1 w-full" type="number" min="1" max="31" placeholder="Optional" value={form.dueDay} onChange={set('dueDay')} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes</label>
                <input className="input mt-1 w-full" placeholder="Optional notes" value={form.notes} onChange={set('notes')} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={close} className="btn-ghost flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : modal.mode === 'new' ? 'Add Debt' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
