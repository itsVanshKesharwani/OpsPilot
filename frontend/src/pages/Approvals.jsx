import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { usePoll, fmtClock } from '../hooks'
import { Panel, Empty } from '../components/ui'

const RISK = {
  high: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
}

export default function Approvals() {
  const [tab, setTab] = useState('pending')
  const { data: approvals, refresh } = usePoll(() => api.approvals(), 2500)
  const [busy, setBusy] = useState(null)

  const rows = (approvals || []).filter((a) => a.status === tab)
  const pending = (approvals || []).filter((a) => a.status === 'pending')

  async function decide(id, decision) {
    setBusy(`${id}-${decision}`)
    try {
      await api.decide(id, decision, 'Riya (Eng Lead)')
      refresh()
      setTimeout(refresh, 600)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5 rise">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Approval Center</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            No rollback, deploy or destructive action runs without a human decision.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          {['pending', 'approved', 'rejected'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3.5 py-2 text-[12.5px] font-medium border capitalize ${
                tab === t
                  ? 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200'
                  : 'border-[#1b2432] bg-[#0b1018] text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}{' '}
              <span className="mono text-[11px] opacity-70">
                {(approvals || []).filter((a) => a.status === t).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-4 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <div className="text-[14px] font-semibold text-amber-100">
              {pending.length} critical action{pending.length > 1 ? 's' : ''} waiting for you
            </div>
            <div className="text-[12.5px] text-amber-200/70">
              The AI has staged the fix. Execution starts the moment you approve.
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rows.map((a) => (
          <div key={a.id} className="panel p-5">
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`rounded border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${RISK[a.risk] || RISK.medium}`}
                  >
                    {a.risk} risk
                  </span>
                  <span className="rounded border border-[#1f2937] bg-[#0a0f16] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-cyan-300">
                    {a.action}
                  </span>
                  <Link
                    to={`/incidents/${a.incident_id}`}
                    className="mono text-[11.5px] text-slate-500 hover:text-cyan-300"
                  >
                    Incident #{a.incident_id} →
                  </Link>
                  <span className="text-[11.5px] text-slate-600">{fmtClock(a.created_at)}</span>
                </div>

                <h3 className="mt-2.5 text-[15.5px] font-bold text-slate-100">{a.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
                  <span className="text-slate-500">Because: </span>
                  {a.description}
                </p>

                {a.incident_title && (
                  <div className="mt-2.5 text-[12.5px] text-slate-500">
                    Service <span className="mono text-slate-400">{a.service}</span> · {a.incident_title}
                  </div>
                )}
              </div>

              <div className="w-[260px] shrink-0">
                {a.status === 'pending' ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => decide(a.id, 'approve')}
                      disabled={busy !== null}
                      className="w-full rounded-lg bg-emerald-500 py-2.5 text-[13.5px] font-bold text-[#04120c] hover:bg-emerald-400 disabled:opacity-60 transition"
                    >
                      {busy === `${a.id}-approve` ? 'Executing…' : '✓ Approve & Execute'}
                    </button>
                    <button
                      onClick={() => decide(a.id, 'reject')}
                      disabled={busy !== null}
                      className="w-full rounded-lg border border-rose-500/40 bg-rose-500/10 py-2.5 text-[13.5px] font-bold text-rose-200 hover:bg-rose-500/20 disabled:opacity-60 transition"
                    >
                      {busy === `${a.id}-reject` ? 'Rejecting…' : '✕ Reject'}
                    </button>
                    <div className="text-center text-[11px] text-slate-600">
                      You are the human-in-the-loop gate
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#1b2432] bg-[#0a0f16] p-3.5 text-center">
                    <div
                      className={`text-[15px] font-bold uppercase ${
                        a.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {a.status}
                    </div>
                    <div className="mt-1 text-[12px] text-slate-500">by {a.decided_by || '—'}</div>
                    <div className="mt-0.5 text-[11px] text-slate-600 mono">{fmtClock(a.decided_at)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {!rows.length && (
          <Panel>
            <Empty
              icon="✓"
              title={tab === 'pending' ? 'No approvals pending — all clear' : `No ${tab} approvals`}
              hint="Approvals appear here when an AI agent stages a rollback or deploy."
            />
          </Panel>
        )}
      </div>
    </div>
  )
}
