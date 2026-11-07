import { useState, useEffect, useRef } from 'react'

/* ============ Panel ============ */
export function Panel({ title, subtitle, action, children, className = '', padded = true }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <header className="flex items-start gap-3 px-5 py-4 border-b border-[#161d2a]">
          <div>
            {title && <h2 className="text-[13px] font-semibold tracking-tight text-slate-100">{title}</h2>}
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="ml-auto">{action}</div>
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

/* ============ Stat Card ============ */
export function StatCard({ label, value, sub, accent = '#22d3ee', icon, trend }) {
  return (
    <div className="panel p-4 relative overflow-hidden group">
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.13em] text-slate-500 font-semibold">
          {label}
        </span>
        <span className={`text-[14px] opacity-60 group-hover:opacity-100 transition-opacity`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-[28px] font-bold leading-none tracking-tight" style={{ color: accent }}>
          {value}
        </span>
        {trend != null && (
          <span
            className={`text-[11px] font-semibold mb-1 ${trend <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {trend <= 0 ? '▼' : '▲'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-2 text-[11.5px] text-slate-500">{sub}</div>
    </div>
  )
}

/* ============ SevBadge ============ */
export function SevBadge({ severity }) {
  const map = {
    critical: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    high: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    medium: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    low: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${map[severity] || map.low}`}
    >
      {severity}
    </span>
  )
}

/* ============ StatusDot ============ */
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

/* ============ Empty ============ */
export function Empty({ icon = '◇', title, hint }) {
  return (
    <div className="py-12 text-center">
      <div className="text-3xl opacity-30">{icon}</div>
      <div className="mt-3 text-[13.5px] text-slate-400 font-medium">{title}</div>
      {hint && <div className="mt-1 text-[12px] text-slate-600">{hint}</div>}
    </div>
  )
}

/* ============ SwitchChip ============ */
export function SwitchChip({ mode = 'simulated' }) {
  const isLive = mode === 'connected' || mode === 'live'
  return (
    <span className={`switch-chip ${isLive ? 'live' : 'simulated'}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-cyan-400'} live-dot`}
      />
      {isLive ? 'LIVE' : 'SIMULATED'}
    </span>
  )
}

/* ============ Alert ============ */
export function Alert({ kind = 'info', title, children }) {
  const meta = {
    info: { bg: 'bg-cyan-500/[0.08]', border: 'border-cyan-500/25', text: 'text-cyan-200', icon: 'ℹ️' },
    warn: { bg: 'bg-amber-500/[0.08]', border: 'border-amber-500/25', text: 'text-amber-200', icon: '⚠️' },
    error: { bg: 'bg-rose-500/[0.08]', border: 'border-rose-500/25', text: 'text-rose-200', icon: '🚨' },
    ok: { bg: 'bg-emerald-500/[0.08]', border: 'border-emerald-500/25', text: 'text-emerald-200', icon: '✅' },
  }[kind]

  return (
    <div className={`rounded-lg ${meta.border} ${meta.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg">{meta.icon}</span>
        <div className="flex-1">
          {title && <div className="text-[12.5px] font-semibold {meta.text}">{title}</div>}
          {children && (
            <div className={`mt-1 text-[12.5px] text-slate-400/90 leading-relaxed`}>{children}</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============ Badge ============ */
export function Badge({ children, variant = 'default' }) {
  const base = 'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider'
  const variants = {
    default: 'border-[#1f2937] bg-[#0b1018] text-slate-400',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  }
  return <span className={`${base} ${variants[variant]}`}>{children}</span>
}

/* ============ StageProgress ============ */
export function StageProgress({ status }) {
  const stages = [
    { key: 'detection', label: 'Detect' },
    { key: 'triage', label: 'Triage' },
    { key: 'debug', label: 'Debug' },
    { key: 'approval', label: 'Approve' },
    { key: 'resolution', label: 'Resolve' },
  ]

  const order = ['detected', 'triaged', 'debugging', 'awaiting_approval', 'rolling_back', 'deploying', 'resolved']
  const idx = Math.max(0, order.indexOf(status))
  const cur = status === 'rolling_back' || status === 'deploying' || status === 'blocked' ? 3 : Math.min(idx, 4)
  const done = status === 'resolved'

  return (
    <div className="flex items-center gap-1.5">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${done || i < cur ? 'live-dot' : ''}`}
            style={{
              width: i === cur ? 34 : 20,
              background: done || i < cur ? (i === cur ? '#22d3ee' : '#10b981') : '#1f2937',
            }}
          />
          <span
            className={`text-[10px] ${
              done || i < cur ? 'text-cyan-300 font-semibold' : 'text-slate-700'
            } ${i === cur ? 'font-bold' : ''}`}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ============ ApprovalCard ============ */
export function ApprovalCard({ approval, onApprove, onReject, busy }) {
  const RISK = {
    high: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  }

  return (
    <div className="panel p-6 relative overflow-hidden glow-rose">
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: '#f59e0b' }} />

      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`rounded border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${RISK[approval.risk] || RISK.medium}`}
            >
              {approval.risk} risk
            </span>
            <Badge variant="cyan">{approval.action}</Badge>
            {approval.status !== 'pending' && (
              <Badge
                variant={approval.status === 'approved' ? 'emerald' : 'rose'}
              >
                {approval.status}
              </Badge>
            )}
          </div>

          <h3 className="mt-2.5 text-[16px] font-bold text-slate-100">{approval.title}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
            <span className="text-slate-500">Because: </span>{approval.description}
          </p>
          {approval.service && approval.incident_title && (
            <div className="mt-2.5 text-[12px] text-slate-500">
              <span className="mono text-slate-400">{approval.service}</span> ·
              {approval.incident_title}
            </div>
          )}
        </div>

        <div className="w-[250px] shrink-0">
          {approval.status === 'pending' ? (
            <div className="space-y-2">
              <button
                onClick={onApprove}
                disabled={busy}
                className="w-full rounded-lg bg-emerald-500 py-3 text-[13.5px] font-bold text-[#04120c] hover:bg-emerald-400 disabled:opacity-60 transition shadow-[0_0_20px_-6px_rgba(16,185,129,.7)]"
              >
                {busy ? 'Executing…' : '✓ Approve & Execute'}
              </button>
              <button
                onClick={onReject}
                disabled={busy}
                className="w-full rounded-lg border border-rose-500/40 bg-rose-500/10 py-3 text-[13.5px] font-bold text-rose-200 hover:bg-rose-500/20 disabled:opacity-60 transition"
              >
                {busy ? 'Rejecting…' : '✕ Reject'}
              </button>
              <div className="text-center text-[11px] text-slate-600">
                You are the human-in-the-loop gate
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#1b2432] bg-[#0a0f16] p-4 text-center">
              <div
                className={`text-[16px] font-bold uppercase ${approval.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {approval.status}
              </div>
              <div className="mt-1 text-[12px] text-slate-500">by {approval.decided_by || '—'}</div>
              <div className="mt-0.5 text-[11px] text-slate-600 mono">
                {approval.decided_at ? new Date(approval.decided_at).toLocaleTimeString() : '—'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============ Skeleton ============ */
export function Skeleton({ className = '', height = '1rem', width = '100%' }) {
  return (
    <div className={`skeleton ${className}`} style={{ height, width }} />
  )
}

/* ============ TimelineRow ============ */
export function TimelineRow({ event, state }) {
  const color =
    state === 'done' ? '#10b981' : state === 'active' ? '#22d3ee' : '#334155'

  return (
    <div className="relative flex gap-3 pb-5 last:pb-0 slide-in">
      <span
        className="absolute left-[11px] top-6 bottom-0 w-px"
        style={{
          background:
            state === 'done'
              ? 'linear-gradient(#10b981, rgba(16,185,129,.25))'
              : '#1e293b',
        }}
      />
      <span
        className={`relative z-10 mt-0.5 h-[22px] w-[22px] shrink-0 rounded-full grid place-items-center text-[10px] font-bold border ${state === 'active' ? 'live-dot' : ''}`}
        style={{ borderColor: color, background: state === 'pending' ? '#0b1119' : `${color}22`, color }}
      >
        {state === 'done' ? '✓' : '•'}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[13px] font-semibold ${state === 'pending' ? 'text-slate-600' : 'text-slate-100'}`}
          >
            {event.stage}
          </span>
          <span className="text-[11px] text-slate-600">· {event.agent}</span>
        </div>

        <div
          className={`mt-1.5 rounded-lg border px-3 py-2 text-[12.5px] leading-relaxed ${
            event.level === 'alert'
              ? 'border-rose-500/25 bg-rose-500/[0.07] text-rose-200'
              : event.level === 'warn'
                ? 'border-amber-500/25 bg-amber-500/[0.07] text-amber-100'
                : event.level === 'ok'
                  ? 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-100'
                  : 'border-[#1f2937] bg-[#0c111a] text-slate-400'
          }`}
        >
          <span className="font-semibold text-slate-200">{event.stage}: </span>
          {event.message}
        </div>
      </div>
    </div>
  )
}

/* ============ Toast Provider ============ */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = (message, kind = 'info', duration = 4000) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, kind }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto min-w-[300px] rise">
            <Alert kind={t.kind} title={t.message} />
          </div>
        ))}
      </div>
    </>
  )
}

/* ============ Avatar ============ */
export function Avatar({ label, color = '#22d3ee', size = 8 }) {
  return (
    <div
      className="shrink-0 rounded-lg grid place-items-center text-[11px] font-bold"
      style={{
        height: `${size}rem`,
        width: `${size}rem`,
        background: `${color}1f`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {label}
    </div>
  )
}

/* ============ Button ============ */
export function Button({ children, onClick, variant = 'primary', disabled, loading, className = '' }) {
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-[#03131c] font-bold shadow-[0_0_20px_-6px_rgba(34,211,238,.7)] hover:brightness-110',
    ghost: 'border-[#1f2937] bg-[#0b1018] text-slate-400 hover:text-white hover:border-cyan-400/40',
    danger: 'border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
    success: 'bg-emerald-500 text-[#04120c] font-bold hover:bg-emerald-400 shadow-[0_0_20px_-6px_rgba(16,185,129,.7)]',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`rounded-lg px-4 py-2.5 text-[13px] transition-all disabled:opacity-60 active:scale-[.98] ${variants[variant]} ${className}`}
    >
      {loading && <span className="mr-2">⟳</span>}
      {children}
    </button>
  )
}

/* ============ Input ============ */
export function Input({ placeholder, value, onChange, className = '' }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`rounded-lg border border-[#1b2432] bg-[#0a0f16] px-3.5 py-2.5 text-[13px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-400/40 transition ${className}`}
    />
  )
}