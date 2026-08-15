import {
  Wallet, ArrowLeftRight, Target, Users, PiggyBank, Shield, Lock, Server,
  Receipt, CreditCard, Heart,
} from 'lucide-react'
import BudgetPilotLogo from '../components/BudgetPilotLogo'

const FEATURES = [
  { icon: Wallet,        title: 'Accounts',     desc: 'Track balances across cash, bank, mobile money, credit, and investment accounts.' },
  { icon: ArrowLeftRight,title: 'Transactions', desc: 'Log income and expenses, categorize them, and transfer between accounts.' },
  { icon: PiggyBank,     title: 'Budgets',      desc: 'Set monthly limits per category and see exactly how close you are to going over.' },
  { icon: Target,        title: 'Goals',        desc: 'Save toward a target with a deadline and watch your progress bar fill up.' },
  { icon: Receipt,       title: 'Bills',        desc: 'Track recurring bills with due dates, auto-pay status, and mark-paid workflow.' },
  { icon: CreditCard,    title: 'Debt tracker', desc: 'Snowball or avalanche your debts with payoff projections and interest calculations.' },
  { icon: Users,         title: 'People',       desc: 'Track payroll and payments to employees, contractors, or family members.' },
  { icon: Shield,        title: 'Admin console',desc: 'Role-based administration with suspend/reactivate, password reset, and a full audit log.' },
]

const STACK = [
  { label: 'Frontend',   value: 'React + Vite + Tailwind CSS' },
  { label: 'Backend',    value: 'Netlify Functions (serverless)' },
  { label: 'Database',   value: 'Neon (serverless Postgres)' },
  { label: 'Auth',       value: 'Custom token-based sessions, salted + hashed passwords' },
  { label: 'Charts',     value: 'Recharts' },
]

const About = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="card p-8 text-center bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <BudgetPilotLogo size={56} className="mx-auto drop-shadow-lg" />
        <h1 className="text-3xl font-black tracking-tight mt-3">
          Budget<span className="text-brand-200">Pilot</span>
        </h1>
        <p className="text-brand-100 mt-1">Your money, charted.</p>
        <p className="text-xs text-brand-200 mt-4">Version 1.0.0</p>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-lg mb-2">What is BudgetPilot?</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          BudgetPilot is a personal and small-business finance tracker. It helps you keep every account,
          transaction, budget, and savings goal in one place, with clear visual insight into where your
          money comes from and where it goes each month.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4">Features</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Server className="w-4 h-4" /> Built with</h2>
        <dl className="space-y-2">
          {STACK.map(s => (
            <div key={s.label} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
              <dt className="text-slate-500">{s.label}</dt>
              <dd className="font-semibold text-slate-800 text-right">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Lock className="w-4 h-4" /> Privacy & security</h2>
        <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
          <li>Passwords are never stored in plain text; each one is salted and hashed before it touches the database.</li>
          <li>Your financial data is only ever accessible from your own signed-in session.</li>
          <li>All admin actions are recorded in an audit log for full accountability.</li>
          <li>Data is hosted on Neon's managed Postgres infrastructure with encrypted connections.</li>
        </ul>
      </div>

      <div className="card p-6 text-center">
        <p className="text-sm text-slate-500 flex items-center justify-center gap-1.5">
          Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for people who want to actually understand their money.
        </p>
      </div>
    </div>
  )
}

export default About
