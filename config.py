"""Configuration loading utilities for Rules Central.

This module provides:
- Configuration file loading from JSON
- Application constants and paths
- Data directory initialization

The configuration file path defaults to ``config/config.json`` but can
be overridden with the ``CONFIG_PATH`` environment variable.
"""

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

# Allow overriding the configuration file path via environment variable
CONFIG_PATH = Path(
    os.environ.get("CONFIG_PATH", Path(__file__).parent / "config" / "config.json")
)

logger = logging.getLogger(__name__)

__all__ = ["CONFIG_PATH", "load_configurations", "Config"]

DEFAULT_CONFIG = {"translations": {}, "styles": {}}


class ConfigError(Exception):
    """Base exception for configuration-related errors."""

    pass


def load_configurations() -> Dict[str, Any]:
    """Load and validate configuration data from CONFIG_PATH.

    Returns:
        Dictionary containing configuration data

    Raises:
        ConfigError: If configuration file is invalid or inaccessible
    """
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as config_file:
            config = json.load(config_file)

            # Validate basic structure
            if not isinstance(config, dict):
                raise ConfigError("Configuration must be a JSON object")

            return config

    except FileNotFoundError as e:
        logger.warning("Configuration file not found, using defaults: %s", CONFIG_PATH)
        return DEFAULT_CONFIG.copy()

    except json.JSONDecodeError as e:
        logger.error("Invalid JSON in configuration file: %s", e)
        raise ConfigError(f"Invalid JSON configuration: {e}")

    except Exception as e:
        logger.error("Unexpected error loading configuration: %s", e)
        raise ConfigError(f"Configuration loading failed: {e}")


class Config:
    """Application configuration constants and path management."""

    # Directory structure
    DATA_DIR = Path(__file__).parent / "data"
    LOGS_DIR = DATA_DIR / "logs"

    # File paths
    ACTIVITY_LOG = DATA_DIR / "activity_log.json"
    FEEDBACK_FILE = DATA_DIR / "feedback.json"

    # Permissions
    FILE_PERMISSIONS = 0o644  # -rw-r--r--
    DIR_PERMISSIONS = 0o755  # drwxr-xr-x

    @classmethod
    def ensure_data_dir(cls) -> Path:
        """Initialize application data directory structure.

        Creates required directories and files with proper permissions.

        Returns:
            Path to the activity log file

        Raises:
            ConfigError: If directory initialization fails
        """
        try:
            # Create directories if they don't exist
            cls.DATA_DIR.mkdir(mode=cls.DIR_PERMISSIONS, exist_ok=True)
            cls.LOGS_DIR.mkdir(mode=cls.DIR_PERMISSIONS, exist_ok=True)

            # Initialize activity log if needed
            if not cls.ACTIVITY_LOG.exists():
                initial_data = {
                    "rules": {},
                    "activity_log": [
                        {
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "action": "system",
                            "user": "init",
                            "details": "Activity log initialized",
                        }
                    ],
                }
                cls._write_json_file(cls.ACTIVITY_LOG, initial_data)

            # Initialize feedback file if needed
            if not cls.FEEDBACK_FILE.exists():
                cls._write_json_file(cls.FEEDBACK_FILE, [])

            return cls.ACTIVITY_LOG

        except Exception as e:
            logger.critical("Failed to initialize data directory: %s", e)
            raise ConfigError(f"Data directory initialization failed: {e}")

    @classmethod
    def _write_json_file(cls, path: Path, data: Any) -> None:
        """Helper method to safely write JSON files with permissions.

        Args:
            path: File path to write to
            data: Data to serialize as JSON

        Raises:
            ConfigError: If file writing fails
        """
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            path.chmod(cls.FILE_PERMISSIONS)
        except Exception as e:
            logger.error("Failed to write JSON file %s: %s", path, e)
            raise ConfigError(f"Failed to write {path}: {e}")
