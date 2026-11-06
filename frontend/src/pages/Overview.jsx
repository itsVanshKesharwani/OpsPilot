import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { usePoll, timeAgo, fmtClock } from '../hooks'
import { Panel, StatCard, SevBadge, Empty } from '../components/ui'
import { STATUS, AGENT_STATUS, SEVERITY } from '../constants'

function StageStrip({ status }) {
  const order = ['detected', 'triaged', 'debugging', 'awaiting_approval', 'rolling_back', 'deploying', 'resolved']
  const idx = Math.max(0, order.indexOf(status))
  const labels = ['Detect', 'Triage', 'Debug', 'Approve', 'Resolve']
  const visual = ['detected', 'triaged', 'debugging', 'awaiting_approval', 'resolved']
  const cur =
    status === 'rolling_back' || status === 'deploying' ? 3 : status === 'blocked' ? 3 : Math.min(idx, 4)

  return (
    <div className="flex items-center gap-1.5">
      {labels.map((l, i) => {
        const state = status === 'resolved' ? 'done' : i < cur ? 'done' : i === cur ? 'active' : 'todo'
        const color = state === 'done' ? '#10b981' : state === 'active' ? '#22d3ee' : '#1f2937'
        return (
          <div key={l} className="flex items-center gap-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${state === 'active' ? 'live-dot' : ''}`}
              style={{ width: i === cur ? 34 : 20, background: color }}
            />
            <span
              className={`text-[10.5px] ${state === 'todo' ? 'text-slate-700' : 'text-slate-400'} ${i === cur ? 'font-semibold text-cyan-300' : ''}`}
            >
              {l}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function Overview({ stats }) {
  const navigate = useNavigate()
  const { data: incidents } = usePoll(() => api.incidents('all'), 2500)
  const { data: agents } = usePoll(api.agents, 2500)
  const { data: sw } = usePoll(api.switchInfo, 5000)

  const active = (incidents || []).filter((i) => !['resolved', 'closed'].includes(i.status))
  const recent = (incidents || []).slice(0, 5)

  return (
    <div className="space-y-5 rise">
      {/* hero */}
      <div className="panel p-5 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end gap-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-cyan-400/80 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 live-dot" /> AI Incident Command Center
            </div>
            <h1 className="mt-2 text-[26px] font-extrabold tracking-tight">
              {active.length > 0 ? (
                <>
                  <span className="text-rose-400">{active.length} active incident{active.length > 1 ? 's' : ''}</span>
                  <span className="text-slate-600"> · </span>
                  <span className="text-slate-300">all systems being watched</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-400">All systems operational</span>
                  <span className="text-slate-600"> · </span>
                  <span className="text-slate-400 font-medium">0 active incidents</span>
                </>
              )}
            </h1>
            <p className="mt-1.5 text-[13px] text-slate-500">
              Monitoring, triaging and resolving production issues with autonomous AI agents — every
              critical action gated by human approval.
            </p>
          </div>

          <div className="ml-auto flex gap-6">
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-600">Uptime</div>
              <div className="text-[22px] font-bold text-emerald-400 mono">{stats?.uptime ?? '99.94'}%</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-600">MTTR</div>
              <div className="text-[22px] font-bold text-cyan-300 mono">{stats?.mttr_minutes ?? 0}m</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-600">Agents</div>
              <div className="text-[22px] font-bold text-violet-300 mono">
                {stats?.agents_active ?? 0}/{stats?.agents_total ?? 6}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Active" value={stats?.active_incidents ?? 0} sub="needs attention" accent="#f43f5e" icon="◉" />
        <StatCard label="Resolved" value={stats?.resolved_incidents ?? 0} sub="auto-closed by agents" accent="#10b981" icon="✓" />
        <StatCard label="MTTR" value={`${stats?.mttr_minutes ?? 0}m`} sub="mean time to resolve" accent="#22d3ee" icon="⏱" />
        <StatCard label="Approvals" value={stats?.pending_approvals ?? 0} sub="waiting on humans" accent="#f59e0b" icon="⏳" />
        <StatCard label="Open tasks" value={stats?.open_tasks ?? 0} sub="assigned to agents" accent="#8b5cf6" icon="▤" />
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        {/* live incidents */}
        <Panel
          className="xl:col-span-2"
          title="Live Incidents"
          subtitle="Auto-detected production anomalies"
          action={
            <Link to="/incidents" className="text-[12.5px] text-cyan-400 hover:text-cyan-300 font-medium">
              View all →
            </Link>
          }
        >
          {!recent.length ? (
            <Empty title="No incidents yet" hint="Hit “Simulate Production Alert” to run the full workflow." />
          ) : (
            <div className="space-y-3">
              {active.length === 0 && (
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3.5 py-2.5 text-[12.5px] text-emerald-200">
                  ✓ No active incidents. Agents are idle and watching.
                </div>
              )}
              {recent.map((inc) => {
                const st = STATUS[inc.status] || STATUS.detected
                return (
                  <button
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="w-full text-left rounded-xl border border-[#1b2432] bg-[#0b1018] p-3.5 hover:border-cyan-400/35 hover:bg-[#0d141f] transition group"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="mono text-[11.5px] text-slate-600">#{inc.id}</span>
                      <SevBadge severity={inc.severity} />
                      <span className="text-[13.5px] font-semibold text-slate-100 group-hover:text-cyan-200">
                        {inc.title}
                      </span>
                      <span
                        className="ml-auto rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide border"
                        style={{ color: st.color, borderColor: `${st.color}44`, background: `${st.color}14` }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3 flex-wrap">
                      <span className="text-[11.5px] text-slate-500 mono">{inc.service}</span>
                      <span className="text-[11.5px] text-slate-600">· {inc.environment}</span>
                      <span className="text-[11.5px] text-slate-600">· {timeAgo(inc.created_at)}</span>
                    </div>
                    <div className="mt-3">
                      <StageStrip status={inc.status} />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </Panel>

        {/* agents */}
        <Panel
          title="AI Agents"
          subtitle="Live agent status via Switch"
          action={
            <Link to="/agents" className="text-[12.5px] text-cyan-400 hover:text-cyan-300 font-medium">
              Manage →
            </Link>
          }
        >
          <div className="space-y-2.5">
            {(agents || []).map((a) => {
              const st = AGENT_STATUS[a.status] || AGENT_STATUS.idle
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-[#1b2432] bg-[#0b1018] px-3 py-2.5">
                  <div
                    className="h-8 w-8 rounded-md grid place-items-center text-[10.5px] font-bold"
                    style={{ background: `${a.color}1f`, color: a.color, border: `1px solid ${a.color}44` }}
                  >
                    {a.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-200">{a.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{a.role}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${a.status === 'working' ? 'live-dot' : ''}`}
                        style={{ background: st.color }}
                      />
                      <span className="text-[11px]" style={{ color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-600 mono">{a.tasks_done} tasks</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        {/* switch */}
        <Panel title="Switch Bridge" subtitle="Agent ↔ team communication layer">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-[#1b2432] bg-[#0b1018] px-3 py-2.5">
              <span className="text-[12.5px] text-slate-400">Mode</span>
              <span
                className={`text-[11.5px] font-bold uppercase tracking-wide ${
                  sw?.connected ? 'text-emerald-400' : 'text-cyan-300'
                }`}
              >
                {sw?.mode || 'simulated'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#1b2432] bg-[#0b1018] px-3 py-2.5">
              <span className="text-[12.5px] text-slate-400">Server</span>
              <span className="text-[11.5px] text-slate-300 mono">{sw?.server || '—'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#1b2432] bg-[#0b1018] px-3 py-2.5">
              <span className="text-[12.5px] text-slate-400">Events routed</span>
              <span className="text-[13px] font-bold text-cyan-300 mono">{sw?.event_count ?? 0}</span>
            </div>
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-600">Rooms</div>
              <div className="flex flex-wrap gap-1.5">
                {(sw?.rooms || []).map((r) => (
                  <span key={r} className="rounded border border-[#1f2937] bg-[#0b1018] px-2 py-1 text-[11px] text-slate-400 mono">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to="/war-room"
              className="block rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-center text-[12.5px] font-semibold text-cyan-200 hover:bg-cyan-400/15"
            >
              Open War Room →
            </Link>
          </div>
        </Panel>

        {/* recent feed */}
        <Panel className="xl:col-span-2" title="Recent Incident Feed" subtitle="Newest first">
          <div className="space-y-2">
            {recent.map((inc) => (
              <div key={inc.id} className="flex items-start gap-3 rounded-lg border border-[#1b2432] bg-[#0b1018] px-3 py-2.5">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: (SEVERITY[inc.severity] || SEVERITY.low).color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="mono text-[11.5px] text-slate-600">#{inc.id}</span>
                    <span className="text-[13px] font-medium text-slate-200 truncate">{inc.title}</span>
                  </div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5">
                    {inc.service} · {fmtClock(inc.created_at)} ·{' '}
                    {inc.status === 'resolved'
                      ? `resolved in ${inc.resolution_minutes}m`
                      : (STATUS[inc.status] || {}).label}
                  </div>
                </div>
              </div>
            ))}
            {!recent.length && <Empty title="Feed is empty" />}
          </div>
        </Panel>
      </div>
    </div>
  )
}
