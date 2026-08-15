import { useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, DollarSign, Phone, Users, Calendar } from 'lucide-react'
import Modal from '../components/Modal'
import { addPerson, updatePerson, deletePerson, payPerson } from '../lib/storage'
import { fmtMoney, fmtDate } from '../lib/format'
import { useToast } from '../context/ToastContext'

const empty = () => ({ name: '', role: '', monthlyPay: '', hireDate: new Date().toISOString().slice(0,10), phone: '', note: '', active: true })

const People = ({ data }) => {
  const { people, payments, accounts, settings } = data
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty())
  const [pay, setPay] = useState({ open: false, person: null, amount: '', accountId: '', note: '' })

  const open = (p = null) => {
    setForm(p ? { ...p, monthlyPay: String(p.monthlyPay) } : empty())
    setModal({ mode: p ? 'edit' : 'new', p })
  }
  const close = () => { setModal(null); setForm(empty()) }
  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required')
    const payload = { ...form, monthlyPay: Number(form.monthlyPay) || 0 }
    try {
      if (modal.mode === 'new') { await addPerson(payload); toast.success('Person added') }
      else { await updatePerson(modal.p.id, payload); toast.success('Person updated') }
      close()
    } catch { toast.error('Something went wrong — try again') }
  }
  const remove = async (id) => {
    if (!confirm('Remove this person? Payment history is also deleted.')) return
    try { await deletePerson(id); toast.info('Person removed'); close() } catch { toast.error('Could not remove — try again') }
  }

  const openPay = (person) => setPay({ open: true, person, amount: String(person.monthlyPay || ''), accountId: accounts[0]?.id, note: '' })
  const doPay = async () => {
    const amt = Number(pay.amount) || 0
    if (amt <= 0) return toast.error('Enter an amount greater than zero')
    if (!pay.accountId) return toast.error('Pick an account to pay from')
    try {
      await payPerson(pay.person.id, amt, pay.accountId, pay.note)
      toast.success(`Payment of ${fmtMoney(amt, settings.currency)} recorded`)
      setPay({ open: false, person: null, amount: '', accountId: '', note: '' })
    } catch { toast.error('Could not record payment — try again') }
  }

  const totals = useMemo(() => {
    const map = new Map()
    for (const p of payments) map.set(p.personId, (map.get(p.personId) || 0) + p.amount)
    return map
  }, [payments])

  const active = people.filter(p => p.active)
  const cur = settings.currency
  const monthlyBurn = active.reduce((s, p) => s + (p.monthlyPay || 0), 0)
  const everPaid = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">People & Payroll</h1>
          <p className="text-slate-500 text-sm mt-1">Workers, family members, dependents — track who you pay.</p>
        </div>
        <button onClick={() => open()} className="btn-primary"><Plus className="w-4 h-4" /> Add person</button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active</p><p className="text-xl font-black mt-1">{active.length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Monthly Burn</p><p className="text-xl font-black mt-1">{fmtMoney(monthlyBurn, cur)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Paid</p><p className="text-xl font-black mt-1">{fmtMoney(everPaid, cur)}</p></div>
      </div>

      {people.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 mx-auto bg-brand-50 rounded-2xl flex items-center justify-center mb-3"><Users className="w-8 h-8 text-brand-600" /></div>
          <p className="font-bold">No people added yet</p>
          <p className="text-slate-500 text-sm mt-1">Add workers, contractors or dependents to track recurring payments.</p>
          <button onClick={() => open()} className="btn-primary mt-4"><Plus className="w-4 h-4" /> Add first person</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map(p => {
            const paid = totals.get(p.id) || 0
            return (
              <div key={p.id} className={`card p-5 ${!p.active && 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white flex items-center justify-center font-black text-lg flex-shrink-0">
                      {p.name.split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{p.name} {!p.active && <span className="text-xs font-normal text-slate-400">(inactive)</span>}</p>
                      <p className="text-xs text-slate-500 truncate">{p.role || '—'}</p>
                    </div>
                  </div>
                  <button onClick={() => open(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Edit2 className="w-4 h-4" /></button>
                </div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Monthly</span>
                    <span className="font-bold">{fmtMoney(p.monthlyPay, cur)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total paid</span>
                    <span className="font-bold text-brand-700">{fmtMoney(paid, cur)}</span>
                  </div>
                  {p.hireDate && <div className="flex items-center justify-between text-xs text-slate-400"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Since</span><span>{fmtDate(p.hireDate)}</span></div>}
                  {p.phone && <div className="flex items-center justify-between text-xs text-slate-400"><span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span><span>{p.phone}</span></div>}
                </div>
                <button onClick={() => openPay(p)} disabled={!p.active} className="btn-primary w-full mt-3 disabled:opacity-50 disabled:cursor-not-allowed">
                  <DollarSign className="w-4 h-4" /> Pay now
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal open={!!modal} onClose={close}
        title={modal?.mode === 'edit' ? 'Edit person' : 'Add person'}
        footer={
          <>
            {modal?.mode === 'edit' && <button onClick={() => remove(modal.p.id)} className="btn-danger mr-auto"><Trash2 className="w-4 h-4" /> Remove</button>}
            <button onClick={close} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. James Mwangi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <input className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Driver" />
            </div>
            <div>
              <label className="label">Monthly pay</label>
              <input type="number" min="0" className="input" value={form.monthlyPay} onChange={e => setForm(f => ({ ...f, monthlyPay: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Hire date</label>
              <input type="date" className="input" value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+254…" />
            </div>
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4" />
            Active (still on payroll)
          </label>
        </div>
      </Modal>

      {/* Pay modal */}
      <Modal open={pay.open} onClose={() => setPay({ open: false, person: null, amount: '', accountId: '', note: '' })}
        title={`Pay ${pay.person?.name || ''}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setPay({ open: false, person: null, amount: '', accountId: '', note: '' })} className="btn-ghost">Cancel</button>
            <button onClick={doPay} className="btn-primary">Record payment</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Amount</label>
            <input type="number" min="0" autoFocus className="input" value={pay.amount} onChange={e => setPay(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div>
            <label className="label">From account</label>
            <select className="input" value={pay.accountId} onChange={e => setPay(p => ({ ...p, accountId: e.target.value }))}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input" value={pay.note} onChange={e => setPay(p => ({ ...p, note: e.target.value }))} placeholder="e.g. March salary" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default People
