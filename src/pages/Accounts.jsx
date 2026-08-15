import { useState } from 'react'
import {
  Plus, Edit2, Trash2, Wallet, ArrowLeftRight, CreditCard, MoreHorizontal,
  ArrowUpCircle, ArrowDownCircle, X
} from 'lucide-react'
import Modal from '../components/Modal'
import AccountSelect from '../components/AccountSelect'
import { addAccount, updateAccount, deleteAccount, transfer, addTransaction } from '../lib/storage'
import { fmtMoney } from '../lib/format'
import { ACCOUNT_TYPES, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../lib/categories'
import { useToast } from '../context/ToastContext'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b']
const empty = () => ({ name: '', type: 'bank', balance: '', color: COLORS[0] })

const emptyTransfer = (accs) => ({ fromId: accs[0]?.id || '', toId: accs[1]?.id || '', amount: '', note: '' })
const emptyTx = (account) => ({
  type: 'expense', amount: '', category: 'Food', accountId: account?.id || '',
  date: new Date().toISOString().slice(0, 10), note: '',
})

const typeMeta = (id) => ACCOUNT_TYPES.find(t => t.id === id) || ACCOUNT_TYPES[ACCOUNT_TYPES.length - 1]
const maskId = (id) => id ? `**** ${id.slice(-4).toUpperCase()}` : '****'

const AccountCard = ({ account, currency, onEdit, onDelete, onTransfer, onQuick }) => {
  const t = typeMeta(account.type)
  const [menu, setMenu] = useState(false)
  const toggle = (e) => { e.stopPropagation(); setMenu(o => !o) }

  const actions = [
    { icon: ArrowUpCircle, label: 'Income', tone: 'text-emerald-700', onClick: () => onQuick(account, 'income') },
    { icon: ArrowDownCircle, label: 'Expense', tone: 'text-rose-700', onClick: () => onQuick(account, 'expense') },
    { icon: ArrowLeftRight, label: 'Transfer', tone: 'text-slate-700', onClick: () => onTransfer(account) },
    { icon: Edit2, label: 'Edit', tone: 'text-slate-700', onClick: () => onEdit(account) },
    { icon: Trash2, label: 'Delete', tone: 'text-rose-600', onClick: () => onDelete(account.id) },
  ]

  return (
    <div className="relative h-52 rounded-3xl p-5 text-white shadow-lg overflow-hidden transition-transform hover:-translate-y-1">
      <div className="absolute inset-0" style={{ background: account.color || COLORS[0] }} />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-900/20 to-transparent" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />

      <div className="relative h-full flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl">
              {t.icon}
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{account.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/70">{t.label}</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-white/20 opacity-80 transition bg-white/10">
              {menu ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
            </button>
            {menu && (
              <div className="absolute right-0 top-9 flex flex-col gap-0.5 bg-white/95 backdrop-blur rounded-xl p-1.5 shadow-2xl min-w-[9.5rem] z-20">
                {actions.map((a, i) => (
                  <button key={i} onClick={() => { a.onClick(); setMenu(false) }} className={`text-left text-xs font-semibold ${a.tone} px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2`}>
                    <a.icon className="w-3.5 h-3.5" /> {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-xs text-white/70 uppercase tracking-widest font-bold">Balance</p>
          <p className={`text-3xl font-black mt-1 ${account.balance < 0 ? 'text-rose-200' : ''}`}>{fmtMoney(account.balance, currency)}</p>
          <div className="flex items-center gap-2 mt-2 text-white/80">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs font-mono tracking-wide">{maskId(account.id)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const Accounts = ({ data }) => {
  const { accounts, settings } = data
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty())
  const [trModal, setTrModal] = useState(false)
  const [tr, setTr] = useState(emptyTransfer(accounts))
  const [quick, setQuick] = useState(null)
  const [tx, setTx] = useState(emptyTx())

  const open = (a = null) => {
    setForm(a ? { ...a, balance: String(a.balance) } : empty())
    setModal({ mode: a ? 'edit' : 'new', a })
  }
  const close = () => { setModal(null); setForm(empty()) }
  const save = async () => {
    if (!form.name.trim()) return toast.error('Account name is required')
    const payload = { ...form, balance: Number(form.balance) || 0 }
    try {
      if (modal.mode === 'new') { await addAccount(payload); toast.success('Account added') }
      else { await updateAccount(modal.a.id, payload); toast.success('Account updated') }
      close()
    } catch { toast.error('Something went wrong — try again') }
  }
  const remove = async (id) => {
    if (!confirm('Delete this account? All its transactions are also removed.')) return
    try { await deleteAccount(id); toast.info('Account deleted'); close() } catch { toast.error('Could not delete — try again') }
  }

  const total = accounts.reduce((s, a) => s + (a.balance || 0), 0)
  const cur = settings.currency

  const startTransfer = (a) => { setTr({ ...emptyTransfer(accounts), fromId: a.id }); setTrModal(true) }
  const startQuick = (a, type) => { setTx({ ...emptyTx(a), type, category: type === 'income' ? 'Salary' : 'Food' }); setQuick(a) }
  const closeQuick = () => { setQuick(null); setTx(emptyTx()) }
  const doQuick = async () => {
    const p = { ...tx, amount: Number(tx.amount) }
    if (!p.amount || p.amount <= 0) return toast.error('Enter a valid amount')
    try { await addTransaction(p); toast.success(`${quick.name}: ${p.type} added`); closeQuick() }
    catch { toast.error('Something went wrong — try again') }
  }

  const doTransfer = () => {
    if (tr.fromId === tr.toId) return toast.error('Pick two different accounts')
    if (!tr.amount || Number(tr.amount) <= 0) return toast.error('Enter a valid amount')
    transfer(tr.fromId, tr.toId, tr.amount, tr.note)
    toast.success('Transfer complete')
    setTrModal(false)
  }

  const cats = tx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Accounts</h1>
          <p className="text-slate-500 text-sm mt-1">Cards, cash, mobile money — all in one place.</p>
        </div>
        <button onClick={() => open()} className="btn-primary"><Plus className="w-4 h-4" /> New account</button>
      </div>

      {/* Total balance hero */}
      <div className="card p-6 sm:p-8 gradient-hero relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-500">Total balance</p>
          <p className="text-4xl sm:text-5xl font-black mt-2 text-slate-900">{fmtMoney(total, cur)}</p>
          <p className="text-sm text-slate-500 mt-2">Across {accounts.length} account{accounts.length !== 1 && 's'}</p>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 mx-auto bg-brand-50 rounded-2xl flex items-center justify-center mb-3"><Wallet className="w-8 h-8 text-brand-600" /></div>
          <p className="font-bold text-slate-900">No accounts</p>
          <p className="text-sm text-slate-500 mt-1">Add your first account to start tracking money.</p>
          <button onClick={() => open()} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Add one</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map(a => (
            <AccountCard key={a.id} account={a} currency={cur} onEdit={open} onDelete={remove} onTransfer={startTransfer} onQuick={startQuick} />
          ))}
          <button onClick={() => open()} className="h-52 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 transition">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center"><Plus className="w-7 h-7" /></div>
            <span className="font-semibold text-sm">Add account</span>
          </button>
        </div>
      )}

      {/* New/Edit account modal */}
      <Modal open={!!modal} onClose={close}
        title={modal?.mode === 'edit' ? 'Edit account' : 'New account'}
        footer={
          <>
            {modal?.mode === 'edit' && <button onClick={() => remove(modal.a.id)} className="btn-danger mr-auto"><Trash2 className="w-4 h-4" /> Delete</button>}
            <button onClick={close} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. KCB Current" />
          </div>
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {ACCOUNT_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, type: t.id }))}
                  className={`flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-semibold border-2 transition ${form.type === t.id ? 'border-brand-500 bg-brand-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
                  <span className="text-lg">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Starting balance</label>
              <input type="number" className="input" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-9 h-9 rounded-full border-4 ${form.color === c ? 'border-slate-300' : 'border-white'}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Tip: transactions will adjust the balance automatically.</p>
        </div>
      </Modal>

      {/* Transfer modal */}
      <Modal open={trModal} onClose={() => setTrModal(false)}
        title="Transfer between accounts"
        size="sm"
        footer={
          <>
            <button onClick={() => setTrModal(false)} className="btn-ghost">Cancel</button>
            <button onClick={doTransfer} className="btn-primary">Transfer</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">From</label>
            <AccountSelect accounts={accounts} value={tr.fromId} onChange={(id) => setTr(s => ({ ...s, fromId: id }))} currency={cur} />
          </div>
          <div>
            <label className="label">To</label>
            <AccountSelect accounts={accounts} value={tr.toId} onChange={(id) => setTr(s => ({ ...s, toId: id }))} currency={cur} />
          </div>
          <div>
            <label className="label">Amount</label>
            <input type="number" min="0" step="0.01" className="input" value={tr.amount} onChange={e => setTr(s => ({ ...s, amount: e.target.value }))} placeholder="0.00" />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input className="input" value={tr.note} onChange={e => setTr(s => ({ ...s, note: e.target.value }))} placeholder="e.g. Savings top-up" />
          </div>
        </div>
      </Modal>

      {/* Quick transaction modal */}
      <Modal open={!!quick} onClose={closeQuick}
        title={`Quick ${tx.type} · ${quick?.name}`}
        size="sm"
        footer={
          <>
            <button onClick={closeQuick} className="btn-ghost">Cancel</button>
            <button onClick={doQuick} className="btn-primary">Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
            {['income', 'expense'].map(t => (
              <button key={t} onClick={() => setTx(f => ({ ...f, type: t, category: t === 'income' ? 'Salary' : 'Food' }))}
                className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize flex items-center justify-center gap-2 ${tx.type === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                {t === 'income' ? <ArrowUpCircle className="w-4 h-4 text-emerald-600" /> : <ArrowDownCircle className="w-4 h-4 text-rose-600" />} {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount</label>
              <input type="number" min="0" step="0.01" className="input" value={tx.amount} onChange={e => setTx(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" autoFocus />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={tx.date} onChange={e => setTx(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto">
              {cats.map(c => (
                <button key={c.id} type="button" onClick={() => setTx(f => ({ ...f, category: c.id }))}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold border-2 ${tx.category === c.id ? 'border-brand-500 bg-brand-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="truncate w-full text-center">{c.id}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input className="input" value={tx.note} onChange={e => setTx(f => ({ ...f, note: e.target.value }))} placeholder="e.g. Lunch with team" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Accounts
