import { useState } from 'react'
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react'
import { updateSettings, exportJSON, importJSON, clearAll } from '../lib/storage'
import { CURRENCIES } from '../lib/format'

const Settings = ({ data }) => {
  const { settings } = data
  const [name, setName] = useState(settings.name)
  const [currency, setCurrency] = useState(settings.currency)
  const [iTarget, setITarget] = useState(String(settings.monthlyIncomeTarget || ''))
  const [eLimit, setELimit]   = useState(String(settings.monthlyExpenseLimit || ''))
  const [saved, setSaved] = useState(false)

  const save = async () => {
    await updateSettings({
      name,
      currency,
      monthlyIncomeTarget: Number(iTarget) || 0,
      monthlyExpenseLimit: Number(eLimit) || 0,
    })
    setSaved(true); setTimeout(() => setSaved(false), 1800)
  }

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `budgetpilot-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  const doImport = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importJSON(reader.result)
      alert(ok ? 'Backup restored ✅' : 'Invalid file ❌')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const wipe = () => {
    if (!confirm('Erase ALL data? This cannot be undone.')) return
    if (!confirm('Last chance — really erase everything?')) return
    clearAll()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Preferences, targets, backup & restore.</p>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-bold">Preferences</h3>
        <div>
          <label className="label">Workspace name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="My Finances" />
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
            {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{k} — {v.symbol}</option>)}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Monthly income target</label>
            <input type="number" className="input" value={iTarget} onChange={e => setITarget(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="label">Monthly expense limit</label>
            <input type="number" className="input" value={eLimit} onChange={e => setELimit(e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button onClick={save} className="btn-primary">Save changes</button>
          {saved && <span className="text-sm text-emerald-600 font-semibold">✓ Saved</span>}
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-bold">Backup & restore</h3>
        <p className="text-sm text-slate-500">Your data is stored only on this device. Export a JSON backup regularly so you don't lose it.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={doExport} className="btn-ghost"><Download className="w-4 h-4" /> Export backup</button>
          <label className="btn-ghost cursor-pointer">
            <Upload className="w-4 h-4" /> Import backup
            <input type="file" accept="application/json" onChange={doImport} className="hidden" />
          </label>
        </div>
      </div>

      <div className="card p-6 border-rose-200 bg-rose-50/50 space-y-3">
        <h3 className="font-bold text-rose-700 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Danger zone</h3>
        <p className="text-sm text-rose-700/80">Erase all your data (accounts, transactions, goals, people). This cannot be undone.</p>
        <button onClick={wipe} className="btn-danger"><Trash2 className="w-4 h-4" /> Erase everything</button>
      </div>

      <p className="text-center text-xs text-slate-400 pt-4">BudgetPilot v1.0</p>
    </div>
  )
}

export default Settings
