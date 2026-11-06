import { useCallback, useEffect, useRef, useState } from 'react'

/** Polls an async loader so the dashboard feels live (2.5s cadence). */
export function usePoll(loader, ms = 2500, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const refresh = useCallback(async () => {
    try {
      const next = await loaderRef.current()
      setData(next)
      setError(null)
      return next
    } catch (e) {
      setError(e.message)
      return null
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, ms)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, ms, ...deps])

  return { data, error, refresh }
}

export function timeAgo(iso) {
  if (!iso) return '—'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 5) return 'just now'
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function fmtClock(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
