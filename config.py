"""Configuration loading utilities for Rules Central."""

import json
import logging
import os
from pathlib import Path
from datetime import datetime

# Allow overriding the configuration file path via the ``CONFIG_PATH``
# environment variable for flexible deployments.
CONFIG_PATH = os.environ.get(
    "CONFIG_PATH",
    os.path.join(os.path.dirname(__file__), "config", "config.json"),
)

LOGGER = logging.getLogger(__name__)

__all__ = ["CONFIG_PATH", "load_configurations", "Config"]


def load_configurations() -> dict:
    """Load configuration data from :data:`CONFIG_PATH`."""

    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as config_file:
            return json.load(config_file)
    except (FileNotFoundError, json.JSONDecodeError) as err:
        LOGGER.error("Error loading configuration file: %s", err)
        return {"translations": {}, "styles": {}}


class Config:
    """Application configuration constants and helpers."""

    DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
    ACTIVITY_LOG = Path(DATA_DIR) / "activity_log.json"

    @classmethod
    def ensure_data_dir(cls):
        """Ensure the data directory and activity log exist."""
        os.makedirs(cls.DATA_DIR, exist_ok=True)
        if not cls.ACTIVITY_LOG.exists():
            initial_data = {
                "rules": {},
                "activity_log": [
                    {
                        "timestamp": datetime.utcnow().isoformat(),
                        "action": "system",
                        "user": "init",
                        "details": "Activity log initialized"
                    }
                ]
            }
            with open(cls.ACTIVITY_LOG, "w", encoding="utf-8") as f:
                json.dump(initial_data, f, indent=2)
            cls.ACTIVITY_LOG.chmod(0o644)
        return cls.ACTIVITY_LOG
