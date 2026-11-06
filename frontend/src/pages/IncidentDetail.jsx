import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../api'
import { usePoll, fmtClock } from '../hooks'
import { Panel, SevBadge, Empty, ApprovalCard, Alert, Badge } from '../components/ui'
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
  if (!inc) return <div className="panel p-8 shimmer h-96" />

  const st = STATUS[inc.status] || STATUS.detected
  const approval = inc.approval
  const isAwaiting = inc.status === 'awaiting_approval' && approval?.status === 'pending'

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

      {/* Header */}
      <div className="panel p-5 glow-cyan">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="mono text-[13px] text-slate-500">Incident #{inc.id}</span>
              <SevBadge severity={inc.severity} />
              <span
                className={`rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide border ${isAwaiting ? 'pending-pulse' : ''}`}
                style={{ color: st.color, borderColor: `${st.color}44`, background: `${st.color}14` }}
              >
                {st.label}
              </span>
            </div>
            <h1 className="mt-2 text-[26px] font-extrabold tracking-tight">{inc.title}</h1>
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

          {isAwaiting && (
            <div className="ml-auto flex flex-col gap-2">
              <ApprovalCard
                approval={approval}
                onApprove={() => decide('approve')}
                onReject={() => decide('reject')}
                busy={busy}
              />
            </div>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-[#1b2432] bg-[#0a0f16] p-3.5 text-[13px] text-slate-400">
          <span className="font-semibold text-slate-300">Description: </span>
          {inc.description}
        </div>
      </div>

      {/* Approval alert if already decided */}
      {approval && approval.status !== 'pending' && (
        <Alert
          kind={approval.status === 'approved' ? 'ok' : 'error'}
          title={
            approval.status === 'approved'
              ? 'Rollback approved & executed'
              : 'Rollback rejected — manual intervention required'
          }
        >
          {approval.status === 'approved'
            ? 'Pilot has executed the rollback. Incident is resolving.'
            : 'The staged fix was blocked. Human action needed.'}
        </Alert>
      )}

      <div className="grid xl:grid-cols-3 gap-5">
        {/* Workflow timeline */}
        <Panel className="xl:col-span-2" title="Incident Workflow" subtitle="5-stage AI + human pipeline">
          <Timeline incident={inc} />
        </Panel>

        {/* Right column */}
        <div className="space-y-5">
          {/* Root cause */}
          <Panel title="Root Cause Analysis" subtitle="Sherlock · Debug Agent">
            {inc.root_cause ? (
              <div className="rounded-lg border border-[#1f2937] bg-[#070b11] p-4 mono text-[12.5px] text-emerald-300/90 leading-relaxed">
                {inc.root_cause}
              </div>
            ) : (
              <div className="h-16 shimmer rounded-lg" />
            )}
          </Panel>

          {/* Proposed fix */}
          <Panel title="Proposed Fix" subtitle="Forge · Fix Agent">
            {inc.proposed_fix ? (
              <>
                <div className="rounded-lg border border-[#1f2937] bg-[#070b11] p-4 mono text-[12.5px] text-slate-300/90 leading-relaxed mb-3">
                  {inc.proposed_fix}
                </div>
                <div className="rounded-lg border border-[#1f2937] bg-[#070b11] p-3 mono text-[11.5px] text-emerald-300/90">
                  $ opspilot {approval?.action || 'fix'} --service {inc.service}
                  <br />
                  <span className="text-slate-600"># execution blocked until human approval</span>
                </div>
              </>
            ) : (
              <div className="h-16 shimmer rounded-lg" />
            )}
          </Panel>

          {/* Approval gate standalone */}
          {!isAwaiting && approval && (
            <Panel title="Approval Gate" subtitle="Human-in-the-loop control">
              <ApprovalCard
                approval={approval}
                onApprove={() => decide('approve')}
                onReject={() => decide('reject')}
                busy={busy}
              />
            </Panel>
          )}
        </div>
      </div>

      {/* Console output */}
      <Panel title="Console Output" subtitle={`Live log stream · ${inc.service}`} padded={false}>
        <div className="mono text-[12px] leading-6 p-4 bg-[#070b11] rounded-b-[14px] max-h-[340px] overflow-y-auto">
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