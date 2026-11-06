import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Overview', icon: '◱', end: true },
  { to: '/incidents', label: 'Live Incidents', icon: '◉' },
  { to: '/agents', label: 'AI Agents', icon: '⬢' },
  { to: '/war-room', label: 'War Room', icon: '✦' },
  { to: '/tasks', label: 'Task Manager', icon: '▤' },
  { to: '/approvals', label: 'Approval Center', icon: '✓' },
  { to: '/analytics', label: 'Analytics', icon: '∿' },
]

export default function Sidebar({ pending = 0, active = 0 }) {
  return (
    <aside className="fixed inset-y-0 left-0 w-[236px] border-r border-[#161d2a] bg-[#080b12]/95 backdrop-blur flex flex-col z-30">
      <div className="px-5 py-5 border-b border-[#161d2a]">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 grid place-items-center text-[#04121b] font-extrabold text-sm glow-cyan">
            OP
          </div>
          <div>
            <div className="font-bold tracking-tight leading-4">OpsPilot</div>
            <div className="text-[10.5px] text-slate-500 uppercase tracking-[0.14em] mt-0.5">
              Incident Command
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          Workspace
        </div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-all',
                isActive
                  ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent',
              ].join(' ')
            }
          >
            <span className="text-[13px] w-4 text-center opacity-80">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
            {item.to === '/approvals' && pending > 0 && (
              <span className="ml-auto text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/25">
                {pending}
              </span>
            )}
            {item.to === '/incidents' && active > 0 && (
              <span className="ml-auto text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25">
                {active}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[#161d2a]">
        <div className="rounded-lg bg-[#0c111a] border border-[#161d2a] p-3">
          <div className="flex items-center gap-2 text-[11.5px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-dot" />
            Switch bridge online
          </div>
          <div className="mt-1.5 text-[10.5px] text-slate-600 mono">relay/0.9 · 3 rooms</div>
        </div>
      </div>
    </aside>
  )
}
