export const SEVERITY = {
  critical: { label: 'Critical', color: '#f43f5e', bg: 'rgba(244,63,94,.14)', text: '#fda4af' },
  high: { label: 'High', color: '#f59e0b', bg: 'rgba(245,158,11,.14)', text: '#fcd34d' },
  medium: { label: 'Medium', color: '#38bdf8', bg: 'rgba(56,189,248,.14)', text: '#7dd3fc' },
  low: { label: 'Low', color: '#22d3ee', bg: 'rgba(34,211,238,.12)', text: '#67e8f9' },
}

export const STATUS = {
  detected: { label: 'Detected', color: '#f43f5e' },
  triaged: { label: 'Triaged', color: '#f59e0b' },
  debugging: { label: 'Debugging', color: '#38bdf8' },
  awaiting_approval: { label: 'Awaiting Approval', color: '#a78bfa' },
  rolling_back: { label: 'Rolling Back', color: '#f472b6' },
  deploying: { label: 'Deploying', color: '#f472b6' },
  resolved: { label: 'Resolved', color: '#10b981' },
  blocked: { label: 'Blocked', color: '#ef4444' },
  closed: { label: 'Closed', color: '#94a3b8' },
}

export const AGENT_STATUS = {
  working: { label: 'Working', color: '#22d3ee' },
  idle: { label: 'Idle', color: '#64748b' },
  thinking: { label: 'Thinking', color: '#a78bfa' },
}

export const STAGES = [
  { key: 'detection', title: 'Detection', sub: 'System Alert' },
  { key: 'triage', title: 'AI Analysis', sub: 'Triage Agent' },
  { key: 'debug', title: 'Debugging', sub: 'Debug Agent' },
  { key: 'approval', title: 'Approval', sub: 'Human Approval' },
  { key: 'resolution', title: 'Resolution', sub: 'Release Agent' },
]

export const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }
