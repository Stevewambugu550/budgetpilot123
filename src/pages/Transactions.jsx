import { useMemo, useState } from 'react'
import { Search, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, FileSpreadsheet, FileDown } from 'lucide-react'
import Modal from '../components/Modal'
import { addTransaction, updateTransaction, deleteTransaction } from '../lib/storage'
import { fmtMoney, fmtDate } from '../lib/format'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, catMeta } from '../lib/categories'
import { exportToExcel, exportTransactionsCSV } from '../lib/excel'
import { useToast } from '../context/ToastContext'

const empty = () => ({
  type: 'expense', amount: '', category: 'Food', accountId: '',
  date: new Date().toISOString().slice(0, 10), note: '',
})

const Transactions = ({ data }) => {
  const { transactions, accounts, settings } = data
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty())
  const [search, setSearch] = useState('')
  const [ft, setFt] = useState('all')

  const openNew = (type = 'expense') => {
    setForm({ ...empty(), type, category: type === 'income' ? 'Salary' : 'Food', accountId: accounts[0]?.id })
    setModal({ mode: 'new' })
  }
  const openEdit = (tx) => { setForm({ ...tx, amount: String(tx.amount) }); setModal({ mode: 'edit', tx }) }
  const close = () => { setModal(null); setForm(empty()) }

  const save = () => {
    const p = { ...form, amount: Number(form.amount) }
    if (!p.amount || p.amount <= 0) return toast.error('Enter a valid amount')
    if (!p.accountId) return toast.error('Pick an account')
    if (modal.mode === 'new') { addTransaction(p); toast.success(`${p.type === 'income' ? 'Income' : 'Expense'} added`) }
    else { updateTransaction(modal.tx.id, p); toast.success('Transaction updated') }
    close()
  }
  const remove = (id) => {
    if (!confirm('Delete this transaction? It will also reverse the account balance.')) return
    deleteTransaction(id); close()
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return transactions.filter(t => {
      if (ft !== 'all' && t.type !== ft) return false
      if (!s) return true
      return (t.note || '').toLowerCase().includes(s) || t.category.toLowerCase().includes(s)
    })
  }, [transactions, search, ft])

  const totals = useMemo(() => {
    let inc = 0, exp = 0
    for (const t of filtered) { if (t.type === 'income') inc += t.amount; else exp += t.amount }
    return { inc, exp, net: inc - exp }
  }, [filtered])

  const cats = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const cur = settings.currency

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Track every dollar in and out.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportTransactionsCSV(filtered, accounts)} className="btn-ghost" disabled={!filtered.length} title="Export to CSV">
            <FileDown className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => exportToExcel(data)} className="btn-ghost" disabled={!transactions.length} title="Export entire workspace to Excel">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => openNew('income')}  className="btn bg-emerald-600 hover:bg-emerald-700 text-white"><ArrowUpCircle className="w-4 h-4" /> Income</button>
          <button onClick={() => openNew('expense')} className="btn bg-rose-600 hover:bg-rose-700 text-white"><ArrowDownCircle className="w-4 h-4" /> Expense</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Income</p><p className="text-xl font-black text-emerald-600 mt-1">{fmtMoney(totals.inc, cur)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Expense</p><p className="text-xl font-black text-rose-600 mt-1">{fmtMoney(totals.exp, cur)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Net</p><p className={`text-xl font-black mt-1 ${totals.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtMoney(totals.net, cur)}</p></div>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search note or category…" className="input pl-9" />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {['all', 'income', 'expense'].map(t => (
            <button key={t} onClick={() => setFt(t)}
              className={`px-3 py-2 rounded-lg text-xs font-bold capitalize ${ft === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="card divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <p>No transactions yet.</p>
            <button onClick={() => openNew('expense')} className="btn-primary mt-3">Add one</button>
          </div>
        ) : filtered.map(t => {
          const m = catMeta(t.category, t.type)
          const acc = accounts.find(a => a.id === t.accountId)
          return (
            <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${m.color}`}>{m.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{t.note || t.category}</p>
                <p className="text-xs text-slate-500 truncate">{t.category} · {fmtDate(t.date)}{acc ? ` · ${acc.name}` : ''}</p>
              </div>
              <span className={`font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {t.type === 'income' ? '+' : '−'} {fmtMoney(t.amount, cur)}
              </span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => remove(t.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={!!modal} onClose={close}
        title={modal?.mode === 'edit' ? 'Edit transaction' : `New ${form.type}`}
        footer={
          <>
            {modal?.mode === 'edit' && <button onClick={() => remove(modal.tx.id)} className="btn-danger mr-auto"><Trash2 className="w-4 h-4" /> Delete</button>}
            <button onClick={close} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {['income', 'expense'].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: t === 'income' ? 'Salary' : 'Food' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize ${form.type === t ? 'bg-white shadow-sm' : 'text-slate-500'}`}>
                {t === 'income' ? '⬆️ Income' : '⬇️ Expense'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input" placeholder="0.00" autoFocus />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto">
              {cats.map(c => (
                <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, category: c.id }))}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold border-2 ${form.category === c.id ? 'border-brand-500 bg-brand-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="truncate w-full text-center">{c.id}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Account</label>
            <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))} className="input">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="input" placeholder="e.g. Lunch with team" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Transactions
