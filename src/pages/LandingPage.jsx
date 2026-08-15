import {
  BarChart3, Wallet, Target, Receipt, CreditCard, Users, Brain,
  Home, Shield, Check, ArrowRight, TrendingUp, PieChart, Bell, Zap, ChevronRight
} from 'lucide-react'

const FEATURES = [
  { icon: BarChart3,  title: 'Financial Dashboard',        desc: 'Net worth, income, expenses, and a financial health score — updated every time you log in.' },
  { icon: PieChart,   title: 'Budget Management',          desc: 'Build category budgets and track the 50/30/20 rule across needs, wants, and savings in real time.' },
  { icon: Receipt,    title: 'Transaction Tracking',       desc: 'Log, categorize, and search every transaction with instant account balance updates.' },
  { icon: Bell,       title: 'Bills & Recurring Payments', desc: 'Track due dates, overdue bills, and monthly totals so you never miss a payment.' },
  { icon: CreditCard, title: 'Debt Payoff Planner',        desc: 'Snowball or avalanche — calculate payoff timelines and the impact of extra payments.' },
  { icon: Target,     title: 'Savings Goals',              desc: 'Set targets and deadlines. See exactly how much to save each month to stay on track.' },
  { icon: Users,      title: 'People & Payroll',           desc: 'Track money owed to or from others. Log payments and mark balances settled.' },
  { icon: Brain,      title: 'Pilot AI Insights',          desc: 'AI-generated spending analysis, budget feedback, and what-if financial scenarios.' },
  { icon: Home,       title: 'Household Collaboration',    desc: 'Shared dashboards and household-level views for couples and families.' },
]

const USE_CASES = [
  { title: 'Monthly budget reviews',       desc: 'Replace spreadsheets with a live dashboard. Review variance by category and export summaries.' },
  { title: 'Debt-free planning',           desc: 'Pick a payoff strategy and follow a clear month-by-month path to zero debt.' },
  { title: 'Household finance management', desc: 'Share budgets and goals so financial decisions are made together with full visibility.' },
  { title: 'Savings goal tracking',        desc: 'Emergency fund, vacation, or car — set a deadline and watch progress build every session.' },
]

const STEPS = [
  { n: '01', title: 'Create your account',      desc: 'Sign up with email or Google. No credit card required.' },
  { n: '02', title: 'Add your accounts',        desc: 'Enter bank accounts, credit cards, and any accounts you want to track.' },
  { n: '03', title: 'Log your transactions',    desc: 'Add and categorize transactions to power your budgets and spending analysis.' },
  { n: '04', title: 'Set up budgets & bills',   desc: 'Create category budgets and add recurring bills to track spending vs. plan.' },
  { n: '05', title: 'Define your goals',        desc: 'Add savings or debt payoff goals with amounts and target dates.' },
  { n: '06', title: 'Review & improve',         desc: 'Use Pilot AI insights to understand patterns and refine your financial habits over time.' },
]

const HIGHLIGHTS = [
  'Income & expense dashboard with health score',
  'Budget vs. actual with 50/30/20 overview',
  'Bill reminders & recurring payment tracker',
  'Debt payoff planner — snowball & avalanche',
  'Savings goals with deadline tracking',
  'Household collaboration & shared finances',
  'AI-powered Pilot insights & what-if scenarios',
  'People, payroll & informal debt management',
]

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">BudgetPilot</span>
          </div>
          <nav className="hidden md:flex items-center gap-7">
            {['Features', 'Use Cases', 'Getting Started'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
                className="text-sm text-slate-400 hover:text-white transition-colors">
                {l}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => onGetStarted('login')}
              className="text-sm text-slate-400 hover:text-white font-medium transition-colors">
              Sign in
            </button>
            <button onClick={() => onGetStarted('signup')}
              className="text-sm bg-brand-500 hover:bg-brand-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
              Get started free
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-brand-500/20">
          <Zap className="w-3 h-3" /> Personal finance, fully in your control
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6 max-w-3xl">
          Budget Dashboard &<br />
          <span className="text-brand-400">Personal Finance Tracker</span>
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-2xl">
          Track income and expenses, manage budgets, plan debt payoff, set savings goals,
          and get AI-powered insights — all in one private dashboard built for real households.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => onGetStarted('signup')}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Start for free <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => onGetStarted('login')}
            className="flex items-center gap-2 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 px-6 py-3 rounded-lg font-semibold transition-colors">
            Sign in
          </button>
        </div>
      </section>

      {/* ── Designed for ── */}
      <section className="max-w-6xl mx-auto px-6 py-14 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">Designed for</p>
        <ul className="space-y-3">
          {[
            'Individuals and couples replacing spreadsheets with a live financial dashboard',
            'Households tracking shared budgets, bills, and savings goals together',
            'Anyone working through debt with a structured snowball or avalanche payoff plan',
            'People who want honest, AI-powered feedback on their spending patterns',
          ].map(item => (
            <li key={item} className="flex items-start gap-3 text-slate-300 text-sm">
              <ChevronRight className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Key Highlights ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-14 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">Key highlights</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
          {HIGHLIGHTS.map(h => (
            <li key={h} className="flex items-center gap-3 text-sm text-slate-300">
              <Check className="w-4 h-4 text-brand-400 shrink-0" />
              {h}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-14 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-10">Features & capabilities</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                <Icon className="w-4 h-4 text-brand-400" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="max-w-6xl mx-auto px-6 py-14 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-10">Best use cases</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {USE_CASES.map(({ title, desc }) => (
            <div key={title} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors">
              <h3 className="font-semibold text-white text-sm mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Getting Started ── */}
      <section id="getting-started" className="max-w-6xl mx-auto px-6 py-14 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-10">Getting started</p>
        <div className="space-y-7">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="flex items-start gap-5">
              <span className="text-xs font-bold text-brand-500 font-mono pt-0.5 w-6 shrink-0">{n}</span>
              <div>
                <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <button onClick={() => onGetStarted('signup')}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-sm">
            Create your free account <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Security ── */}
      <section className="max-w-6xl mx-auto px-6 py-14 border-b border-slate-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm mb-1">Your data stays yours</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              All data is stored in your own account and never shared. Connections are encrypted,
              passwords are hashed, and you can export or delete your data at any time from Settings.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-300 text-sm">BudgetPilot</span>
          </div>
          <p className="text-xs text-slate-600">Your money, charted. Built for real life.</p>
          <div className="flex items-center gap-5">
            <button onClick={() => onGetStarted('login')} className="text-xs text-slate-500 hover:text-white transition-colors">Sign in</button>
            <button onClick={() => onGetStarted('signup')} className="text-xs bg-brand-500 hover:bg-brand-400 text-white px-3 py-1.5 rounded-md font-semibold transition-colors">Get started</button>
          </div>
        </div>
      </footer>

    </div>
  )
}
