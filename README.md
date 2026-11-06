# 🚨 OpsPilot — AI Incident Command Center

> **Jab production down ho, jawab kitni der mein milega?**
> OpsPilot ek AI-powered incident management system hai jo problem ko
> **detect → triage → debug → approve → resolve** tak le jaata hai — aur har
> destructive action se pehle **insaan ki approval** leta hai.

Built for **WeMakeDevs × DevTools Academy × Switch+** hackathon · Submission deadline: 7 Nov 2026, 11:59 PM IST.

---

## ⚡ 30-second demo (judges ko yahi dikhao)

1. Dashboard khulta hai → **Live Incidents, AI Agents, Switch Bridge** sab live.
2. Top-right **“⚡ Simulate Production Alert”** click karo.
3. Screen par apne aap chalta hai:
   - **Step 1 — Detection**: Sentinel alert detect karta hai (HTTP 500 flood).
   - **Step 2 — AI Triage**: Atlas severity + blast radius identify karta hai.
   - **Step 3 — Debugging**: Sherlock repro banata hai, root cause nikaalta hai.
   - **Step 4 — Approval**: fix staged, **insaan ke approve ka wait**.
   - **Step 5 — Resolution**: approve karte hi Pilot rollback karta hai → **Incident Resolved**.
4. **Approval Center** → *Approve & Execute* click karo → rollback chalu → resolved.
5. **War Room** → AI agents aur team ki live chat (Switch ke through routed).
6. **Analytics** → MTTR, severity split, agent productivity charts.

> Note: yeh illustrative workflow hai — real project mein har stage actual
> integration (Switch, logs, deploy) se connect hoti hai. Switch live mode ke
> liye neeche env vars diye hain.

---

## 🏗️ Architecture

```
┌───────────────────────────  OpsPilot Dashboard (React + Tailwind)  ───────────────────────────┐
│  Overview │ Live Incidents │ AI Agents │ War Room │ Task Manager │ Approval Center │ Analytics │
└──────────────────────────────────────┬─────────────────────────────────────────────────────────┘
                                       │ REST + polling (/api/*)
┌──────────────────────────────────────▼─────────────────────────────────────────────────────────┐
│                        FastAPI backend  (backend/main.py + pipeline.py)                       │
│   incident lifecycle state machine  ·  approval gate  ·  analytics  ·  SQLite persistence     │
└──────────────┬───────────────────────────────────────────────────────────────┬────────────────┘
               │  agent events / chat                                          │  human decision
       ┌───────▼────────┐                                            ┌────────▼────────┐
       │  Switch bridge │  ← agent ↔ team communication layer       │  Approval Center│
       │ (simulated /   │     rooms: #incident-war-room etc.        │  Approve/Reject │
       │   live webhook)│                                            └─────────────────┘
       └───────┬────────┘
               ├── 🤖 Sentinel  (Monitoring Agent)  — alerts detect
               ├── 🤖 Atlas     (Triage Agent)       — severity + scope
               ├── 🤖 Sherlock  (Debug/Repro Agent)  — logs + root cause
               ├── 🤖 Forge     (Fix Agent)          — proposed fix / rollback plan
               ├── 🤖 Pilot     (Release Agent)      — executes approved action
               └── 🤖 Chronicle (Report Agent)       — postmortem + MTTR report
               └── 🧑‍💼 Human     (team lead)           — approval gate
```

**Workflow:** alert → backend → Switch → AI agents → dashboard par proposed
solution → **human approval** → simulated rollback → incident resolved.

---

## 🛠️ Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS 4 + Recharts + React Router |
| Backend | Python 3.13 + FastAPI + Uvicorn |
| Database | SQLite (WAL) — `backend/opspilot.db` |
| AI agents | OpenCode + Codex (agent reasoning simulated in pipeline) |
| Integration | **Switch** (simulated by default, live via env vars) |
| Charts | Recharts |

---

## 🚀 Quick start (2 commands)

**Option A — production build (sabse easy, ek hi server):**

```powershell
# 1) frontend build (ek hi baar)
cd frontend ; npm install ; npm run build ; cd ..

# 2) backend start (built UI bhi yahi serve karega)
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Browser kholo → **http://127.0.0.1:8000** 🎉

**Option B — development mode (hot reload):**

```powershell
.\start.ps1     # ek terminal mein backend + vite dev dono
```

---

## 🔌 Switch integration (live mode)

Default mode **simulated** hai taaki demo kabhi break na ho — phir bhi har
event Switch event log mein record hota hai aur dashboard par dikhta hai.

Live Switch ke liye backend start karte waqt:

```powershell
$env:SWITCH_MODE = "connected"
$env:SWITCH_WEBHOOK_URL = "https://your-switch-server/webhook"   # ya SWITCH_SERVER_URL
python -m uvicorn main:app --port 8000
```

`switch_client.py` har `incident.opened / approval.requested /
approval.decided / action.executed / chat.message` event ko Switch par POST
karta hai, aur fallback mein local record karta hai.

---

## 📡 API surface

| Method | Endpoint | Kaam |
|---|---|---|
| GET | `/api/stats` | Dashboard KPIs |
| GET | `/api/incidents?status=&q=` | Incident list + timeline |
| GET | `/api/incidents/{id}` | Single incident + events + approval |
| POST | `/api/incidents` | ⚡ Simulate production alert |
| GET | `/api/agents` | AI agents + live status |
| GET / POST | `/api/tasks`, `/api/tasks/{id}` | Task manager |
| GET | `/api/approvals?status=` | Approval center |
| POST | `/api/approvals/{id}/decision` | `{"decision":"approve"}` / `"reject"` |
| GET / POST | `/api/messages` | War room chat |
| GET | `/api/analytics` | MTTR, trends, agent performance |
| GET | `/api/switch` | Switch bridge status + event log |

---

## 📁 Project structure

```
ops-project/
├── backend/
│   ├── main.py            # FastAPI routes + SPA serving
│   ├── pipeline.py        # incident state machine (5 stages) ← dil
│   ├── switch_client.py   # Switch integration layer
│   ├── db.py              # SQLite schema + helpers
│   ├── seed.py            # agents, historical incidents, war room
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/         # Overview, Incidents, IncidentDetail, Agents,
│       │                  # WarRoom, Tasks, Approvals, Analytics
│       ├── components/    # Sidebar, Topbar, Timeline, ui
│       ├── api.js  hooks.js  constants.js  App.jsx
├── start.ps1              # dev mode: backend + frontend together
└── README.md
```

---

## 👥 Team division (4 members)

| Member | Responsibility | Yahan kahan dikhega |
|---|---|---|
| **Member 1** | Frontend – Dashboard UI | `frontend/src/**` (7 pages, dark theme, charts) |
| **Member 2** | Backend – APIs + DB | `backend/main.py`, `db.py` (13 endpoints, SQLite) |
| **Member 3** | AI Agents – Codex/OpenCode | `backend/pipeline.py` (triage/debug/fix agents) |
| **Member 4** | Switch integration + testing + demo | `backend/switch_client.py`, demo script, QA |

---

## ✅ Feature status

- [x] Live incident monitoring + 5-stage workflow timeline
- [x] 6 AI agents with live working/idle status
- [x] Switch-powered War Room (chat + event log)
- [x] Task manager (queued → running → done)
- [x] **Human approval gate** (approve / reject, double-decision blocked)
- [x] Automated simulated rollback after approval
- [x] Incident history + analytics (MTTR, severity, agent productivity)
- [x] One-click production alert simulation
- [ ] Real log scraping + real deployment rollback (post-hackathon)

---

## 🧪 Tested flow (already verified)

```
Simulate alert → #9 detected → triage (3.5s) → debug + root cause (6.5s)
→ approval pending → POST decision=approve → rollback executes (5s)
→ status=resolved, MTTR recorded, 14 Switch events, 16 war-room messages
→ POST decision=reject on #10 → status=blocked → double decide → HTTP 400
```
