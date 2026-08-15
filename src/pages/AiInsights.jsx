import { useMemo, useState } from 'react'
import { Brain, ArrowUpRight, ArrowDownRight, Wallet, Target, Receipt, Sparkles, Calculator, TrendingUp } from 'lucide-react'
import { fmtMoney, ymKey } from '../lib/format'
import { catMeta } from '../lib/categories'

const AiInsights = ({ data }) => {
  const { settings, transactions, accounts, goals, budgets, bills, debts } = data
  const cur = settings.currency
  const thisYM = ymKey(new Date().toISOString())
  const [whatIfAmount, setWhatIfAmount] = useState('600')
  const [whatIfType, setWhatIfType] = useState('expense')
  const [whatIfResult, setWhatIfResult] = useState(null)

  // Insights based on real transaction data
  const insights = useMemo(() => {
    const out = []
    const thisMonth = transactions.filter(t => ymKey(t.date) === thisYM)
    const lastMonth = transactions.filter(t => ymKey(t.date) === ymKey(new Date(Date.now() - 30 * 86400000).toISOString()))

    // Top spending category change
    const catMap = new Map()
    for (const t of thisMonth) { if (t.type === 'expense') catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount) }
    const lastMap = new Map()
    for (const t of lastMonth) { if (t.type === 'expense') lastMap.set(t.category, (lastMap.get(t.category) || 0) + t.amount) }
    const top = [...catMap.entries()].sort((a, b) => b[1] - a[1])[0]
    const lastTop = lastMap.get(top?.[0]) || 0
    if (top && lastTop) {
      const change = ((top[1] - lastTop) / lastTop) * 100
      const extra = top[1] - lastTop
      if (Math.abs(change) > 5) {
        out.push({
          type: 'spend',
          title: `${top[0]} is ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(0)}%`,
          body: `${top[0]} spending ${change > 0 ? 'increased' : 'decreased'} by about ${fmtMoney(Math.abs(extra), cur)} compared to last month.`
        })
      }
    }

    // Available cash
    const netWorth = accounts.reduce((s, a) => s + (a.balance || 0), 0)
    const income = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const available = Math.max(0, income - expense + accounts.reduce((s, a) => s + (a.balance || 0), 0) * 0.1)
    out.push({
      type: 'cash',
      title: 'Available to spend',
      body: `After this month's income and expenses, you have around ${fmtMoney(available, cur)} left in your accounts.`
    })

    // Bills coming up
    const today = new Date()
    const upcoming = bills.filter(b => {
      if (b.frequency !== 'monthly') return false
      const paid = b.lastPaidDate && (() => { const p = new Date(b.lastPaidDate); return p.getFullYear() === today.getFullYear() && p.getMonth() === today.getMonth() })()
      return !paid && b.dueDay >= today.getDate()
    }).slice(0, 3)
    if (upcoming.length) {
      const total = upcoming.reduce((s, b) => s + (b.amount || 0), 0)
      out.push({
        type: 'bills',
        title: `${upcoming.length} upcoming bill${upcoming.length > 1 ? 's' : ''}`,
        body: `You have ${fmtMoney(total, cur)} in upcoming bills before the end of the month. Make sure they're covered.`
      })
    }

    // Goal progress
    const activeGoal = goals.find(g => g.target > g.saved)
    if (activeGoal) {
      const pct = Math.round((activeGoal.saved / activeGoal.target) * 100)
      out.push({
        type: 'goal',
        title: `${activeGoal.name} is ${pct}% funded`,
        body: `You need ${fmtMoney(activeGoal.target - activeGoal.saved, cur)} more to hit this goal. Keep going.`
      })
    }

    return out
  }, [transactions, accounts, bills, goals, thisYM, cur])

  const runWhatIf = () => {
    const amt = Number(whatIfAmount) || 0
    if (amt <= 0) return
    const today = new Date()
    const income = transactions.filter(t => t.type === 'income' && ymKey(t.date) === thisYM).reduce((s, t) => s + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'expense' && ymKey(t.date) === thisYM).reduce((s, t) => s + t.amount, 0)
    const upcomingBills = bills.filter(b => {
      if (b.frequency !== 'monthly') return false
      const paid = b.lastPaidDate && (() => { const p = new Date(b.lastPaidDate); return p.getFullYear() === today.getFullYear() && p.getMonth() === today.getMonth() })()
      return !paid && b.dueDay >= today.getDate()
    }).reduce((s, b) => s + (b.amount || 0), 0)
    const netWorth = accounts.reduce((s, a) => s + (a.balance || 0), 0)
    const projected = netWorth + income - expense - upcomingBills + (whatIfType === 'income' ? amt : -amt)
    const ok = projected >= 0
    const targetGoal = goals[0]
    const goalImpact = targetGoal ? Math.min(1, (targetGoal.saved + (whatIfType === 'income' ? amt : -amt)) / (targetGoal.target || 1)) : 0
    setWhatIfResult({ projected, ok, goalImpact: Math.round(goalImpact * 100), targetGoal })
  }

  const iconFor = (type) => {
    switch (type) {
      case 'spend': return <ArrowUpRight className="w-5 h-5 text-amber-500" />
      case 'cash': return <Wallet className="w-5 h-5 text-emerald-500" />
      case 'bills': return <Receipt className="w-5 h-5 text-rose-500" />
      case 'goal': return <Target className="w-5 h-5 text-blue-500" />
      default: return <Sparkles className="w-5 h-5 text-brand-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <Brain className="w-7 h-7 text-brand-600" /> Pilot AI
        </h1>
        <p className="text-slate-500 text-sm mt-1">Financial insights that explain what changed.</p>
      </div>

      {/* Insights feed */}
      <div className="grid gap-4">
        {insights.length ? insights.map((ins, i) => (
          <div key={i} className="card p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
              {iconFor(ins.type)}
            </div>
            <div>
              <p className="font-bold text-slate-900">{ins.title}</p>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{ins.body}</p>
            </div>
          </div>
        )) : (
          <div className="card p-10 text-center">
            <p className="text-slate-500">Add transactions and accounts to see AI insights.</p>
          </div>
        )}
      </div>

      {/* What If */}
      <div className="card p-6 border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center"><Calculator className="w-5 h-5" /></div>
          <div>
            <p className="font-black text-slate-900">What If?</p>
            <p className="text-xs text-slate-500">Test how a future purchase or income change affects your money.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="label">Amount</label>
            <input type="number" className="input" value={whatIfAmount} onChange={e => setWhatIfAmount(e.target.value)} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={whatIfType} onChange={e => setWhatIfType(e.target.value)}>
              <option value="expense">One-time expense</option>
              <option value="income">One-time income</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={runWhatIf} className="btn-primary w-full"><Sparkles className="w-4 h-4" /> Calculate impact</button>
          </div>
        </div>
        {whatIfResult && (
          <div className="rounded-2xl bg-white border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Projected cash position</span>
              <span className={`text-2xl font-black ${whatIfResult.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtMoney(whatIfResult.projected, cur)}</span>
            </div>
            <p className={`text-sm ${whatIfResult.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
              {whatIfResult.ok
                ? `This looks manageable. You would still have ${fmtMoney(whatIfResult.projected, cur)} left after bills and this ${whatIfType}.`
                : `This would leave you short. Consider delaying this ${whatIfType} or reducing the amount.`}
            </p>
            {whatIfResult.targetGoal && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Impact on {whatIfResult.targetGoal.name}</p>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, whatIfResult.goalImpact)}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cash flow mini forecast */}
      <div className="card p-5">
        <p className="font-bold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-600" /> 30-day cash flow</p>
        <div className="space-y-2">
          {accounts.map(a => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: a.color }} />{a.name}</span>
              <span className="text-sm font-bold">{fmtMoney(a.balance, cur)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AiInsights
