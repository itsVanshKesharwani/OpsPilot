import { Link } from 'react-router-dom'
import { api } from '../api'
import { usePoll, timeAgo } from '../hooks'
import { Panel, Empty, Badge, Avatar } from '../components/ui'
import { AGENT_STATUS } from '../constants'

const CAPABILITIES = {
  Sentinel: ['Scrape metrics + logs', 'Detect anomalies', 'Page oncall via Switch'],
  Atlas: ['Classify severity', 'Isolate blast radius', 'Draft incident summary'],
  Sherlock: ['Build repro cases', 'Correlate traces', 'Identify root cause'],
  Forge: ['Propose code fix', 'Generate rollback plan', 'Estimate risk'],
  Pilot: ['Execute approved rollouts', 'Verify after deploy', 'Report MTTR'],
  Chronicle: ['Write postmortem', 'Update stakeholders', 'Archive evidence'],
}

export default function Agents() {
  const { data: agents } = usePoll(api.agents, 2500)
  const { data: sw } = usePoll(api.switchInfo, 5000)
  const active = (agents || []).filter((a) => a.status !== 'idle')

  return (
    <div className="space-y-5 rise">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">AI Agents</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Six specialised agents, each with one responsibility, coordinating over Switch.
          </p>
        </div>
        <div className="ml-auto flex gap-4 text-right">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-600">Working</div>
            <div className="text-[20px] font-bold text-cyan-300 mono">{active.length}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-600">Total</div>
            <div className="text-[20px] font-bold text-slate-300 mono">{(agents || []).length}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(agents || []).map((a) => {
          const st = AGENT_STATUS[a.status] || AGENT_STATUS.idle
          return (
            <div key={a.id} className="panel p-4 relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${a.color}, transparent)` }} />
              <div className="flex items-start gap-3">
                <Avatar label={a.name[0]} color={a.color} size={8} />
                <div className="min-w-0">
                  <div className="text-[15px] font-bold text-slate-100">{a.name}</div>
                  <div className="text-[12px] text-slate-500">{a.role}</div>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${a.status === 'working' ? 'live-dot' : ''}`}
                    style={{ background: st.color }}
                  />
                  <span className="text-[11px] font-semibold" style={{ color: st.color }}>
                    {st.label}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-[#1b2432] bg-[#0a0f16] px-3 py-2 text-[12px]">
                <span className="text-slate-600">Current task: </span>
                <span className="text-slate-300">{a.current_task || 'Standing by'}</span>
              </div>

              <ul className="mt-3 space-y-1.5">
                {(CAPABILITIES[a.name] || []).map((c) => (
                  <li key={c} className="flex items-center gap-2 text-[12.5px] text-slate-400">
                    <span style={{ color: a.color }}>▸</span> {c}
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-[#161d2a] flex items-center gap-3 text-[11.5px] text-slate-500">
                <span className="mono">{a.model}</span>
                <span className="ml-auto mono">{a.tasks_done} completed</span>
              </div>
              {a.current_incident && (
                <Link
                  to={`/incidents/${a.current_incident.id}`}
                  className="mt-3 block rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-center text-[12px] font-semibold text-cyan-200"
                >
                  Viewing incident #{a.current_incident.id} →
                </Link>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        <Panel className="xl:col-span-2" title="Agent Orchestration" subtitle="How work flows through the team">
          <div className="flex flex-wrap items-center gap-2.5">
            {['Sentinel', 'Atlas', 'Sherlock', 'Forge', 'Human', 'Pilot', 'Chronicle'].map((n, i) => (
              <div key={n} className="flex items-center gap-2.5">
                <span className="rounded-lg border border-[#1f2937] bg-[#0a0f16] px-3 py-2 text-[12.5px] font-medium text-slate-300">
                  {n === 'Human' ? '🧑‍💼 Human Approval' : n}
                </span>
                {i < 6 && <span className="text-cyan-500/70">→</span>}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-slate-500">
            Sentinel detects → Atlas triages → Sherlock debugs → Forge proposes a fix → <b className="text-amber-300">a human
            approves</b> → Pilot executes the rollback → Chronicle writes the report. Every handoff travels through the
            Switch bridge so the War Room stays in sync.
          </p>
        </Panel>

        <Panel title="Switch Delivery" subtitle="Message routing health">
          <div className="space-y-2.5">
            {[
              ['Bridge mode', sw?.mode || 'simulated'],
              ['Events routed', sw?.event_count ?? 0],
              ['Agent messages', sw?.messages_routed ?? 0],
              ['Protocol', sw?.bridge || 'switch-relay/0.9'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-[#1b2432] bg-[#0a0f16] px-3 py-2.5">
                <span className="text-[12.5px] text-slate-500">{k}</span>
                <span className="text-[12.5px] text-slate-200 mono capitalize">{String(v)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {!agents?.length && <Empty title="No agents registered" />}
    </div>
  )
}