import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Wallet, Check, Plus } from 'lucide-react'
import { fmtMoney } from '../lib/format'
import { ACCOUNT_TYPES } from '../lib/categories'

export default function AccountSelect({ accounts, value, onChange, currency, onAddClick }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = accounts.find(a => a.id === value) || accounts[0]

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (!accounts.length) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
        <p className="text-sm text-slate-600 mb-2">No accounts yet. You need an account before adding transactions.</p>
        {onAddClick && (
          <button onClick={onAddClick} className="btn-primary text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" /> Add account
          </button>
        )}
      </div>
    )
  }

  const typeOf = (a) => ACCOUNT_TYPES.find(t => t.id === a.type) || ACCOUNT_TYPES[0]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
          open ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {selected ? (
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
              style={{ backgroundColor: selected.color || '#e2e8f0' }}
            >
              {typeOf(selected).icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{selected.name}</p>
              <p className="text-xs text-slate-500">{typeOf(selected).label} · {fmtMoney(selected.balance, currency)}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-slate-400 flex items-center gap-2"><Wallet className="w-4 h-4" /> Select an account</span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 border border-slate-200 rounded-2xl bg-white shadow-xl overflow-hidden">
          <div className="max-h-56 overflow-y-auto p-2 space-y-1">
            {accounts.map(a => {
              const t = typeOf(a)
              const active = a.id === selected?.id
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { onChange(a.id); setOpen(false) }}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active ? 'bg-brand-50 border-2 border-brand-500' : 'border-2 border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: a.color || '#e2e8f0' }}
                    >
                      {t.icon}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${active ? 'text-brand-700' : 'text-slate-900'}`}>{a.name}</p>
                      <p className="text-xs text-slate-500">{t.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-slate-700">{fmtMoney(a.balance, currency)}</span>
                    {active && <Check className="w-4 h-4 text-brand-600" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
