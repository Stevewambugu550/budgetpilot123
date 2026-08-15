import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { ArrowDownCircle, ArrowUpCircle, Wallet, PiggyBank, Target, TrendingUp, Users, Percent, Receipt, CheckCircle2, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import StatCard from '../components/StatCard'
import Insights from '../components/Insights'
import { fmtMoney, ymKey, monthLabel } from '../lib/format'
import { catMeta } from '../lib/categories'

const Dashboard = ({ data, setPage }) => {
  const { user } = useAuth()
  const { settings, transactions, accounts, goals, people, budgets = [], bills = [], debts = [] } = data
  const currency = settings.currency

  const thisYM = ymKey(new Date().toISOString())
  const lastDate = new Date(); lastDate.setMonth(lastDate.getMonth() - 1)
  const lastYM = ymKey(lastDate.toISOString())

  const stats = useMemo(() => {
    let income = 0, expense = 0, lastIncome = 0, lastExpense = 0
    for (const t of transactions) {
      const ym = ymKey(t.date)
      if (ym === thisYM) {
        if (t.type === 'income') income += t.amount; else expense += t.amount
      } else if (ym === lastYM) {
        if (t.type === 'income') lastIncome += t.amount; else lastExpense += t.amount
      }
    }
    const netWorth   = accounts.reduce((s, a) => s + (a.balance || 0), 0)
    const totalSaved = goals.reduce((s, g) => s + (g.saved || 0), 0)
    const incomeTrend  = lastIncome  ? ((income  - lastIncome)  / lastIncome)  * 100 : null
    const expenseTrend = lastExpense ? ((expense - lastExpense) / lastExpense) * 100 : null
    return { income, expense, netWorth, totalSaved, incomeTrend, expenseTrend, net: income - expense }
  }, [transactions, accounts, goals, thisYM, lastYM])

  // 6-month trend
  const monthly = useMemo(() => {
    const buckets = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const k = ymKey(d.toISOString())
      buckets[k] = { ym: k, label: monthLabel(k), income: 0, expense: 0 }
    }
    for (const t of transactions) {
      const k = ymKey(t.date)
      if (buckets[k]) {
        if (t.type === 'income') buckets[k].income += t.amount
        else buckets[k].expense += t.amount
      }
    }
    return Object.values(buckets)
  }, [transactions])

  // Top expense categories this month
  const catBreakdown = useMemo(() => {
    const map = new Map()
    for (const t of transactions) {
      if (t.type !== 'expense' || ymKey(t.date) !== thisYM) continue
      map.set(t.category, (map.get(t.category) || 0) + t.amount)
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [transactions, thisYM])

  const COLORS = ['#0a9659', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b']
  const target  = settings.monthlyExpenseLimit || 0
  const tProg   = target ? Math.min(100, (stats.expense / target) * 100) : 0
  const incomeTarget = settings.monthlyIncomeTarget || 0
  const iProg = incomeTarget ? Math.min(100, (stats.income / incomeTarget) * 100) : 0

  const recent = transactions.slice(0, 6)
  const activePeople = people.filter(p => p.active).length
  const monthlyPayroll = people.filter(p => p.active).reduce((s, p) => s + (p.monthlyPay || 0), 0)

  const bucketBreakdown = useMemo(() => {
    const map = { need: 0, want: 0, savings: 0 }
    for (const t of transactions) {
      if (t.type !== 'expense' || ymKey(t.date) !== thisYM) continue
      const meta = catMeta(t.category, 'expense')
      const bucket = meta.bucket || 'want'
      map[bucket] = (map[bucket] || 0) + t.amount
    }
    return map
  }, [transactions, thisYM])

  const bucketChartData = useMemo(() => [
    { name: 'Needs',   icon: '💙', value: bucketBreakdown.need    || 0, color: '#3b82f6', lightBg: '#dbeafe', textColor: '#1d4ed8' },
    { name: 'Wants',   icon: '💜', value: bucketBreakdown.want    || 0, color: '#7c3aed', lightBg: '#ede9fe', textColor: '#6d28d9' },
    { name: 'Savings', icon: '💚', value: bucketBreakdown.savings || 0, color: '#059669', lightBg: '#d1fae5', textColor: '#047857' },
  ].filter(b => b.value > 0), [bucketBreakdown])

  const budgetProgress = useMemo(() => {
    const spendByCategory = new Map()
    for (const t of transactions) {
      if (t.type !== 'expense' || ymKey(t.date) !== thisYM) continue
      spendByCategory.set(t.category, (spendByCategory.get(t.category) || 0) + t.amount)
    }
    return budgets.map(b => ({
      ...b,
      spent: spendByCategory.get(b.category) || 0,
      pct: b.monthlyLimit > 0 ? Math.min(100, ((spendByCategory.get(b.category) || 0) / b.monthlyLimit) * 100) : 0,
    })).sort((a, b) => b.pct - a.pct).slice(0, 4)
  }, [budgets, transactions, thisYM])

  // Upcoming bills (not paid, soonest first)
  const upcomingBills = useMemo(() => {
    const today = new Date()
    const y = today.getFullYear(), m = today.getMonth(), d = today.getDate()
    return bills
      .map(b => {
        const paid = b.lastPaidDate && (() => { const p = new Date(b.lastPaidDate); return p.getFullYear() === y && p.getMonth() === m })()
        const daysUntil = b.frequency === 'monthly' ? b.dueDay - d : null
        return { ...b, paid, daysUntil, overdue: b.frequency === 'monthly' && !paid && daysUntil < 0 }
      })
      .filter(b => !b.paid)
      .sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999))
      .slice(0, 5)
  }, [bills])

  // Financial Health Score (0-100)
  const healthScore = useMemo(() => {
    let s = 0
    // Savings Rate (0-35 pts)
    if (stats.income > 0) s += Math.max(0, Math.min(35, ((stats.income - stats.expense) / stats.income) * 175))
    else s += 17
    // Budget Adherence (0-30 pts)
    if (budgets.length === 0) s += 15
    else { const good = budgetProgress.filter(b => b.pct <= 100).length; s += Math.round((good / budgets.length) * 30) }
    // Bills on time (0-20 pts)
    const overdue = bills.filter(b => { const d = new Date(); const paid = b.lastPaidDate && (() => { const p = new Date(b.lastPaidDate); return p.getFullYear() === d.getFullYear() && p.getMonth() === d.getMonth() })(); return b.frequency === 'monthly' && !paid && b.dueDay < d.getDate() }).length
    s += Math.max(0, 20 - overdue * 5)
    // Goal Progress (0-15 pts)
    if (goals.length === 0) s += 7
    else { const avg = goals.reduce((a, g) => a + (g.target > 0 ? Math.min(1, g.saved / g.target) : 0), 0) / goals.length; s += Math.round(avg * 15) }
    return Math.min(100, Math.round(s))
  }, [stats, budgets, budgetProgress, bills, goals])

  const scoreLabel = healthScore >= 90 ? 'Excellent' : healthScore >= 75 ? 'Good' : healthScore >= 60 ? 'Fair' : 'Needs work'
  const scoreColor = healthScore >= 90 ? '#10b981' : healthScore >= 75 ? '#3b82f6' : healthScore >= 60 ? '#f59e0b' : '#ef4444'

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      <div className="card-gradient p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-gradient-to-br from-brand-400/20 to-violet-500/20 blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{greeting()}</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gradient">
              {user?.fullName ? `Hi, ${user.fullName.split(' ')[0]}` : 'Welcome back'} 👋
            </h1>
            <p className="text-slate-500 mt-2 max-w-xl">
              Here's your money snapshot for <span className="font-semibold text-slate-800">{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>.
            </p>
          </div>
          {/* Financial Health Score */}
          <div className="hidden sm:flex flex-col items-center bg-white/80 backdrop-blur border border-slate-100 rounded-3xl px-5 py-4 shadow-sm flex-shrink-0">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3"
                  strokeDasharray={`${healthScore} 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black">{healthScore}</span>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: scoreColor }}>{scoreLabel}</p>
            <p className="text-[9px] text-slate-400 font-semibold">Health Score</p>
          </div>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard icon={Wallet}        label="Net Worth"     value={fmtMoney(stats.netWorth, currency)} sub={`${accounts.length} accounts`} accent="brand" />
        <StatCard icon={ArrowUpCircle} label="Income (mo)"   value={fmtMoney(stats.income,   currency)} accent="emerald" trend={stats.incomeTrend} />
        <StatCard icon={ArrowDownCircle} label="Expenses (mo)" value={fmtMoney(stats.expense,  currency)} accent="rose"    trend={stats.expenseTrend} />
        <StatCard
          icon={Percent}
          label="Savings Rate"
          value={stats.income > 0 ? `${(((stats.income - stats.expense) / stats.income) * 100).toFixed(0)}%` : '—'}
          sub={stats.income > 0 ? `${fmtMoney(stats.income - stats.expense, currency)} kept` : 'Add income to calculate'}
          accent={stats.income > 0 && stats.income - stats.expense >= stats.income * 0.2 ? 'emerald' : 'amber'}
        />
      </div>

      {/* 50/30/20 Breakdown */}
      {stats.income > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">50 / 30 / 20 Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">How your spending aligns with the rule this month</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
              {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            {[
              { key: 'need',    label: 'Needs',   ideal: 50, icon: '💙', color: '#3b82f6', lightBg: '#eff6ff', textColor: '#1d4ed8' },
              { key: 'want',    label: 'Wants',   ideal: 30, icon: '💜', color: '#7c3aed', lightBg: '#f5f3ff', textColor: '#6d28d9' },
              { key: 'savings', label: 'Savings', ideal: 20, icon: '💚', color: '#059669', lightBg: '#ecfdf5', textColor: '#047857' },
            ].map(({ key, label, ideal, icon, color, lightBg, textColor }) => {
              const spent = bucketBreakdown[key] || 0
              const idealAmt = stats.income * (ideal / 100)
              const actualPct = stats.income > 0 ? (spent / stats.income) * 100 : 0
              const onTrack = key === 'savings' ? actualPct >= ideal - 5 : actualPct <= ideal + 5
              const barPct = idealAmt > 0 ? Math.min(100, (spent / idealAmt) * 100) : 0
              return (
                <div key={key} style={{ background: lightBg }} className="rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <p className="font-black text-sm" style={{ color: textColor }}>{label}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: onTrack ? color : '#ef4444' }}>
                      {actualPct.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xl font-black text-slate-900">{fmtMoney(spent, currency)}</p>
                  <p className="text-xs text-slate-500 mt-0.5 mb-2">of {fmtMoney(idealAmt, currency)} ideal ({ideal}%)</p>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: barPct > 100 ? '#ef4444' : color }} />
                  </div>
                  <p className="text-xs mt-1.5 font-semibold" style={{ color: onTrack ? color : '#ef4444' }}>
                    {onTrack ? '✓ On track' : key === 'savings' ? '↑ Save more' : '↓ Over ideal'}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="flex rounded-full overflow-hidden h-3 bg-slate-100">
            {[
              { key: 'need',    color: '#3b82f6' },
              { key: 'want',    color: '#7c3aed' },
              { key: 'savings', color: '#059669' },
            ].map(({ key, color }) => {
              const pct = stats.expense > 0 ? ((bucketBreakdown[key] || 0) / stats.expense) * 100 : 0
              return <div key={key} style={{ width: `${pct}%`, background: color }} />
            })}
          </div>
          <div className="flex items-center gap-5 mt-2">
            {[{ label: 'Needs', color: '#3b82f6' }, { label: 'Wants', color: '#7c3aed' }, { label: 'Savings', color: '#059669' }].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Smart Insights */}
      <Insights data={data} />

      {/* Targets */}
      {(target > 0 || incomeTarget > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {incomeTarget > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Income Target</p>
                  <p className="text-xl font-black mt-1">{fmtMoney(stats.income, currency)} <span className="text-sm text-slate-400 font-semibold">/ {fmtMoney(incomeTarget, currency)}</span></p>
                </div>
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all" style={{ width: `${iProg}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-semibold">{iProg.toFixed(0)}% of target reached</p>
            </div>
          )}
          {target > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Spending Limit</p>
                  <p className="text-xl font-black mt-1">{fmtMoney(stats.expense, currency)} <span className="text-sm text-slate-400 font-semibold">/ {fmtMoney(target, currency)}</span></p>
                </div>
                <Target className={`w-6 h-6 ${tProg > 90 ? 'text-rose-500' : 'text-amber-500'}`} />
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${tProg > 90 ? 'bg-gradient-to-r from-rose-400 to-rose-600' : 'bg-gradient-to-r from-amber-400 to-amber-600'}`} style={{ width: `${tProg}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-semibold">
                {tProg.toFixed(0)}% spent · {fmtMoney(Math.max(0, target - stats.expense), currency)} remaining
              </p>
            </div>
          )}
        </div>
      )}

      {/* Budget progress */}
      {budgetProgress.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><PiggyBank className="w-4 h-4 text-brand-600" /> Budget progress</h3>
            <button onClick={() => setPage('budgets')} className="text-xs font-semibold text-brand-600">Manage budgets →</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {budgetProgress.map(b => {
              const meta = catMeta(b.category, 'expense')
              const over = b.spent > b.monthlyLimit
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold flex items-center gap-1.5">{meta.icon} {b.category}</span>
                    <span className={`font-bold text-xs ${over ? 'text-rose-600' : 'text-slate-500'}`}>
                      {fmtMoney(b.spent, currency)} / {fmtMoney(b.monthlyLimit, currency)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${over ? 'bg-gradient-to-r from-rose-400 to-rose-600' : b.pct > 80 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-brand-400 to-brand-600'}`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">6-Month Trends</h3>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fontWeight: 600 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={v => v >= 1000 ? (v / 1000) + 'k' : v} />
                <Tooltip
                  formatter={v => fmtMoney(v, currency)}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend />
                <Bar dataKey="income"  fill="#0a9659" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold">Spending Breakdown</h3>
            <span className="text-xs text-slate-400 font-semibold">This month</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Needs · Wants · Savings</p>

          {bucketChartData.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-4xl mb-3">🥧</p>
              <p className="text-sm text-slate-400 font-semibold">No expenses recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Add a transaction to see the breakdown.</p>
            </div>
          ) : (
            <>
              {/* Donut with center label */}
              <div className="relative" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bucketChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={68}
                      outerRadius={96}
                      paddingAngle={3}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {bucketChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="white" strokeWidth={3} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={v => fmtMoney(v, currency)}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Spent</p>
                  <p className="text-xl font-black text-slate-900 leading-tight mt-0.5">{fmtMoney(stats.expense, currency)}</p>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-2 space-y-2.5">
                {bucketChartData.map(b => {
                  const pct = stats.expense > 0 ? ((b.value / stats.expense) * 100).toFixed(0) : 0
                  return (
                    <div key={b.name} className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: b.color }} />
                      <span className="flex-1 text-sm font-semibold text-slate-700">{b.icon} {b.name}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: b.lightBg, color: b.textColor }}>{pct}%</span>
                      <span className="text-sm font-black text-slate-800">{fmtMoney(b.value, currency)}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upcoming Bills */}
      {bills.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Receipt className="w-4 h-4 text-brand-600" /> Upcoming Bills</h3>
            <button onClick={() => setPage('bills')} className="text-xs font-bold text-brand-700 hover:underline">All bills →</button>
          </div>
          {upcomingBills.length === 0 ? (
            <div className="flex items-center gap-3 py-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-700">All bills paid this month!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {upcomingBills.map(b => (
                <div key={b.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  b.overdue ? 'bg-rose-50 border-rose-200' : b.daysUntil != null && b.daysUntil <= 3 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  {b.overdue
                    ? <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    : <Receipt className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{b.name}</p>
                    <p className={`text-xs font-semibold ${
                      b.overdue ? 'text-rose-600' : b.daysUntil != null && b.daysUntil <= 3 ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      {b.overdue ? 'Overdue'
                        : b.daysUntil === null ? (b.frequency ? b.frequency.charAt(0).toUpperCase() + b.frequency.slice(1) : 'Recurring')
                        : b.daysUntil === 0 ? 'Due today'
                        : b.daysUntil === 1 ? 'Due tomorrow'
                        : `Due in ${b.daysUntil}d`}
                    </p>
                  </div>
                  <p className="font-black text-sm flex-shrink-0">{fmtMoney(b.amount, currency)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent transactions + People */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Recent activity</h3>
            <button onClick={() => setPage('transactions')} className="text-xs font-bold text-brand-700 hover:underline">View all →</button>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-3">No transactions yet.</p>
              <button onClick={() => setPage('transactions')} className="btn-primary">Add your first one</button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recent.map(t => {
                const meta = catMeta(t.category, t.type)
                return (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${meta.color}`}>{meta.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{t.note || t.category}</p>
                      <p className="text-xs text-slate-400">{t.category} · {t.date}</p>
                    </div>
                    <span className={`font-bold text-sm whitespace-nowrap tabular-nums ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '−'}{fmtMoney(t.amount, currency)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Users className="w-4 h-4" /> Team & Payroll</h3>
            <button onClick={() => setPage('people')} className="text-xs font-bold text-brand-700 hover:underline">Manage →</button>
          </div>
          <p className="text-3xl font-black">{activePeople}</p>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">active people</p>
          <div className="mt-4 p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Monthly payroll commitment</p>
            <p className="text-xl font-black mt-1">{fmtMoney(monthlyPayroll, currency)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
