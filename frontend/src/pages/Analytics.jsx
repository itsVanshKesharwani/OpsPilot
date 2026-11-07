import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api'
import { usePoll } from '../hooks'
import { Panel, StatCard, Empty, Badge } from '../components/ui'

const SEV_COLORS = { critical: '#f43f5e', high: '#f59e0b', medium: '#38bdf8', low: '#22d3ee' }
const STATUS_COLORS = {
  resolved: '#10b981',
  awaiting_approval: '#a78bfa',
  debugging: '#38bdf8',
  triaged: '#f59e0b',
  detected: '#f43f5e',
  blocked: '#ef4444',
  rolling_back: '#f472b6',
  deploying: '#f472b6',
  closed: '#94a3b8',
}

const tooltipStyle = {
  background: '#0b1018',
  border: '1px solid #1f2937',
  borderRadius: 10,
  fontSize: 12.5,
  color: '#e5eaf3',
}

export default function Analytics() {
  const { data: a } = usePoll(api.analytics, 4000)

  if (!a) return <div className="panel h-64 shimmer" />

  const severityData = Object.entries(a.by_severity).map(([name, value]) => ({ name, value }))
  const statusData = Object.entries(a.by_status).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
    key: name,
  }))
  const agentData = a.agents.map((g) => ({ name: g.name, tasks: g.tasks_done, color: g.color }))

  return (
    <div className="space-y-5 rise">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight">Analytics</h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Resolution time, incident volume and agent performance over time.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="MTTR" value={`${a.mttr}m`} sub="average across all incidents" accent="#22d3ee" icon="⏱" trend={a.mttr_trend} />
        <StatCard label="Uptime" value={`${a.uptime}%`} sub="last 30 days" accent="#10b981" icon="◍" />
        <StatCard label="Auto-resolved" value={a.auto_resolved} sub="by AI agents" accent="#8b5cf6" icon="⚡" />
        <StatCard label="Human gates" value={a.human_gates} sub="approval checkpoints" accent="#f59e0b" icon="✓" />
      </div>

      <Panel title="Incident Volume & MTTR" subtitle="Trend across recorded days">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={a.by_day} margin={{ left: -18, right: 8, top: 6 }}>
              <defs>
                <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="mttr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#141c28" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1b2432' }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#1f2937' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="incidents" stroke="#22d3ee" strokeWidth={2} fill="url(#inc)" name="Incidents" />
              <Area type="monotone" dataKey="mttr" stroke="#a78bfa" strokeWidth={2} fill="url(#mttr)" name="MTTR (min)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-3 gap-5">
        <Panel title="Severity Split" subtitle="Where the risk sits">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={4} stroke="#0b1018">
                  {severityData.map((d) => (
                    <Cell key={d.name} fill={SEV_COLORS[d.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Status Distribution" subtitle="Current pipeline states">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={4} stroke="#0b1018">
                  {statusData.map((d) => (
                    <Cell key={d.key} fill={STATUS_COLORS[d.key] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Agent Productivity" subtitle="Tasks completed per agent">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentData} margin={{ left: -22, right: 8, top: 6 }}>
                <CartesianGrid stroke="#141c28" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1b2432' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(34,211,238,.06)' }} />
                <Bar dataKey="tasks" radius={[6, 6, 0, 0]}>
                  {agentData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Service Reliability" subtitle="Incidents and MTTR per service" padded={false}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#161d2a] text-[11px] uppercase tracking-wider text-slate-600">
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Incidents</th>
                <th className="px-5 py-3 font-semibold">Avg MTTR</th>
                <th className="px-5 py-3 font-semibold">Health</th>
              </tr>
            </thead>
            <tbody>
              {a.services.map((s) => (
                <tr key={s.service} className="border-b border-[#131a26]">
                  <td className="px-5 py-3 mono text-[12.5px] text-slate-300">{s.service}</td>
                  <td className="px-5 py-3 mono text-[12.5px] text-slate-400">{s.count}</td>
                  <td className="px-5 py-3 mono text-[12.5px] text-slate-400">{s.mttr}m</td>
                  <td className="px-5 py-3">
                    <div className="h-1.5 w-28 rounded-full bg-[#141c28] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(12, 100 - s.count * 16)}%`,
                          background: s.mttr > 45 ? '#f59e0b' : '#10b981',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!a.services.length && <Empty title="No data yet" />}
            </tbody>
          </table>
        </Panel>

        <Panel title="Incident Summary" subtitle="Key numbers for the postmortem">
          <div className="space-y-3">
            {[
              ['Total incidents recorded', a.by_severity.critical + a.by_severity.high + a.by_severity.medium + a.by_severity.low],
              ['Critical incidents', a.by_severity.critical],
              ['Human approval checkpoints', a.human_gates],
              ['Resolved by AI agents', a.auto_resolved],
              ['Mean time to resolve', `${a.mttr} minutes`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-[#1b2432] bg-[#0a0f16] px-4 py-3">
                <span className="text-[13px] text-slate-400">{k}</span>
                <span className="text-[15px] font-bold text-cyan-300 mono">{v}</span>
              </div>
            ))}
            <div className="rounded-lg border border-cyan-400/25 bg-cyan-400/[0.07] p-3.5 text-[12px] leading-relaxed text-cyan-100/85">
              Chronicle (Report Agent) auto-generates the postmortem from these numbers once an incident is resolved.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}