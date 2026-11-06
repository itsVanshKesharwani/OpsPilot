"""OpsPilot – SQLite persistence layer."""
import os
import sqlite3
import threading
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "opspilot.db")
_lock = threading.RLock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    service TEXT,
    environment TEXT DEFAULT 'Production',
    severity TEXT DEFAULT 'critical',
    status TEXT DEFAULT 'detected',
    description TEXT,
    root_cause TEXT,
    proposed_fix TEXT,
    resolved_at TEXT,
    resolution_minutes REAL,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id INTEGER,
    stage TEXT,
    agent TEXT,
    message TEXT,
    level TEXT DEFAULT 'info',
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    role TEXT,
    icon TEXT,
    color TEXT,
    status TEXT DEFAULT 'idle',
    current_task TEXT,
    model TEXT,
    last_active TEXT,
    tasks_done INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    agent_id INTEGER,
    incident_id INTEGER,
    status TEXT DEFAULT 'queued',
    priority TEXT DEFAULT 'P2',
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id INTEGER,
    action TEXT,
    title TEXT,
    description TEXT,
    risk TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    created_at TEXT,
    decided_at TEXT,
    decided_by TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT,
    role TEXT DEFAULT 'human',
    content TEXT,
    channel TEXT DEFAULT 'war-room',
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS switch_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT,
    payload TEXT,
    status TEXT DEFAULT 'delivered',
    created_at TEXT
);
"""


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db() -> None:
    with _lock:
        conn = get_conn()
        try:
            conn.executescript(SCHEMA)
            conn.commit()
        finally:
            conn.close()


def now() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def query(sql: str, args: tuple = ()) -> list:
    with _lock:
        conn = get_conn()
        try:
            return [dict(r) for r in conn.execute(sql, args).fetchall()]
        finally:
            conn.close()


def one(sql: str, args: tuple = ()):
    rows = query(sql, args)
    return rows[0] if rows else None


def execute(sql: str, args: tuple = ()) -> int:
    with _lock:
        conn = get_conn()
        try:
            cur = conn.execute(sql, args)
            conn.commit()
            return cur.lastrowid or cur.rowcount
        finally:
            conn.close()


def insert(table: str, data: dict) -> int:
    cols = ", ".join(data.keys())
    marks = ", ".join(["?"] * len(data))
    return execute(
        f"INSERT INTO {table} ({cols}) VALUES ({marks})", tuple(data.values())
    )


def update(table: str, row_id: int, data: dict) -> None:
    sets = ", ".join([f"{k} = ?" for k in data.keys()])
    execute(f"UPDATE {table} SET {sets} WHERE id = ?", (*data.values(), row_id))
