import { Link } from 'react-router-dom'
import { api } from '../api'
import { usePoll, timeAgo } from '../hooks'
import { Panel, Empty } from '../components/ui'

const STATUS_META = {
  queued: { color: '#94a3b8', label: 'Queued' },
  running: { color: '#22d3ee', label: 'In progress' },
  done: { color: '#10b981', label: 'Completed' },
  failed: { color: '#f43f5e', label: 'Failed' },
}

const PRIORITY_META = {
  P0: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  P1: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  P2: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
}

export default function Tasks() {
  const { data: tasks } = usePoll(api.tasks, 2500)
  const { data: agents } = usePoll(api.agents, 5000)

  const grouped = {
    queued: (tasks || []).filter((t) => t.status === 'queued'),
    running: (tasks || []).filter((t) => t.status === 'running'),
    done: (tasks || []).filter((t) => t.status === 'done'),
    failed: (tasks || []).filter((t) => t.status === 'failed'),
  }

  async function advance(task) {
    const next = task.status === 'queued' ? 'running' : 'done'
    await api.patchTask(task.id, { status: next })
  }

  return (
    <div className="space-y-5 rise">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Task Manager</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Which task is assigned to which agent — drag-free, click to advance.
          </p>
        </div>
        <div className="ml-auto flex gap-4 text-right">
          {['queued', 'running', 'done'].map((k) => (
            <div key={k}>
              <div className="text-[11px] uppercase tracking-wider text-slate-600">
                {STATUS_META[k].label}
              </div>
              <div className="text-[20px] font-bold mono" style={{ color: STATUS_META[k].color }}>
                {grouped[k].length}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {['queued', 'running', 'done'].map((col) => (
          <Panel
            key={col}
            title={STATUS_META[col].label}
            subtitle={`${grouped[col].length} task${grouped[col].length === 1 ? '' : 's'}`}
          >
            <div className="space-y-3">
              {grouped[col].map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-[#1b2432] bg-[#0a0f16] p-3.5 hover:border-cyan-400/25 transition"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${PRIORITY_META[t.priority] || PRIORITY_META.P2}`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[13px] font-medium leading-snug text-slate-200">
                      {t.title}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span
                      className="rounded px-2 py-0.5 text-[10.5px] font-bold"
                      style={{ background: `${t.agent_color || '#22d3ee'}1f`, color: t.agent_color || '#22d3ee' }}
                    >
                      {t.agent_name || 'Unassigned'}
                    </span>
                    {t.incident_id && (
                      <Link
                        to={`/incidents/${t.incident_id}`}
                        className="mono text-[11px] text-slate-500 hover:text-cyan-300"
                      >
                        #{t.incident_id}
                      </Link>
                    )}
                    <span className="ml-auto text-[11px] text-slate-600">{timeAgo(t.updated_at)}</span>
                  </div>

                  {t.incident_title && (
                    <div className="mt-2 text-[11.5px] text-slate-600 truncate">{t.incident_title}</div>
                  )}

                  {col !== 'done' && (
                    <button
                      onClick={() => advance(t)}
                      className="mt-3 w-full rounded-lg border border-[#1f2937] bg-[#0e141d] py-1.5 text-[12px] font-semibold text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200 transition"
                    >
                      {col === 'queued' ? '▶ Start task' : '✓ Mark complete'}
                    </button>
                  )}
                </div>
              ))}
              {!grouped[col].length && (
                <div className="rounded-lg border border-dashed border-[#1f2937] py-8 text-center text-[12.5px] text-slate-600">
                  Nothing here
                </div>
              )}
            </div>
          </Panel>
        ))}
      </div>

      {!tasks?.length && <Empty title="No tasks assigned yet" hint="Simulate an alert to see agents pick up work." />}
    </div>
  )
}
