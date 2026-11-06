"""OpsPilot – AI Incident Command Center (FastAPI backend)."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import pipeline
import switch_client as switch
from db import init_db, now, one, query, update
from seed import seed

DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed()
    yield


app = FastAPI(title="OpsPilot API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class IncidentIn(BaseModel):
    title: str | None = None
    service: str | None = None
    severity: str | None = None
    description: str | None = None
    environment: str | None = "Production"


class DecisionIn(BaseModel):
    decision: str  # approve | reject
    approver: str = "Riya (Eng Lead)"


class MessageIn(BaseModel):
    author: str = "You"
    role: str = "human"
    content: str


class TaskIn(BaseModel):
    status: str | None = None
    agent_id: int | None = None


# ---------------------------------------------------------------- dashboard
@app.get("/api/health")
def health():
    return {"ok": True, "service": "opspilot", "ts": now()}


@app.get("/api/stats")
def stats():
    incidents = query("SELECT * FROM incidents")
    active = [i for i in incidents if i["status"] not in ("resolved", "closed")]
    resolved = [i for i in incidents if i["status"] == "resolved"]
    mttrs = [i["resolution_minutes"] for i in resolved if i["resolution_minutes"]]
    pending = one("SELECT COUNT(*) c FROM approvals WHERE status='pending'")["c"]
    running_tasks = one("SELECT COUNT(*) c FROM tasks WHERE status IN ('running','queued')")["c"]
    by_sev = {s: one("SELECT COUNT(*) c FROM incidents WHERE severity=?", (s,))["c"]
              for s in ("critical", "high", "medium", "low")}
    last24 = one(
        "SELECT COUNT(*) c FROM incidents WHERE created_at >= datetime('now','-1 day')"
    )["c"]
    agents = query("SELECT * FROM agents")
    return {
        "total_incidents": len(incidents),
        "active_incidents": len(active),
        "resolved_incidents": len(resolved),
        "mttr_minutes": round(sum(mttrs) / len(mttrs), 1) if mttrs else 0,
        "pending_approvals": pending,
        "open_tasks": running_tasks,
        "by_severity": by_sev,
        "last_24h": last24,
        "agents_active": sum(1 for a in agents if a["status"] != "idle"),
        "agents_total": len(agents),
        "uptime": 99.94,
    }


@app.get("/api/incidents")
def list_incidents(status: str | None = None, q: str | None = None):
    sql = "SELECT * FROM incidents"
    args: list = []
    if status and status != "all":
        if status == "active":
            sql += " WHERE status NOT IN ('resolved','closed')"
        else:
            sql += " WHERE status = ?"
            args.append(status)
    if q:
        sql += (" AND " if "WHERE" in sql else " WHERE ") + "(title LIKE ? OR service LIKE ?)"
        args += [f"%{q}%", f"%{q}%"]
    sql += " ORDER BY id DESC"
    rows = query(sql, tuple(args))
    for r in rows:
        r["events"] = query("SELECT * FROM events WHERE incident_id=? ORDER BY id", (r["id"],))
        r["approval"] = one("SELECT * FROM approvals WHERE incident_id=? ORDER BY id DESC", (r["id"],))
    return rows


@app.get("/api/incidents/{iid}")
def get_incident(iid: int):
    row = one("SELECT * FROM incidents WHERE id=?", (iid,))
    if not row:
        raise HTTPException(404, "Incident not found")
    row["events"] = query("SELECT * FROM events WHERE incident_id=? ORDER BY id", (iid,))
    row["approval"] = one("SELECT * FROM approvals WHERE incident_id=? ORDER BY id DESC", (iid,))
    row["tasks"] = query(
        "SELECT t.*, a.name agent_name FROM tasks t LEFT JOIN agents a ON a.id=t.agent_id "
        "WHERE t.incident_id=? ORDER BY t.id",
        (iid,),
    )
    return row


@app.post("/api/incidents", status_code=201)
async def simulate_incident(payload: IncidentIn | None = None):
    data = {k: v for k, v in (payload.model_dump() if payload else {}).items() if v}
    iid = await pipeline.create_incident(data or None)
    return one("SELECT * FROM incidents WHERE id=?", (iid,))


# ---------------------------------------------------------------- agents
@app.get("/api/agents")
def agents():
    rows = query(
        "SELECT a.*, (SELECT COUNT(*) FROM tasks t WHERE t.agent_id=a.id) assigned "
        "FROM agents a ORDER BY a.id"
    )
    for a in rows:
        a["current_incident"] = one(
            "SELECT id,title FROM incidents WHERE id IN "
            "(SELECT incident_id FROM tasks WHERE agent_id=? AND status!='done') LIMIT 1",
            (a["id"],),
        )
    return rows


# ---------------------------------------------------------------- tasks
@app.get("/api/tasks")
def tasks():
    return query(
        "SELECT t.*, a.name agent_name, a.color agent_color, i.title incident_title "
        "FROM tasks t LEFT JOIN agents a ON a.id=t.agent_id "
        "LEFT JOIN incidents i ON i.id=t.incident_id ORDER BY t.id DESC"
    )


@app.post("/api/tasks/{tid}")
def update_task(tid: int, payload: TaskIn):
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(400, "No fields to update")
    data["updated_at"] = now()
    update("tasks", tid, data)
    return one("SELECT * FROM tasks WHERE id=?", (tid,))


# ---------------------------------------------------------------- approvals
@app.get("/api/approvals")
def approvals(status: str | None = None):
    sql = (
        "SELECT p.*, i.title incident_title, i.service, i.severity "
        "FROM approvals p LEFT JOIN incidents i ON i.id=p.incident_id"
    )
    args: tuple = ()
    if status:
        sql += " WHERE p.status=?"
        args = (status,)
    sql += " ORDER BY p.id DESC"
    return query(sql, args)


@app.post("/api/approvals/{aid}/decision")
async def decide(aid: int, payload: DecisionIn):
    ap = one("SELECT * FROM approvals WHERE id=?", (aid,))
    if not ap:
        raise HTTPException(404, "Approval not found")
    if ap["status"] != "pending":
        raise HTTPException(400, "Approval already decided")

    if payload.decision == "approve":
        update("approvals", aid,
               {"status": "approved", "decided_at": now(), "decided_by": payload.approver})
        pipeline._event(ap["incident_id"], "approval", "Human Approval",
                        f"APPROVED by {payload.approver} - {ap['title']}", "ok")
        pipeline._say(payload.approver, "human",
                      f"✅ Approved: {ap['title']} ({ap['action']}) for incident #{ap['incident_id']}.")
        switch.emit("approval.decided", {"approval": aid, "decision": "approve"})
        import asyncio
        asyncio.create_task(pipeline.execute_approved(aid))
    elif payload.decision == "reject":
        update("approvals", aid,
               {"status": "rejected", "decided_at": now(), "decided_by": payload.approver})
        update("incidents", ap["incident_id"], {"status": "blocked", "updated_at": now()})
        pipeline._event(ap["incident_id"], "approval", "Human Approval",
                        f"REJECTED by {payload.approver} - manual intervention required.", "warn")
        pipeline._say(payload.approver, "human",
                      f"⛔ Rejected: {ap['title']} - incident #{ap['incident_id']} needs manual action.")
        switch.emit("approval.decided", {"approval": aid, "decision": "reject"})
    else:
        raise HTTPException(400, "decision must be approve or reject")

    return one("SELECT * FROM approvals WHERE id=?", (aid,))


# ---------------------------------------------------------------- war room
@app.get("/api/messages")
def messages(limit: int = 100):
    return query("SELECT * FROM messages ORDER BY id DESC LIMIT ?", (limit,))[::-1]


@app.post("/api/messages", status_code=201)
def post_message(payload: MessageIn):
    switch.post_message(payload.author, payload.role, payload.content)
    return one("SELECT * FROM messages WHERE id = last_insert_rowid()")


# ---------------------------------------------------------------- analytics
@app.get("/api/analytics")
def analytics():
    incidents = query("SELECT * FROM incidents ORDER BY id")
    resolved = [i for i in incidents if i["resolution_minutes"]]
    days = query(
        "SELECT substr(created_at,1,10) day, COUNT(*) count, "
        "AVG(resolution_minutes) avg_mttr, "
        "SUM(CASE WHEN status='resolved' THEN 1 ELSE 0 END) resolved "
        "FROM incidents GROUP BY day ORDER BY day"
    )
    sev = {s: one("SELECT COUNT(*) c FROM incidents WHERE severity=?", (s,))["c"]
           for s in ("critical", "high", "medium", "low")}
    status_rows = query("SELECT status, COUNT(*) c FROM incidents GROUP BY status")
    agents_rows = query("SELECT name, role, color, tasks_done, status FROM agents ORDER BY tasks_done DESC")
    services = query(
        "SELECT service, COUNT(*) c, "
        "AVG(CASE WHEN resolution_minutes IS NOT NULL THEN resolution_minutes END) mttr "
        "FROM incidents GROUP BY service ORDER BY c DESC LIMIT 8"
    )
    mttrs = [i["resolution_minutes"] for i in resolved]
    return {
        "mttr": round(sum(mttrs) / len(mttrs), 1) if mttrs else 0,
        "mttr_trend": round((mttrs[-1] - mttrs[0]) / mttrs[0] * 100, 1) if len(mttrs) > 1 else 0,
        "by_day": [
            {
                "day": d["day"],
                "incidents": d["count"],
                "resolved": d["resolved"],
                "mttr": round(d["avg_mttr"] or 0, 1),
            }
            for d in days
        ],
        "by_severity": sev,
        "by_status": {r["status"]: r["c"] for r in status_rows},
        "agents": agents_rows,
        "services": [
            {"service": s["service"], "count": s["c"], "mttr": round(s["mttr"] or 0, 1)}
            for s in services
        ],
        "uptime": 99.94,
        "auto_resolved": sum(1 for i in incidents if i["status"] == "resolved"),
        "human_gates": one("SELECT COUNT(*) c FROM approvals")["c"],
    }


# ---------------------------------------------------------------- switch
@app.get("/api/switch")
def switch_status():
    st = switch.status()
    st["events"] = query("SELECT * FROM switch_log ORDER BY id DESC LIMIT 12")
    st["event_count"] = one("SELECT COUNT(*) c FROM switch_log")["c"]
    st["messages_routed"] = one("SELECT COUNT(*) c FROM messages WHERE role='agent'")["c"]
    return st


# ---------------------------------------------------------------- static SPA
if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        target = os.path.join(DIST, full_path)
        if full_path and os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(DIST, "index.html"))
