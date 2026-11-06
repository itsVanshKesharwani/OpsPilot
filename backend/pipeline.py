"""Incident lifecycle: detection -> triage -> debug -> approval -> resolution.

Every stage is executed by an AI agent (simulated reasoning), routed through
Switch so the War Room shows live collaboration, and the final destructive
step (rollback) always waits for explicit human approval.
"""
import asyncio
import random
from datetime import datetime

from db import insert, now, one, update
import switch_client as switch

INCIDENT_LIBRARY = [
    {
        "title": "Payment Service Down",
        "service": "payment-api",
        "severity": "critical",
        "description": "Payment API is returning HTTP 500 errors for all card transactions.",
        "root_cause": "payment-service v2.5 leaks connections when the Stripe webhook retries an idempotent charge.",
        "fix": "Rollback payment-service v2.5 -> v2.4.9 and drain the retry queue",
        "action": "rollback",
        "risk": "high",
        "log": "ERROR PaymentController#charge: pool exhausted (max=20, active=20)",
    },
    {
        "title": "Checkout latency spike in EU region",
        "service": "checkout-svc",
        "severity": "high",
        "description": "p95 checkout latency jumped from 340ms to 4.8s in eu-west-1.",
        "root_cause": "Unindexed filter on orders(created_at) after migration 4411 forced a sequential scan.",
        "fix": "Apply hotfix index migration 4412 on orders(created_at, status)",
        "action": "deploy",
        "risk": "medium",
        "log": "WARN slow query 4612ms: SELECT * FROM orders WHERE created_at > $1",
    },
    {
        "title": "Auth token validation failing",
        "service": "auth-svc",
        "severity": "critical",
        "description": "30% of sessions rejected with 401 since the JWK rotation.",
        "root_cause": "JWK signing keys rotated without invalidating the cached key set in auth-svc.",
        "fix": "Restart auth pods and lower JWK cache TTL from 3600s to 60s",
        "action": "rollback",
        "risk": "high",
        "log": "ERROR JwksProvider: no matching key id=2026-11-05-03",
    },
    {
        "title": "Search returning empty results",
        "service": "search-api",
        "severity": "high",
        "description": "Product search returns 0 hits for known queries.",
        "root_cause": "Elasticsearch mapping upgrade dropped the in_stock filter alias during the nightly job.",
        "fix": "Restore mapping from snapshot and reindex the catalog shard",
        "action": "deploy",
        "risk": "medium",
        "log": "WARN search returned 0 docs for query match_all with filter in_stock",
    },
    {
        "title": "Inventory sync worker crash loop",
        "service": "inventory-worker",
        "severity": "medium",
        "description": "Worker pod restarting every 40s, queue depth at 84,000.",
        "root_cause": "Malformed SKU payload raises an unhandled TypeError in the consumer.",
        "fix": "Move bad payload to poison queue and redeploy worker v1.8.2",
        "action": "deploy",
        "risk": "low",
        "log": "ERROR Consumer: TypeError: unsupported operand type(s) for +: 'NoneType'",
    },
]

STAGES = ["detection", "triage", "debug", "approval", "resolution"]

_running: set[int] = set()


def _event(incident_id: int, stage: str, agent: str, message: str, level: str = "info") -> None:
    insert(
        "events",
        {
            "incident_id": incident_id,
            "stage": stage,
            "agent": agent,
            "message": message,
            "level": level,
            "created_at": now(),
        },
    )


def _say(author: str, role: str, content: str) -> None:
    switch.post_message(author, role, content)


def _agent(name: str, status: str, task: str = "") -> None:
    update("agents", one("SELECT id FROM agents WHERE name = ?", (name,))["id"],
           {"status": status, "current_task": task, "last_active": now()})


def _task(title: str, agent_id: int, incident_id: int, status: str, priority: str) -> int:
    return insert(
        "tasks",
        {
            "title": title,
            "agent_id": agent_id,
            "incident_id": incident_id,
            "status": status,
            "priority": priority,
            "created_at": now(),
            "updated_at": now(),
        },
    )


def _agent_id(name: str) -> int:
    return one("SELECT id FROM agents WHERE name = ?", (name,))["id"]


async def create_incident(payload: dict | None = None) -> int:
    """A production alert just fired - Detection stage."""
    tpl = random.choice(INCIDENT_LIBRARY)
    data = {**tpl, **(payload or {})}
    iid = insert(
        "incidents",
        {
            "title": data["title"],
            "service": data["service"],
            "environment": data.get("environment", "Production"),
            "severity": data["severity"],
            "status": "detected",
            "description": data["description"],
            "root_cause": "",
            "proposed_fix": "",
            "resolved_at": None,
            "resolution_minutes": None,
            "created_at": now(),
            "updated_at": now(),
        },
    )
    _event(iid, "detection", "System Alert", data["description"], "alert")
    _event(iid, "detection", "Sentinel", f"{data['log']} - correlating with recent deploys", "warn")
    _agent("Sentinel", "working", f"Watching {data['service']} after incident #{iid}")
    _task(f"Detect + page oncall for {data['service']}", _agent_id("Sentinel"), iid, "done", "P0")
    switch.emit("incident.opened", {"id": iid, "title": data["title"], "severity": data["severity"]})
    _say("Sentinel", "agent", f"🚨 Incident #{iid} opened: {data['title']} ({data['severity'].upper()}). Routed to #incident-war-room.")

    if iid not in _running:
        _running.add(iid)
        asyncio.create_task(run_pipeline(iid, data))
    return iid


async def run_pipeline(iid: int, data: dict) -> None:
    try:
        # ---- Stage 2: AI triage -------------------------------------------
        await asyncio.sleep(2)
        _agent("Sentinel", "idle")
        _agent("Atlas", "working", f"Triaging incident #{iid}")
        _event(iid, "triage", "Atlas", "Analyzing logs, traces and recent deploys...", "info")
        _say("Atlas", "agent", f"#{iid}: pulling last 15 minutes of logs for {data['service']}.")

        await asyncio.sleep(3.5)
        sev = data["severity"]
        _event(iid, "triage", "Atlas",
               f"Severity {sev.upper()} confirmed. Blast radius: {data['description']} - root cause hypothesis identified.",
               "warn" if sev in ("critical", "high") else "info")
        _task(f"Triage: isolate blast radius for {data['service']}", _agent_id("Atlas"), iid, "done", "P0")
        _say("Atlas", "agent", f"#{iid}: severity {sev.upper()} - {data['root_cause'][:120]}")
        update("incidents", iid, {"status": "triaged", "updated_at": now()})

        # ---- Stage 3: AI debugging / repro --------------------------------
        _agent("Atlas", "idle")
        _agent("Sherlock", "working", f"Building repro for incident #{iid}")
        _event(iid, "debug", "Sherlock", "Debug Agent building a minimal reproduction from live traffic...", "info")
        _task(f"Reproduce {data['service']} failure", _agent_id("Sherlock"), iid, "running", "P0")
        update("incidents", iid, {"status": "debugging", "updated_at": now()})

        await asyncio.sleep(4)
        _event(iid, "debug", "Sherlock", f"Repro confirmed: {data['log']}", "warn")
        _say("Sherlock", "agent", f"#{iid}: repro built - `{data['log'][:90]}`")

        await asyncio.sleep(2.5)
        _event(iid, "debug", "Sherlock", f"Root cause: {data['root_cause']}", "warn")
        _event(iid, "debug", "Forge", f"Proposed fix: {data['fix']}", "ok")
        _task(f"Draft fix: {data['fix'][:60]}", _agent_id("Forge"), iid, "queued", "P0")
        _agent("Sherlock", "idle")
        _say("Forge", "agent", f"#{iid}: proposed `{data['action']}` - {data['fix']}")
        update("incidents", iid,
               {"status": "awaiting_approval", "root_cause": data["root_cause"],
                "proposed_fix": data["fix"], "updated_at": now()})

        # ---- Stage 4: human approval gate ---------------------------------
        _event(iid, "approval", "Human Approval",
               f"Proposed {data['action']} is blocked until a human approves it.", "info")
        approval_id = insert(
            "approvals",
            {
                "incident_id": iid,
                "action": data["action"],
                "title": data["fix"],
                "description": data["root_cause"],
                "risk": data["risk"],
                "status": "pending",
                "created_at": now(),
                "decided_at": None,
                "decided_by": None,
            },
        )
        switch.emit("approval.requested", {"approval": approval_id, "incident": iid, "action": data["action"]})
        _say("Pilot", "agent",
             f"⏸️ Incident #{iid}: {data['action']} staged and waiting for human approval in Approval Center.")
    finally:
        _running.discard(iid)


async def execute_approved(approval_id: int) -> None:
    """Only ever called after a human clicked Approve."""
    ap = one("SELECT * FROM approvals WHERE id = ?", (approval_id,))
    if not ap:
        return
    iid = ap["incident_id"]
    incident = one("SELECT * FROM incidents WHERE id = ?", (iid,))
    _agent("Pilot", "working", f"Executing approved {ap['action']} for #{iid}")
    update("incidents", iid, {"status": "rolling_back" if ap["action"] == "rollback" else "deploying",
                              "updated_at": now()})
    _event(iid, "resolution", "Pilot",
           f"Approved by {ap['decided_by']} - executing {ap['action']}: {ap['title']}", "info")
    _task(f"Execute {ap['action']}: {ap['title'][:60]}", _agent_id("Pilot"), iid, "running", "P0")
    _say("Pilot", "agent", f"🚀 #{iid}: executing {ap['action']} across 6 pods (approved by {ap['decided_by']}).")
    switch.emit("action.executed", {"approval": approval_id, "action": ap["action"]})

    await asyncio.sleep(5)

    created = datetime.fromisoformat(incident["created_at"].replace("Z", ""))
    minutes = round((datetime.utcnow() - created).total_seconds() / 60, 1)
    update("incidents", iid,
           {"status": "resolved", "resolved_at": now(), "resolution_minutes": minutes, "updated_at": now()})
    _event(iid, "resolution", "Pilot", f"Service restored and verified healthy in 4.2s. Error rate back to 0.0%.", "ok")
    _event(iid, "resolution", "Chronicle", f"Report generated - MTTR {minutes} minutes.", "ok")
    pilot = one("SELECT * FROM agents WHERE name = 'Pilot'")
    update("agents", pilot["id"], {"status": "idle", "current_task": "",
                                   "tasks_done": pilot["tasks_done"] + 1})
    execute_task = one("SELECT id FROM tasks WHERE incident_id = ? AND status IN ('running','queued')", (iid,))
    if execute_task:
        update("tasks", execute_task["id"], {"status": "done", "updated_at": now()})
    _say("Pilot", "agent", f"✅ Incident #{iid} resolved - payment traffic normal, verified for 60s.")
    switch.emit("incident.resolved", {"id": iid, "mttr_minutes": minutes})
