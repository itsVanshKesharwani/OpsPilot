import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Topbar({ onSimulated, pending = 0 }) {
  const [busy, setBusy] = useState(false)
  const [clock, setClock] = useState(new Date())
  const [toast, setToast] = useState('')

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  async function fire() {
    setBusy(true)
    try {
      const inc = await api.simulate()
      setToast(`Incident #${inc.id} injected — detection started`)
      onSimulated?.(inc)
      setTimeout(() => setToast(''), 4200)
    } catch (e) {
      setToast('Could not reach backend: ' + e.message)
      setTimeout(() => setToast(''), 4200)
    } finally {
      setBusy(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#161d2a] bg-[#060910]/85 backdrop-blur-md">
      <div className="h-16 px-6 flex items-center gap-4">
        <div className="flex items-center gap-2.5 text-[13px]">
          <span className="h-2 w-2 rounded-full bg-emerald-400 live-dot" />
          <span className="text-slate-300 font-medium">Production · Live</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500 mono text-[12px]">
            {clock.toLocaleTimeString(undefined, { hour12: false })} UTC
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {pending > 0 && (
            <div className="hidden md:flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-[12.5px] text-amber-200">
              ⏳ {pending} approval{pending > 1 ? 's' : ''} pending
            </div>
          )}
          <button
            onClick={fire}
            disabled={busy}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-[13px] font-semibold text-[#03131c] shadow-[0_0_20px_-6px_rgba(34,211,238,.7)] hover:brightness-110 active:scale-[.98] transition disabled:opacity-60"
          >
            {busy ? 'Injecting…' : '⚡ Simulate Production Alert'}
          </button>
          <div className="h-9 w-9 rounded-full bg-[#111823] border border-[#1f2937] grid place-items-center text-[12px] font-bold text-cyan-300">
            RK
          </div>
        </div>
      </div>
      {toast && (
        <div className="px-6 pb-3 rise">
          <div className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[12.5px] text-cyan-100">
            {toast}
          </div>
        </div>
      )}
    </header>
  )
}
