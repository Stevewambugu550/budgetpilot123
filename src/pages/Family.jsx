import { useState } from 'react'
import { Users, Shield, Wallet, Target, Plus, UserPlus, Trash2, Edit2, Mail, Lock, Share2 } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { fmtMoney } from '../lib/format'

const Family = ({ data }) => {
  const { settings, people, budgets, goals, accounts } = data
  const cur = settings.currency
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer' })
  const [members, setMembers] = useState([
    { id: '1', name: 'You', email: 'you@example.com', role: 'owner', status: 'Active', avatar: 'Y' },
  ])

  const open = () => { setForm({ name: '', email: '', role: 'viewer' }); setModal('add') }
  const close = () => { setModal(null); setForm({ name: '', email: '', role: 'viewer' }) }
  const invite = () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email are required')
    setMembers(m => [...m, { id: Date.now().toString(), name: form.name, email: form.email, role: form.role, status: 'Pending', avatar: form.name[0].toUpperCase() }])
    toast.success('Invitation sent')
    close()
  }
  const remove = (id) => {
    if (!confirm('Remove this member?')) return
    setMembers(m => m.filter(x => x.id !== id))
    toast.info('Member removed')
  }

  const sharedBudgets = budgets.slice(0, 4)
  const sharedGoals = goals.slice(0, 4)
  const privateCount = accounts.filter(a => (a.isPrivate !== false)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-600" /> Household
          </h1>
          <p className="text-slate-500 text-sm mt-1">Shared planning without giving up privacy.</p>
        </div>
        <button onClick={open} className="btn-primary"><UserPlus className="w-4 h-4" /> Invite member</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Members</p><p className="text-xl font-black mt-1">{members.length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Shared Goals</p><p className="text-xl font-black mt-1 text-emerald-600">{sharedGoals.length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Shared Budgets</p><p className="text-xl font-black mt-1 text-blue-600">{sharedBudgets.length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Private Accounts</p><p className="text-xl font-black mt-1 text-slate-700">{privateCount}</p></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <p className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-brand-600" /> Household members</p>
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-black text-sm">{m.avatar}</div>
                  <div>
                    <p className="font-bold text-sm">{m.name} {m.role === 'owner' && <span className="text-xs font-normal text-emerald-600">(you)</span>}</p>
                    <p className="text-xs text-slate-500">{m.email} · {m.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${m.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{m.status}</span>
                  {m.role !== 'owner' && <button onClick={() => remove(m.id)} className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-brand-600" /> Privacy settings</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5"><Share2 className="w-4 h-4 text-emerald-500 mt-0.5" /><span>Shared goals and budgets are visible to all members.</span></div>
            <div className="flex items-start gap-2.5"><Lock className="w-4 h-4 text-slate-400 mt-0.5" /><span>Accounts marked private are only visible to you.</span></div>
            <div className="flex items-start gap-2.5"><Shield className="w-4 h-4 text-blue-500 mt-0.5" /><span>Admins can manage shared items. Viewers can see but not edit.</span></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Wallet className="w-4 h-4 text-brand-600" /> Shared budgets</p>
          {sharedBudgets.length ? sharedBudgets.map(b => (
            <div key={b.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm font-semibold">{b.category}</span>
              <span className="text-sm font-bold text-slate-700">{fmtMoney(b.monthlyLimit, cur)} / mo</span>
            </div>
          )) : <p className="text-sm text-slate-500">No shared budgets yet.</p>}
        </div>
        <div className="card p-5">
          <p className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-brand-600" /> Shared goals</p>
          {sharedGoals.length ? sharedGoals.map(g => (
            <div key={g.id} className="py-2 border-b border-slate-100 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{g.name}</span>
                <span className="text-xs text-slate-500">{Math.round((g.saved / (g.target || 1)) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (g.saved / (g.target || 1)) * 100)}%` }} />
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">No shared goals yet.</p>}
        </div>
      </div>

      <Modal open={modal === 'add'} onClose={close} title="Invite household member" footer={<><button onClick={close} className="btn-ghost">Cancel</button><button onClick={invite} className="btn-primary">Send invite</button></>}>
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Stephen" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="stephen@example.com" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="viewer">Viewer — can see shared items</option>
              <option value="admin">Admin — can edit shared items</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Family
