"""
Service for retrieving the active domain information.
"""
from __future__ import annotations

import json
import os

from config import Config


class DomainService:
    """Service for retrieving the active domain from ``advanced_stats.json``."""

    def __init__(self, stats_file: str | None = None) -> None:
        self.stats_file = stats_file or os.path.join(
            os.path.dirname(__file__), "..", "data", "advanced_stats.json"
        )

    def get_active_domain(self) -> str:
        """Return the name of the currently active domain, or ``"N/A"``."""
        Config.ensure_data_dir()
        if not os.path.exists(self.stats_file):
            return "N/A"
        try:
            with open(self.stats_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("active_domain", "N/A")
        except (json.JSONDecodeError, OSError):
            return "N/A"
