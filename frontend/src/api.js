const BASE = ''

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  stats: () => req('/api/stats'),
  incidents: (status = 'all', q = '') =>
    req(`/api/incidents?status=${status}${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  incident: (id) => req(`/api/incidents/${id}`),
  simulate: () => req('/api/incidents', { method: 'POST', body: {} }),
  agents: () => req('/api/agents'),
  tasks: () => req('/api/tasks'),
  patchTask: (id, body) => req(`/api/tasks/${id}`, { method: 'POST', body }),
  approvals: (status) => req(`/api/approvals${status ? `?status=${status}` : ''}`),
  decide: (id, decision, approver) =>
    req(`/api/approvals/${id}/decision`, { method: 'POST', body: { decision, approver } }),
  messages: () => req('/api/messages'),
  sendMessage: (body) => req('/api/messages', { method: 'POST', body }),
  analytics: () => req('/api/analytics'),
  switchInfo: () => req('/api/switch'),
}
