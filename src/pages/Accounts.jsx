import { useState } from 'react'
import { Plus, Edit2, Trash2, Wallet, ArrowLeftRight } from 'lucide-react'
import Modal from '../components/Modal'
import { addAccount, updateAccount, deleteAccount, transfer } from '../lib/storage'
import { fmtMoney } from '../lib/format'
import { ACCOUNT_TYPES } from '../lib/categories'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b']
const empty = () => ({ name: '', type: 'bank', balance: '', color: COLORS[0] })

const emptyTransfer = (accs) => ({ fromId: accs[0]?.id || '', toId: accs[1]?.id || '', amount: '', note: '' })

const Accounts = ({ data }) => {
  const { accounts, settings } = data
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty())
  const [trModal, setTrModal] = useState(false)
  const [tr, setTr] = useState(emptyTransfer(accounts))

  const open = (a = null) => {
    setForm(a ? { ...a, balance: String(a.balance) } : empty())
    setModal({ mode: a ? 'edit' : 'new', a })
  }
  const close = () => { setModal(null); setForm(empty()) }
  const save = () => {
    if (!form.name.trim()) return alert('Name required')
    const payload = { ...form, balance: Number(form.balance) || 0 }
    if (modal.mode === 'new') addAccount(payload)
    else updateAccount(modal.a.id, payload)
    close()
  }
  const remove = (id) => { if (confirm('Delete this account? All its transactions are also removed.')) { deleteAccount(id); close() } }

  const total = accounts.reduce((s, a) => s + (a.balance || 0), 0)
  const cur = settings.currency
  const typeMeta = (id) => ACCOUNT_TYPES.find(t => t.id === id) || ACCOUNT_TYPES[ACCOUNT_TYPES.length - 1]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Accounts</h1>
          <p className="text-slate-500 text-sm mt-1">Checking, savings, credit cards, cash — keep them separate.</p>
        </div>
        <div className="flex gap-2">
          {accounts.length >= 2 && (
            <button onClick={() => { setTr(emptyTransfer(accounts)); setTrModal(true) }} className="btn-ghost">
              <ArrowLeftRight className="w-4 h-4" /> Transfer
            </button>
          )}
          <button onClick={() => open()} className="btn-primary"><Plus className="w-4 h-4" /> New account</button>
        </div>
      </div>

      <div className="card p-6 bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <p className="text-xs uppercase font-bold tracking-widest text-brand-200">Total balance</p>
        <p className="text-4xl font-black mt-1">{fmtMoney(total, cur)}</p>
        <p className="text-sm text-brand-200 mt-2">Across {accounts.length} account{accounts.length !== 1 && 's'}</p>
      </div>

      {accounts.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 mx-auto bg-brand-50 rounded-2xl flex items-center justify-center mb-3"><Wallet className="w-8 h-8 text-brand-600" /></div>
          <p className="font-bold">No accounts</p>
          <button onClick={() => open()} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Add one</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(a => {
            const t = typeMeta(a.type)
            return (
              <div key={a.id} className="card p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -mr-12 -mt-12" style={{ background: a.color }} />
                <div className="flex items-start justify-between relative">
                  <div>
                    <p className="text-2xl">{t.icon}</p>
                    <p className="font-bold mt-2 truncate">{a.name}</p>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t.label}</p>
                  </div>
                  <button onClick={() => open(a)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Edit2 className="w-4 h-4" /></button>
                </div>
                <p className={`text-2xl font-black mt-4 ${a.balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{fmtMoney(a.balance, cur)}</p>
              </div>
            )
          })}
        </div>
      )}

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
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold border-2 ${form.type === t.id ? 'border-brand-500 bg-brand-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
                  <span className="text-lg">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Starting balance</label>
            <input type="number" className="input" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="0" />
            <p className="text-xs text-slate-400 mt-1">Tip: transactions will adjust this automatically.</p>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full border-4 ${form.color === c ? 'border-slate-300' : 'border-white'}`} style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Transfer modal */}
      <Modal open={trModal} onClose={() => setTrModal(false)}
        title="Transfer between accounts"
        size="sm"
        footer={
          <>
            <button onClick={() => setTrModal(false)} className="btn-ghost">Cancel</button>
            <button
              onClick={() => {
                if (tr.fromId === tr.toId) return alert('Pick two different accounts')
                const ok = transfer(tr.fromId, tr.toId, tr.amount, tr.note)
                if (!ok) return alert('Invalid amount or accounts')
                setTrModal(false)
              }}
              className="btn-primary"
            >
              Transfer
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <div>
              <label className="label">From</label>
              <select className="input" value={tr.fromId} onChange={e => setTr(s => ({ ...s, fromId: e.target.value }))}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="pb-2 text-slate-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <label className="label">To</label>
              <select className="input" value={tr.toId} onChange={e => setTr(s => ({ ...s, toId: e.target.value }))}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Amount</label>
            <input type="number" min="0" autoFocus className="input" value={tr.amount} onChange={e => setTr(s => ({ ...s, amount: e.target.value }))} placeholder="0" />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input className="input" value={tr.note} onChange={e => setTr(s => ({ ...s, note: e.target.value }))} placeholder="e.g. Moving to savings" />
          </div>
          <p className="text-xs text-slate-500">A linked transaction is created on each account so your history stays consistent.</p>
        </div>
      </Modal>
    </div>
  )
}

export default Accounts
