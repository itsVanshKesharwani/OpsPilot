import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../api'
import { usePoll, fmtClock } from '../hooks'
import { Panel, SevBadge, Empty } from '../components/ui'
import Timeline from '../components/Timeline'
import { STATUS } from '../constants'

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: inc, error } = usePoll(() => api.incident(id), 2000, [id])
  const [busy, setBusy] = useState('')

  if (error) {
    return (
      <div className="panel p-8 text-center rise">
        <div className="text-slate-400 text-[14px]">Incident not found.</div>
        <Link to="/incidents" className="mt-3 inline-block text-cyan-400 text-[13px]">
          ← Back to incidents
        </Link>
      </div>
    )
  }
  if (!inc) return <div className="panel p-8 shimmer h-40" />

  const st = STATUS[inc.status] || STATUS.detected
  const approval = inc.approval

  async function decide(decision) {
    setBusy(decision)
    try {
      await api.decide(approval.id, decision, 'Riya (Eng Lead)')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="space-y-5 rise">
      <button
        onClick={() => navigate('/incidents')}
        className="text-[12.5px] text-slate-500 hover:text-cyan-300"
      >
        ← All incidents
      </button>

      <div className="panel p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="mono text-[13px] text-slate-500">Incident #{inc.id}</span>
              <SevBadge severity={inc.severity} />
              <span
                className="rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide border"
                style={{ color: st.color, borderColor: `${st.color}44`, background: `${st.color}14` }}
              >
                {st.label}
              </span>
            </div>
            <h1 className="mt-2 text-[24px] font-extrabold tracking-tight">{inc.title}</h1>
            <div className="mt-1.5 flex flex-wrap gap-3 text-[12.5px] text-slate-500">
              <span className="mono">{inc.service}</span>
              <span>·</span>
              <span>{inc.environment}</span>
              <span>·</span>
              <span>Opened {fmtClock(inc.created_at)}</span>
              {inc.resolved_at && (
                <>
                  <span>·</span>
                  <span className="text-emerald-400">Resolved in {inc.resolution_minutes}m</span>
                </>
              )}
            </div>
          </div>

          {inc.status === 'awaiting_approval' && approval?.status === 'pending' && (
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => decide('approve')}
                disabled={!!busy}
                className="rounded-lg bg-emerald-500 px-4 py-2.5 text-[13px] font-bold text-[#04120c] hover:bg-emerald-400 disabled:opacity-60"
              >
                {busy === 'approve' ? 'Approving…' : '✓ Approve action'}
              </button>
              <button
                onClick={() => decide('reject')}
                disabled={!!busy}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-[13px] font-bold text-rose-200 hover:bg-rose-500/20 disabled:opacity-60"
              >
                {busy === 'reject' ? 'Rejecting…' : '✕ Reject'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-[#1b2432] bg-[#0a0f16] p-3.5 text-[13px] text-slate-400">
          <span className="font-semibold text-slate-300">Description: </span>
          {inc.description}
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        <Panel className="xl:col-span-2" title="Incident Workflow" subtitle="5-stage AI + human pipeline">
          <Timeline incident={inc} />
        </Panel>

        <div className="space-y-5">
          <Panel title="Root Cause Analysis" subtitle="Sherlock · Debug Agent">
            {inc.root_cause ? (
              <p className="text-[13px] leading-relaxed text-slate-300">{inc.root_cause}</p>
            ) : (
              <div className="shimmer rounded-lg h-14" />
            )}
          </Panel>

          <Panel title="Proposed Fix" subtitle="Forge · Fix Agent">
            {inc.proposed_fix ? (
              <>
                <p className="text-[13px] leading-relaxed text-slate-300">{inc.proposed_fix}</p>
                <div className="mt-3 rounded-lg border border-[#1f2937] bg-[#070b11] p-3 mono text-[11.5px] text-emerald-300/90">
                  $ opspilot {approval?.action || 'fix'} --service {inc.service}
                  <br />
                  <span className="text-slate-600"># execution blocked until human approval</span>
                </div>
              </>
            ) : (
              <div className="shimmer rounded-lg h-14" />
            )}
          </Panel>

          <Panel title="Approval Gate" subtitle="Human-in-the-loop control">
            {!approval ? (
              <div className="text-[12.5px] text-slate-600">No approval required yet.</div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-slate-500">Action</span>
                  <span className="mono text-slate-200 uppercase font-semibold">{approval.action}</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-slate-500">Risk</span>
                  <span className="capitalize text-amber-300 font-semibold">{approval.risk}</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-slate-500">Status</span>
                  <span
                    className={`font-bold uppercase text-[11.5px] ${
                      approval.status === 'approved'
                        ? 'text-emerald-400'
                        : approval.status === 'rejected'
                          ? 'text-rose-400'
                          : 'text-amber-300'
                    }`}
                  >
                    {approval.status}
                  </span>
                </div>
                {approval.decided_by && (
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-slate-500">Decided by</span>
                    <span className="text-slate-200">{approval.decided_by}</span>
                  </div>
                )}
                {approval.status === 'pending' && (
                  <div className="pt-1 text-[11.5px] text-slate-600">
                    Destructive actions never run without a human click.
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Console Output" subtitle={`Live log stream · ${inc.service}`} padded={false}>
        <div className="mono text-[12px] leading-6 p-4 bg-[#070b11] rounded-b-[14px] max-h-[300px] overflow-y-auto">
          {(inc.events || []).map((e) => (
            <div key={e.id} className="flex gap-3">
              <span className="text-slate-700 shrink-0">
                {new Date(e.created_at).toLocaleTimeString(undefined, { hour12: false })}
              </span>
              <span
                className={
                  e.level === 'alert'
                    ? 'text-rose-400'
                    : e.level === 'warn'
                      ? 'text-amber-300'
                      : e.level === 'ok'
                        ? 'text-emerald-400'
                        : 'text-cyan-300/80'
                }
              >
                [{e.stage.toUpperCase()}]
              </span>
              <span className="text-slate-400">
                {e.agent}: {e.message}
              </span>
            </div>
          ))}
          {!(inc.events || []).length && <div className="text-slate-600">No events yet…</div>}
        </div>
      </Panel>
    </div>
  )
}
