import { useMemo } from 'react'
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Sparkles, Trophy, Zap } from 'lucide-react'
import { fmtMoney, ymKey } from '../lib/format'

const QUOTES = [
  { q: "Do not save what is left after spending, but spend what is left after saving.", a: "Warren Buffett" },
  { q: "A budget is telling your money where to go instead of wondering where it went.", a: "Dave Ramsey" },
  { q: "It's not your salary that makes you rich, it's your spending habits.", a: "Charles A. Jaffe" },
  { q: "Beware of little expenses. A small leak will sink a great ship.", a: "Benjamin Franklin" },
  { q: "Never spend your money before you have it.", a: "Thomas Jefferson" },
  { q: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.", a: "Dave Ramsey" },
  { q: "The art is not in making money, but in keeping it.", a: "Proverb" },
  { q: "Wealth consists not in having great possessions, but in having few wants.", a: "Epictetus" },
  { q: "If you would be wealthy, think of saving as well as getting.", a: "Benjamin Franklin" },
  { q: "Don't tell me what you value, show me your budget, and I'll tell you what you value.", a: "Joe Biden" },
]

const quoteOfTheDay = () => {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  return QUOTES[day % QUOTES.length]
}

const Insights = ({ data }) => {
  const { transactions, settings, goals, accounts } = data
  const cur = settings.currency
  const thisYM = ymKey(new Date().toISOString())

  const insights = useMemo(() => {
    const list = []
    let income = 0, expense = 0
    const catTotals = new Map()
    let largest = null

    for (const t of transactions) {
      if (ymKey(t.date) !== thisYM) continue
      if (t.type === 'income') income += t.amount
      else {
        expense += t.amount
        catTotals.set(t.category, (catTotals.get(t.category) || 0) + t.amount)
        if (!largest || t.amount > largest.amount) largest = t
      }
    }

    // 1. Savings rate
    if (income > 0) {
      const rate = ((income - expense) / income) * 100
      if (rate >= 30) {
        list.push({ icon: Trophy, tone: 'emerald', title: 'Crushing it 🎉', body: `You're saving **${rate.toFixed(0)}%** of your income this month. The 20% benchmark is in the rearview.` })
      } else if (rate >= 15) {
        list.push({ icon: TrendingUp, tone: 'sky', title: 'Steady saver', body: `You're saving **${rate.toFixed(0)}%** of income this month. Push toward 20% to fast-track your goals.` })
      } else if (rate >= 0) {
        list.push({ icon: AlertTriangle, tone: 'amber', title: 'Tight margin', body: `You're saving just **${rate.toFixed(0)}%** of income. Look at the top category below for easy wins.` })
      } else {
        list.push({ icon: AlertTriangle, tone: 'rose', title: 'Spending exceeds income', body: `You're **${fmtMoney(Math.abs(income - expense), cur)} over** this month. Time to trim something.` })
      }
    }

    // 2. Top category share
    if (expense > 0 && catTotals.size > 0) {
      const sorted = [...catTotals.entries()].sort((a, b) => b[1] - a[1])
      const [topCat, topAmt] = sorted[0]
      const share = (topAmt / expense) * 100
      if (share > 35) {
        list.push({
          icon: Lightbulb, tone: 'indigo',
          title: `${topCat} is eating your budget`,
          body: `**${share.toFixed(0)}%** of your spending this month went to **${topCat}** (${fmtMoney(topAmt, cur)}). That's where the biggest savings are.`,
        })
      }
    }

    // 3. Single biggest splurge
    if (largest && expense > 0 && (largest.amount / expense) > 0.20) {
      list.push({
        icon: Zap, tone: 'fuchsia',
        title: 'One big swing',
        body: `Your largest single expense was **${fmtMoney(largest.amount, cur)}** on **${largest.note || largest.category}**. Plan for it next month.`,
      })
    }

    // 4. Budget alert
    if (settings.monthlyExpenseLimit > 0) {
      const used = (expense / settings.monthlyExpenseLimit) * 100
      if (used > 90) {
        list.push({ icon: AlertTriangle, tone: 'rose', title: `${used.toFixed(0)}% of budget used`, body: `Pump the brakes — only **${fmtMoney(Math.max(0, settings.monthlyExpenseLimit - expense), cur)}** left this month.` })
      } else if (used < 50 && new Date().getDate() > 20) {
        list.push({ icon: TrendingDown, tone: 'emerald', title: 'Under budget', body: `Only **${used.toFixed(0)}%** of budget spent and the month is nearly over. Consider sending the surplus to savings.` })
      }
    }

    // 5. Goal nudge
    const activeGoal = goals.find(g => g.target > 0 && g.saved < g.target)
    if (activeGoal) {
      const left = activeGoal.target - activeGoal.saved
      list.push({
        icon: Sparkles, tone: 'brand',
        title: `Goal: ${activeGoal.name}`,
        body: `**${fmtMoney(left, cur)}** to go. Even **${fmtMoney(Math.ceil(left / 12), cur)}/month** for a year gets you there.`,
      })
    }

    // 6. Empty state
    if (list.length === 0) {
      list.push({
        icon: Lightbulb, tone: 'slate',
        title: 'Add a few transactions',
        body: 'Once you log income and a few expenses, BudgetPilot will surface personalized insights right here.',
      })
    }

    return list.slice(0, 4)
  }, [transactions, settings, goals, cur, thisYM])

  const tones = {
    brand:   'bg-brand-50 text-brand-700 border-brand-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sky:     'bg-sky-50 text-sky-700 border-sky-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    rose:    'bg-rose-50 text-rose-700 border-rose-200',
    indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200',
    fuchsia: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    slate:   'bg-slate-50 text-slate-700 border-slate-200',
  }

  const renderRich = (text) => text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>
  )

  const quote = quoteOfTheDay()

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-600" /> Smart Insights</h3>
        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">This month</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {insights.map((it, i) => {
          const Icon = it.icon
          return (
            <div key={i} className={`rounded-xl border p-3 ${tones[it.tone]}`}>
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight">{it.title}</p>
                  <p className="text-xs leading-relaxed mt-1 text-slate-700/90">{renderRich(it.body)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Quote of the day</p>
        <p className="text-sm italic text-slate-700">"{quote.q}"</p>
        <p className="text-xs text-slate-500 font-semibold mt-1">— {quote.a}</p>
      </div>
    </div>
  )
}

export default Insights
