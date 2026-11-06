"""Switch integration layer.

Switch is the agent <-> team communication fabric. In the hackathon build we do
two things:

1. If ``SWITCH_WEBHOOK_URL`` (or ``SWITCH_SERVER_URL``) is set we actually POST
   every agent/team event to Switch.
2. If Switch is not configured we fall back to "simulated" mode so the demo
   never breaks - every event is still recorded locally and shown on the
   dashboard's Switch panel.

Set ``SWITCH_MODE=connected`` + a URL to flip it to live mode.
"""
import json
import os
import urllib.request

from db import execute, insert, now

SWITCH_MODE = os.environ.get("SWITCH_MODE", "simulated")
SWITCH_URL = os.environ.get("SWITCH_WEBHOOK_URL") or os.environ.get("SWITCH_SERVER_URL", "")


def status() -> dict:
    live = SWITCH_MODE == "connected" and bool(SWITCH_URL)
    return {
        "mode": "connected" if live else "simulated",
        "server": SWITCH_URL or "local://switch-console",
        "connected": live,
        "rooms": ["#incident-war-room", "#eng-alerts", "#oncall"],
        "bridge": "switch-relay/0.9",
    }


def emit(kind: str, payload: dict) -> dict:
    """Route an agent/team event through Switch."""
    body = {"kind": kind, "ts": now(), "payload": payload}
    delivery = "delivered"

    if status()["connected"]:
        try:
            req = urllib.request.Request(
                SWITCH_URL,
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            urllib.request.urlopen(req, timeout=4)
        except Exception as exc:  # pragma: no cover - network dependent
            delivery = f"failed: {exc}"

    insert(
        "switch_log",
        {
            "kind": kind,
            "payload": json.dumps(payload)[:1000],
            "status": delivery,
            "created_at": now(),
        },
    )
    return body


def post_message(author: str, role: str, content: str, channel: str = "war-room") -> int:
    """Human or agent message pushed into the War Room through Switch."""
    emit("chat.message", {"author": author, "role": role, "content": content, "channel": channel})
    return insert(
        "messages",
        {
            "author": author,
            "role": role,
            "content": content,
            "channel": channel,
            "created_at": now(),
        },
    )
