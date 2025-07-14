from dataclasses import dataclass, asdict
import dataclasses
import json
import os
import logging
from datetime import datetime, timezone

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
