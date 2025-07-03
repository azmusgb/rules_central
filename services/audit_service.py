"""
Service for auditing and retrieving recent activity counts.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timedelta

from config import Config


class AuditService:
    """Provide access to basic audit statistics."""

    def __init__(self, log_path: str | None = None) -> None:
        self.log_path = log_path or Config.ACTIVITY_LOG

    def get_recent_changes_count(self, days: int = 7) -> int:
        """Return total number of changes in the last ``days`` days."""
        Config.ensure_data_dir()
        if not os.path.exists(self.log_path):
            return 0
        cutoff = datetime.utcnow() - timedelta(days=days)
        try:
            with open(self.log_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError):
            return 0
        count = 0
        for entry in data.get("activity_log", []):
            try:
                ts = datetime.fromisoformat(entry.get("timestamp", ""))
            except ValueError:
                continue
            if ts >= cutoff:
                count += 1
        return count
