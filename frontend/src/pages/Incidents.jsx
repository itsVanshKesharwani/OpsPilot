import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { usePoll, timeAgo, fmtClock } from '../hooks'
import { Panel, SevBadge, Empty } from '../components/ui'
import { STATUS, SEV_ORDER } from '../constants'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'awaiting_approval', label: 'Awaiting approval' },
  { key: 'resolved', label: 'Resolved' },
]

export default function Incidents() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const { data: incidents } = usePoll(() => api.incidents(filter, q), 2500, [filter, q])

  const rows = [...(incidents || [])].sort(
    (a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9) || b.id - a.id,
  )

  return (
    <div className="space-y-5 rise">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Live Incidents</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Every alert detected, triaged and debugged by AI agents.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3.5 py-2 text-[12.5px] font-medium border transition ${
                filter === f.key
                  ? 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200'
                  : 'border-[#1b2432] bg-[#0b1018] text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search service / title…"
            className="rounded-lg border border-[#1b2432] bg-[#0b1018] px-3 py-2 text-[12.5px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-400/40 w-56"
          />
        </div>
      </div>

      <Panel padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#161d2a] text-[11px] uppercase tracking-[0.12em] text-slate-600">
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Incident</th>
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Severity</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Opened</th>
                <th className="px-5 py-3 font-semibold text-right">MTTR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inc) => {
                const st = STATUS[inc.status] || STATUS.detected
                return (
                  <tr
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="border-b border-[#131a26] cursor-pointer hover:bg-cyan-400/[0.04] transition"
                  >
                    <td className="px-5 py-3.5 mono text-[12.5px] text-slate-500">#{inc.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-[13.5px] font-semibold text-slate-100">{inc.title}</div>
                      <div className="text-[11.5px] text-slate-600 truncate max-w-[340px]">
                        {inc.root_cause || inc.description}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 mono text-[12.5px] text-slate-400">{inc.service}</td>
                    <td className="px-5 py-3.5"><SevBadge severity={inc.severity} /></td>
                    <td className="px-5 py-3.5">
                      <span
                        className="rounded px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide border"
                        style={{ color: st.color, borderColor: `${st.color}44`, background: `${st.color}14` }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{timeAgo(inc.created_at)}</td>
                    <td className="px-5 py-3.5 text-right mono text-[12.5px] text-slate-400">
                      {inc.resolution_minutes ? `${inc.resolution_minutes}m` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <Empty title="No incidents match this filter" hint="Try another filter or simulate an alert." />}
      </Panel>
    </div>
  )
}
