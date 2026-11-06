import { STAGES } from '../constants'
import { fmtClock } from '../hooks'

/** The 5-step incident workflow used across the dashboard. */
export default function Timeline({ incident }) {
  const events = incident?.events || []
  const doneStages = new Set(events.map((e) => e.stage))
  const currentStage =
    incident?.status === 'resolved'
      ? 'resolution'
      : incident?.status === 'blocked'
        ? 'approval'
        : incident?.status === 'rolling_back' || incident?.status === 'deploying'
          ? 'resolution'
          : incident?.status === 'awaiting_approval'
            ? 'approval'
            : incident?.status === 'debugging'
              ? 'debug'
              : incident?.status === 'triaged'
                ? 'triage'
                : 'detection'

  const currentIdx = STAGES.findIndex((s) => s.key === currentStage)

  return (
    <ol className="space-y-0">
      {STAGES.map((stage, idx) => {
        const ev = [...events].reverse().find((e) => e.stage === stage.key)
        const state = idx < currentIdx || incident?.status === 'resolved' ? 'done' : idx === currentIdx ? 'active' : 'pending'
        const color = state === 'done' ? '#10b981' : state === 'active' ? '#22d3ee' : '#334155'

        return (
          <li key={stage.key} className="relative flex gap-3 pb-5 last:pb-0">
            {idx < STAGES.length - 1 && (
              <span
                className="absolute left-[11px] top-6 bottom-0 w-px"
                style={{
                  background:
                    state === 'done'
                      ? 'linear-gradient(#10b981, rgba(16,185,129,.25))'
                      : '#1e293b',
                }}
              />
            )}
            <span
              className={`relative z-10 mt-0.5 h-[22px] w-[22px] shrink-0 rounded-full grid place-items-center text-[10px] font-bold border ${
        state === 'active' ? 'live-dot' : ''
      }`}
              style={{
                borderColor: color,
                background: state === 'pending' ? '#0b1119' : `${color}22`,
                color,
              }}
            >
              {state === 'done' ? '✓' : idx + 1}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[13px] font-semibold ${
                    state === 'pending' ? 'text-slate-600' : 'text-slate-100'
                  }`}
                >
                  {stage.title}
                </span>
                <span className="text-[11px] text-slate-600">· {stage.sub}</span>
                {ev && (
                  <span className="ml-auto text-[10.5px] text-slate-600 mono">
                    {fmtClock(ev.created_at)}
                  </span>
                )}
              </div>

              {ev ? (
                <div
                  className={`mt-1.5 rounded-lg border px-3 py-2 text-[12.5px] leading-relaxed ${
                    ev.level === 'alert'
                      ? 'border-rose-500/25 bg-rose-500/[0.07] text-rose-200'
                      : ev.level === 'warn'
                        ? 'border-amber-500/25 bg-amber-500/[0.07] text-amber-100'
                        : ev.level === 'ok'
                          ? 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-100'
                          : 'border-[#1f2937] bg-[#0c111a] text-slate-400'
                  }`}
                >
                  <span className="font-semibold text-slate-200">{ev.agent}: </span>
                  {ev.message}
                </div>
              ) : state === 'active' ? (
                <div className="mt-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/[0.06] px-3 py-2 text-[12.5px] text-cyan-100 shimmer">
                  Processing…
                </div>
              ) : (
                <div className="mt-1.5 text-[12px] text-slate-700">Pending</div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
