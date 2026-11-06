"""Seed data so the OpsPilot dashboard is never empty during a demo."""
import random
from datetime import datetime, timedelta

from db import execute, insert, init_db, now, one

AGENTS = [
    ("Sentinel", "Monitoring Agent", "SEN", "#22d3ee", "watchtower/probe-3"),
    ("Atlas", "Triage Agent", "ATL", "#8b5cf6", "opencode/gpt-agent"),
    ("Sherlock", "Debug / Repro Agent", "SHR", "#f59e0b", "codex/debugger"),
    ("Forge", "Fix Agent", "FGE", "#10b981", "opencode/patcher"),
    ("Pilot", "Release Agent", "PLT", "#f472b6", "switch/deployer"),
    ("Chronicle", "Report Agent", "CHR", "#60a5fa", "opencode/reporter"),
]

HISTORICAL = [
    ("Payment Service Down", "payment-api", "critical", "upstream",
     "Stripe webhook retry storm saturated the connection pool in payment-service v2.5",
     "Rollback payment-service v2.5 -> v2.4.9 and flush the retry queue", 18),
    ("Checkout latency spike", "checkout-svc", "high", "slow-query",
     "Missing composite index on orders(created_at) after the midnight migration",
     "Ship hotfix index migration #4412", 42),
    ("Search returning empty results", "search-api", "high", "bad-deploy",
     "Elasticsearch mapping upgrade removed the `in_stock` filter alias",
     "Restore mapping from snapshot and reindex 12k docs", 31),
    ("Auth token validation failing", "auth-svc", "critical", "config-drift",
     "JWK rotation deployed without refreshing the cached signing keys",
     "Restart auth pods and shorten JWK cache TTL to 60s", 9),
    ("Inventory sync stuck", "inventory-worker", "medium", "queue-backlog",
     "RabbitMQ consumer crashed on a malformed SKU payload, queue depth 84k",
     "Poison-queue the bad payload and redeploy worker v1.8", 55),
    ("CDN cache poisoning", "edge-cdn", "critical", "config-drift",
     "Vary header removed by the edge ruleset pushed at 03:10 UTC",
     "Revert edge ruleset to version 118", 22),
    ("Email notifications delayed", "notify-svc", "medium", "upstream",
     "SES rate limit hit after campaign launch, senders backed off incorrectly",
     "Add exponential backoff and raise sending quota", 47),
    ("Analytics dashboard timeout", "analytics-api", "low", "slow-query",
     "Unbounded GROUP BY over raw events table exceeded statement timeout",
     "Roll up events hourly and cap the query window at 90 days", 64),
]

TASKS = [
    ("Correlate payment-api 500s with v2.5 rollout", 3, "running", "P0"),
    ("Verify rollback canary in staging", 5, "queued", "P0"),
    ("Extract failing repro from customer session", 3, "queued", "P1"),
    ("Summarise incident timeline for stakeholders", 6, "queued", "P2"),
    ("Watch error-rate SLO after deploy", 1, "running", "P1"),
]

WAR_ROOM = [
    ("oncall-bot", "system", "🚨 Incident #1024 opened automatically by Sentinel."),
    ("Sentinel", "agent", "payment-api returning HTTP 500 at 41% of requests. Alert routed to #incident-war-room via Switch."),
    ("Atlas", "agent", "Severity: CRITICAL. Blast radius = checkout on production. Opening triage."),
    ("Riya (Eng Lead)", "human", "I have the oncall call open. Atlas, give me a root cause in 5 minutes."),
    ("Sherlock", "agent", "Repro built: POST /v1/charge with a retried idempotency key returns 500 on v2.5."),
    ("Riya (Eng Lead)", "human", "Approved rollback to v2.4.9. Pilot, take it."),
    ("Pilot", "agent", "Rolling back payment-service to v2.4.9 across 6 pods... verified healthy."),
]


def seed() -> None:
    init_db()
    if one("SELECT id FROM agents LIMIT 1"):
        return

    for name, role, icon, color, model in AGENTS:
        insert(
            "agents",
            {
                "name": name,
                "role": role,
                "icon": icon,
                "color": color,
                "status": "idle",
                "current_task": "",
                "model": model,
                "last_active": now(),
                "tasks_done": random.randint(12, 48),
            },
        )

    base = datetime.utcnow()
    for i, (title, service, sev, kind, cause, fix, minutes) in enumerate(HISTORICAL):
        created = base - timedelta(days=7 - i, hours=random.randint(1, 9))
        resolved = created + timedelta(minutes=minutes)
        iid = insert(
            "incidents",
            {
                "title": title,
                "service": service,
                "environment": "Production",
                "severity": sev,
                "status": "resolved",
                "description": f"Auto-detected anomaly on {service}.",
                "root_cause": cause if kind != "upstream" else f"Upstream dependency failure: {cause}",
                "proposed_fix": fix,
                "resolved_at": resolved.isoformat(timespec="seconds") + "Z",
                "resolution_minutes": float(minutes),
                "created_at": created.isoformat(timespec="seconds") + "Z",
                "updated_at": resolved.isoformat(timespec="seconds") + "Z",
            },
        )
        timeline = [
            ("detection", "System Alert", f"Anomaly detected on {service}", "alert"),
            ("triage", "Atlas", f"Severity {sev.upper()} confirmed, scope isolated", "info"),
            ("debug", "Sherlock", cause, "warn"),
            ("approval", "Human Approval", f"Approved: {fix}", "ok"),
            ("resolution", "Pilot", "Fix deployed and service verified healthy", "ok"),
        ]
        for stage, agent, msg, level in timeline:
            insert(
                "events",
                {
                    "incident_id": iid,
                    "stage": stage,
                    "agent": agent,
                    "message": msg,
                    "level": level,
                    "created_at": created.isoformat(timespec="seconds") + "Z",
                },
            )
        insert(
            "approvals",
            {
                "incident_id": iid,
                "action": "rollback" if "Rollback" in fix or "rollback" in fix else "deploy",
                "title": fix,
                "description": cause,
                "risk": "high" if sev == "critical" else "medium",
                "status": "approved",
                "created_at": created.isoformat(timespec="seconds") + "Z",
                "decided_at": created.isoformat(timespec="seconds") + "Z",
                "decided_by": "Riya (Eng Lead)",
            },
        )

    for title, agent_id, status, priority in TASKS:
        insert(
            "tasks",
            {
                "title": title,
                "agent_id": agent_id,
                "incident_id": 1,
                "status": status,
                "priority": priority,
                "created_at": now(),
                "updated_at": now(),
            },
        )

    stamp = base - timedelta(minutes=30)
    for author, role, content in WAR_ROOM:
        insert(
            "messages",
            {
                "author": author,
                "role": role,
                "content": content,
                "channel": "war-room",
                "created_at": stamp.isoformat(timespec="seconds") + "Z",
            },
        )
        stamp += timedelta(seconds=45)

    execute("UPDATE agents SET last_active = ? WHERE status = 'idle'", (now(),))
