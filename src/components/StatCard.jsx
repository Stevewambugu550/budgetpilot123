const StatCard = ({ icon: Icon, label, value, sub, accent = 'brand', trend }) => {
  const colorMap = {
    brand:   'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose:    'bg-rose-50 text-rose-700',
    amber:   'bg-amber-50 text-amber-700',
    sky:     'bg-sky-50 text-sky-700',
    indigo:  'bg-indigo-50 text-indigo-700',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[accent]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      {trend !== undefined && trend !== null && (
        <p className={`text-xs font-bold mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% vs last month
        </p>
      )}
    </div>
  )
}

export default StatCard
