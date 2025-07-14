"""Structured activity logging utilities."""

from dataclasses import dataclass, asdict
import dataclasses
import json
import os
import logging
from datetime import datetime, timezone, timedelta

from config import Config

LOGGER = logging.getLogger(__name__)


@dataclass
class ActivityLogEntry:
    action: str
    user: str
    details: str
    timestamp: str = dataclasses.field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def log_activity(action: str, rule_id: str | None = None, user: str | None = None, details: str | None = None) -> None:
    """Log an activity entry to Config.ACTIVITY_LOG."""
    Config.ensure_data_dir()
    entry = ActivityLogEntry(
        action=action,
        user=user or "anonymous",
        details=details or f"{action} operation",
    )
    try:
        data: dict = {}
        if os.path.exists(Config.ACTIVITY_LOG):
            with open(Config.ACTIVITY_LOG, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = {"rules": {}, "activity_log": []}
        data.setdefault("activity_log", []).append(asdict(entry))
        if rule_id:
            data.setdefault("rules", {})[rule_id] = {
                "status": "active",
                "last_modified": entry.timestamp,
                "modified_by": entry.user,
            }
        with open(Config.ACTIVITY_LOG, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as exc:  # pragma: no cover - log failures shouldn't crash
        LOGGER.error("Failed to log activity: %s", exc)


def get_rule_stats() -> dict:
    """Return rule counts and recent activity totals."""
    Config.ensure_data_dir()
    try:
        with open(Config.ACTIVITY_LOG, "r", encoding="utf-8") as f:
            data = json.load(f)
        now = datetime.utcnow()
        totals = {
            "total_rules": len(data.get("rules", {})),
            "last_7_days": 0,
            "last_30_days": 0,
            "last_90_days": 0,
        }
        for entry in data.get("activity_log", []):
            try:
                ts = datetime.fromisoformat(entry["timestamp"])
            except Exception:
                continue
            if ts >= now - timedelta(days=7):
                totals["last_7_days"] += 1
            if ts >= now - timedelta(days=30):
                totals["last_30_days"] += 1
            if ts >= now - timedelta(days=90):
                totals["last_90_days"] += 1
        return totals
    except Exception as exc:  # pragma: no cover - unexpected errors
        LOGGER.error("Failed to compute stats: %s", exc)
        return {"total_rules": 0, "last_7_days": 0, "last_30_days": 0, "last_90_days": 0}


def get_activity_trend(days: int = 30) -> list[dict]:
    """Return daily activity counts for the past ``days`` days."""
    Config.ensure_data_dir()
    try:
        with open(Config.ACTIVITY_LOG, "r", encoding="utf-8") as f:
            data = json.load(f)
        now = datetime.utcnow()
        start_date = now.date() - timedelta(days=days - 1)
        counts = { (start_date + timedelta(days=i)).isoformat(): 0 for i in range(days) }
        for entry in data.get("activity_log", []):
            try:
                ts = datetime.fromisoformat(entry["timestamp"]).date()
            except Exception:
                continue
            if ts.isoformat() in counts:
                counts[ts.isoformat()] += 1
        return [
            {"label": d, "count": counts[d]} for d in sorted(counts.keys())
        ]
    except Exception as exc:  # pragma: no cover - unexpected errors
        LOGGER.error("Trend calculation failed: %s", exc)
        return []
