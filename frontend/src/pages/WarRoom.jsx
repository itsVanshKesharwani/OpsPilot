import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { usePoll, fmtClock } from '../hooks'
import { Panel, Empty } from '../components/ui'

const ROLE_META = {
  agent: { color: '#22d3ee', label: 'AI Agent' },
  human: { color: '#a78bfa', label: 'Human' },
  system: { color: '#f59e0b', label: 'System' },
}

export default function WarRoom() {
  const { data: messages, refresh } = usePoll(api.messages, 2000)
  const { data: sw } = usePoll(api.switchInfo, 5000)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages?.length])

  async function send(e) {
    e.preventDefault()
    if (!draft.trim()) return
    setSending(true)
    try {
      await api.sendMessage({ author: 'You (SRE)', role: 'human', content: draft.trim() })
      setDraft('')
      refresh()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5 rise">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">War Room</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Live chat between the on-call team and AI agents — routed through Switch.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[12.5px] text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-dot" />
          #incident-war-room connected
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        <Panel
          className="xl:col-span-2"
          title="Incident Channel"
          subtitle={`${(messages || []).length} messages · ${sw?.mode || 'simulated'} switch`}
          padded={false}
        >
          <div className="h-[560px] overflow-y-auto p-5 space-y-4">
            {(messages || []).map((m) => {
              const meta = ROLE_META[m.role] || ROLE_META.system
              const isHuman = m.role === 'human'
              return (
                <div key={m.id} className={`flex gap-3 ${isHuman ? 'flex-row-reverse' : ''}`}>
                  <div
                    className="h-9 w-9 shrink-0 rounded-lg grid place-items-center text-[11px] font-bold"
                    style={{ background: `${meta.color}1f`, color: meta.color, border: `1px solid ${meta.color}44` }}
                  >
                    {isHuman ? '🧑‍💼' : m.role === 'agent' ? '🤖' : '⚙️'}
                  </div>
                  <div className={`max-w-[76%] ${isHuman ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 text-[11.5px] mb-1" style={{ justifyContent: isHuman ? 'flex-end' : 'flex-start' }}>
                      <span className="font-semibold text-slate-300">{m.author}</span>
                      <span className="rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                        style={{ color: meta.color, background: `${meta.color}18` }}>
                        {meta.label}
                      </span>
                      <span className="text-slate-600 mono">{fmtClock(m.created_at)}</span>
                    </div>
                    <div
                      className="rounded-xl border px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-200"
                      style={{
                        borderColor: `${meta.color}33`,
                        background: isHuman ? 'rgba(167,139,250,.08)' : 'rgba(34,211,238,.05)',
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              )
            })}
            {!messages?.length && <Empty title="No messages yet" hint="Agents will report here as incidents unfold." />}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="border-t border-[#161d2a] p-3 flex gap-2.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message the team and agents… (e.g. Atlas, give me the blast radius)"
              className="flex-1 rounded-lg border border-[#1b2432] bg-[#0a0f16] px-3.5 py-2.5 text-[13px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-400/40"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="rounded-lg bg-cyan-500 px-4 py-2.5 text-[13px] font-bold text-[#04121b] hover:bg-cyan-400 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </Panel>

        <div className="space-y-5">
          <Panel title="Switch Event Log" subtitle="Everything routed through the bridge">
            <div className="space-y-2 max-h-[340px] overflow-y-auto">
              {(sw?.events || []).map((e) => (
                <div key={e.id} className="rounded-lg border border-[#1b2432] bg-[#0a0f16] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="mono text-[11.5px] text-cyan-300">{e.kind}</span>
                    <span
                      className={`ml-auto text-[10px] font-bold uppercase ${
                        e.status === 'delivered' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600 mono">{fmtClock(e.created_at)}</div>
                </div>
              ))}
              {!sw?.events?.length && <div className="text-[12.5px] text-slate-600">No events yet.</div>}
            </div>
          </Panel>

          <Panel title="Bridge Config" subtitle="Switch integration">
            <div className="space-y-2.5 text-[12.5px]">
              <div className="flex justify-between"><span className="text-slate-500">Server</span><span className="mono text-slate-300">{sw?.server}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Mode</span><span className="text-cyan-300 capitalize font-semibold">{sw?.mode}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Rooms</span><span className="mono text-slate-300">{sw?.rooms?.length ?? 0}</span></div>
              <div className="rounded-lg border border-cyan-400/25 bg-cyan-400/[0.07] p-3 text-[11.5px] text-cyan-200/90 leading-relaxed">
                Set <span className="mono">SWITCH_MODE=connected</span> + <span className="mono">SWITCH_WEBHOOK_URL</span> on the
                backend to flip from simulated → live Switch delivery.
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
