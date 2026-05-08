export default function StatsCard({ label, value, icon, accent = 'amber', tooltip, children }) {
  const accentColors = {
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
    slate: 'from-slate-500/10 to-slate-600/5 border-slate-500/20',
  };

  const iconColors = {
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    slate: 'text-slate-400',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${accentColors[accent]} border p-4 sm:p-5 transition-all duration-200 hover:scale-[1.02] glow-amber-hover`}
      title={tooltip}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-slate-400 font-medium mb-1 truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-white truncate">{value || '—'}</p>
          {children && <div className="mt-1">{children}</div>}
        </div>
        {icon && (
          <div className={`${iconColors[accent]} text-xl sm:text-2xl ml-3 flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
