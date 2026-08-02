import { useMemo } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Wallet, PiggyBank, Target, TrendingUp, Users, Percent } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import StatCard from '../components/StatCard'
import Insights from '../components/Insights'
import { fmtMoney, ymKey, monthLabel } from '../lib/format'
import { catMeta } from '../lib/categories'

const Dashboard = ({ data, setPage }) => {
  const { settings, transactions, accounts, goals, people, budgets = [] } = data
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Welcome back 👋</h1>
        <p className="text-slate-500 mt-1">Here's your money snapshot for {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            <h3 className="font-bold">Income vs Expense — last 6 months</h3>
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
          <h3 className="font-bold mb-4">Where it goes (this month)</h3>
          {catBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">No expenses yet this month. Add one to see your breakdown.</p>
          ) : (
            <>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={catBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {catBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmtMoney(v, currency)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {catBreakdown.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-700 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {catMeta(c.name, 'expense').icon} {c.name}
                    </span>
                    <span className="font-bold">{fmtMoney(c.value, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

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
            <ul className="divide-y divide-slate-100">
              {recent.map(t => {
                const meta = catMeta(t.category, t.type)
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${meta.color}`}>{meta.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{t.note || t.category}</p>
                      <p className="text-xs text-slate-500">{t.category} · {t.date}</p>
                    </div>
                    <span className={`font-bold text-sm whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '−'} {fmtMoney(t.amount, currency)}
                    </span>
                  </li>
                )
              })}
            </ul>
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
