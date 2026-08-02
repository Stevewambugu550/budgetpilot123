const accentGradients = {
  brand:   { icon: 'from-emerald-500 to-brand-500', shadow: 'shadow-emerald-500/20' },
  emerald: { icon: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
  rose:    { icon: 'from-rose-500 to-pink-500',    shadow: 'shadow-rose-500/20' },
  amber:   { icon: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
  sky:     { icon: 'from-sky-500 to-indigo-500',   shadow: 'shadow-sky-500/20' },
  indigo:  { icon: 'from-indigo-500 to-violet-500', shadow: 'shadow-indigo-500/20' },
}

const StatCard = ({ icon: Icon, label, value, sub, accent = 'brand', trend }) => {
  const g = accentGradients[accent] || accentGradients.brand
  return (
    <div className="card p-5 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${g.icon} opacity-10 group-hover:scale-125 transition-transform duration-500`} />
      <div className="flex items-start justify-between gap-2 relative z-10">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br ${g.icon} text-white shadow-lg ${g.shadow}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight relative z-10">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1 relative z-10">{sub}</p>}
      {trend !== undefined && trend !== null && (
        <p className={`text-xs font-bold mt-1.5 relative z-10 ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% vs last month
        </p>
      )}
    </div>
  )
}

export default StatCard
