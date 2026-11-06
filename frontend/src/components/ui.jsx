export function Panel({ title, subtitle, action, children, className = '', padded = true }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <header className="flex items-start gap-3 px-5 py-4 border-b border-[#161d2a]">
          <div>
            <h2 className="text-[13.5px] font-semibold tracking-tight text-slate-100">{title}</h2>
            {subtitle && <p className="text-[11.5px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="ml-auto">{action}</div>
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

export function StatCard({ label, value, sub, accent = '#22d3ee', icon, trend }) {
  return (
    <div className="panel p-4 relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] uppercase tracking-[0.13em] text-slate-500 font-semibold">
          {label}
        </span>
        <span className="text-[15px] opacity-70">{icon}</span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-[30px] font-bold leading-none tracking-tight" style={{ color: accent }}>
          {value}
        </span>
        {trend != null && (
          <span
            className={`text-[12px] font-semibold mb-1 ${trend <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {trend <= 0 ? '▼' : '▲'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-2 text-[12px] text-slate-500">{sub}</div>
    </div>
  )
}

export function SevBadge({ severity }) {
  const map = {
    critical: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    high: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    medium: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    low: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${
        map[severity] || map.low
      }`}
    >
      {severity}
    </span>
  )
}

export function StatusDot({ status, color }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-400">
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === 'working' ? 'live-dot' : ''}`}
        style={{ background: color || '#64748b' }}
      />
      {status}
    </span>
  )
}

export function Empty({ icon = '◇', title, hint }) {
  return (
    <div className="py-12 text-center">
      <div className="text-3xl opacity-30">{icon}</div>
      <div className="mt-3 text-[13.5px] text-slate-400 font-medium">{title}</div>
      {hint && <div className="mt-1 text-[12px] text-slate-600">{hint}</div>}
    </div>
  )
}
