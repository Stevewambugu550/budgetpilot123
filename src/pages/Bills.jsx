import { useState, useMemo } from 'react'
import { Plus, Receipt, CheckCircle2, Clock, AlertCircle, Edit2, Trash2, Zap, Calendar, RefreshCw } from 'lucide-react'
import { addBill, updateBill, deleteBill, markBillPaid } from '../lib/storage'
import { useToast } from '../context/ToastContext'

const FREQ = { monthly: 'Monthly', weekly: 'Weekly', yearly: 'Yearly', quarterly: 'Quarterly' }
const CATS = ['Bills', 'Rent/Mortgage', 'Utilities', 'Insurance', 'Subscriptions', 'Loan', 'Other']

const EMPTY_FORM = { name: '', amount: '', dueDay: '1', frequency: 'monthly', category: 'Bills', autoPay: false, notes: '' }

function billStatus(bill) {
  const today = new Date()
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate()
  if (bill.frequency !== 'monthly') return 'upcoming'
  const paidThisMonth = bill.lastPaidDate && (() => {
    const p = new Date(bill.lastPaidDate)
    return p.getFullYear() === y && p.getMonth() === m
  })()
  if (paidThisMonth) return 'paid'
  const daysUntil = bill.dueDay - d
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 3) return 'due-soon'
  if (daysUntil <= 7) return 'upcoming-soon'
  return 'upcoming'
}

const statusMeta = {
  'overdue':       { label: 'Overdue',   badge: 'bg-rose-100 text-rose-700',    ring: 'border-rose-200',   dot: 'bg-rose-500'   },
  'due-soon':      { label: 'Due soon',  badge: 'bg-amber-100 text-amber-700',  ring: 'border-amber-200',  dot: 'bg-amber-500'  },
  'upcoming-soon': { label: 'This week', badge: 'bg-blue-100 text-blue-700',    ring: 'border-blue-200',   dot: 'bg-blue-500'   },
  'upcoming':      { label: 'Upcoming',  badge: 'bg-slate-100 text-slate-600',  ring: 'border-slate-200',  dot: 'bg-slate-400'  },
  'paid':          { label: 'Paid',      badge: 'bg-emerald-100 text-emerald-700', ring: 'border-emerald-200', dot: 'bg-emerald-500' },
}

const fmtMoney = (n, cur = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 0 }).format(n || 0)

export default function Bills({ data }) {
  const toast = useToast()
  const { bills = [], settings } = data
  const currency = settings?.currency || 'USD'

  const [modal, setModal] = useState(null) // null | { mode: 'new'|'edit', bill? }
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState(null)

  const open = (mode, bill = null) => {
    setForm(bill ? { name: bill.name, amount: String(bill.amount), dueDay: String(bill.dueDay), frequency: bill.frequency, category: bill.category, autoPay: bill.autoPay, notes: bill.notes } : EMPTY_FORM)
    setModal({ mode, bill })
  }
  const close = () => { setModal(null); setForm(EMPTY_FORM) }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const save = async () => {
    if (!form.name.trim()) return toast.error('Enter a bill name')
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount')
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), amount: Number(form.amount), dueDay: Number(form.dueDay), frequency: form.frequency, category: form.category, autoPay: form.autoPay, notes: form.notes }
      if (modal.mode === 'new') { await addBill(payload); toast.success('Bill added') }
      else { await updateBill(modal.bill.id, payload); toast.success('Bill updated') }
      close()
    } catch { toast.error('Something went wrong') } finally { setSaving(false) }
  }

  const remove = async (bill) => {
    if (!confirm(`Delete "${bill.name}"?`)) return
    try { await deleteBill(bill.id); toast.info(`"${bill.name}" removed`) } catch { toast.error('Could not delete bill') }
  }

  const markPaid = async (bill) => {
    setPaying(bill.id)
    try { await markBillPaid(bill.id); toast.success(`${bill.name} marked as paid`) } catch { toast.error('Something went wrong') } finally { setPaying(null) }
  }

  const sorted = useMemo(() => {
    const order = ['overdue', 'due-soon', 'upcoming-soon', 'upcoming', 'paid']
    return [...bills].sort((a, b) => {
      const sa = order.indexOf(billStatus(a)), sb = order.indexOf(billStatus(b))
      if (sa !== sb) return sa - sb
      return a.dueDay - b.dueDay
    })
  }, [bills])

  const monthlyTotal = useMemo(() => bills.reduce((s, b) => {
    if (b.frequency === 'monthly') return s + b.amount
    if (b.frequency === 'yearly')  return s + b.amount / 12
    if (b.frequency === 'weekly')  return s + b.amount * 4.33
    if (b.frequency === 'quarterly') return s + b.amount / 3
    return s
  }, 0), [bills])

  const overdueCount  = useMemo(() => bills.filter(b => billStatus(b) === 'overdue').length, [bills])
  const dueSoonCount  = useMemo(() => bills.filter(b => ['due-soon','upcoming-soon'].includes(billStatus(b))).length, [bills])
  const paidCount     = useMemo(() => bills.filter(b => billStatus(b) === 'paid').length, [bills])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Bills & Subscriptions</h1>
          <p className="text-slate-500 text-sm mt-1">Track every recurring bill so nothing gets missed.</p>
        </div>
        <button onClick={() => open('new')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Bill
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Total', value: fmtMoney(monthlyTotal, currency), sub: 'recurring cost', color: 'text-slate-900' },
          { label: 'Overdue', value: overdueCount, sub: overdueCount === 1 ? 'bill overdue' : 'bills overdue', color: overdueCount ? 'text-rose-600' : 'text-slate-900' },
          { label: 'Due This Week', value: dueSoonCount, sub: 'upcoming soon', color: dueSoonCount ? 'text-amber-600' : 'text-slate-900' },
          { label: 'Paid This Month', value: paidCount, sub: `of ${bills.length} total`, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Bills list */}
      {bills.length === 0 ? (
        <div className="card p-16 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-bold text-slate-700">No bills yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-5">Add your rent, subscriptions, and recurring bills to stay on top of payments.</p>
          <button onClick={() => open('new')} className="btn-primary mx-auto">Add your first bill</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {sorted.map(bill => {
              const st = billStatus(bill)
              const meta = statusMeta[st]
              const today = new Date()
              const daysUntil = bill.frequency === 'monthly' ? bill.dueDay - today.getDate() : null
              return (
                <div key={bill.id} className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-l-4 ${meta.ring}`}>
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm truncate">{bill.name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
                      {bill.autoPay && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Auto</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {bill.category} · {FREQ[bill.frequency]}
                      {bill.frequency === 'monthly' && daysUntil !== null && (
                        st === 'paid' ? ` · Paid` :
                        daysUntil === 0 ? ' · Due today' :
                        daysUntil > 0 ? ` · Due in ${daysUntil}d (day ${bill.dueDay})` :
                        ` · Was due day ${bill.dueDay}`
                      )}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-base">{fmtMoney(bill.amount, currency)}</p>
                    <p className="text-xs text-slate-400">{bill.frequency === 'monthly' ? '/mo' : bill.frequency === 'yearly' ? '/yr' : bill.frequency === 'weekly' ? '/wk' : '/qtr'}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {st !== 'paid' && (
                      <button onClick={() => markPaid(bill)} disabled={!!paying} title="Mark paid"
                        className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-600 transition disabled:opacity-50">
                        {paying === bill.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => open('edit', bill)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(bill)} className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && close()}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{modal.mode === 'new' ? 'Add Bill' : 'Edit Bill'}</h2>
              <button onClick={close} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bill Name</label>
                <input className="input mt-1 w-full" placeholder="e.g. Netflix, Electricity" value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</label>
                <input className="input mt-1 w-full" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Due Day</label>
                <input className="input mt-1 w-full" type="number" min="1" max="31" placeholder="1–31" value={form.dueDay} onChange={set('dueDay')} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Frequency</label>
                <select className="input mt-1 w-full" value={form.frequency} onChange={set('frequency')}>
                  {Object.entries(FREQ).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</label>
                <select className="input mt-1 w-full" value={form.category} onChange={set('category')}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes (optional)</label>
                <input className="input mt-1 w-full" placeholder="Any extra details…" value={form.notes} onChange={set('notes')} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input id="autopay" type="checkbox" checked={form.autoPay} onChange={set('autoPay')} className="w-4 h-4 accent-brand-600" />
                <label htmlFor="autopay" className="text-sm font-semibold text-slate-700">Auto-pay enabled</label>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={close} className="btn-ghost flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : modal.mode === 'new' ? 'Add Bill' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
