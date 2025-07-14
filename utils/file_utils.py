from pathlib import Path
import os
from typing import Dict
import logging

LOGGER = logging.getLogger(__name__)


def allowed_file(filename: str) -> bool:
    """Return True if filename has an approved extension."""
    allowed_exts = {"json", "mmd"}
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_exts


def ensure_directory_exists(directory: str | Path) -> None:
    """Ensure directory exists, creating it if necessary."""
    path = Path(directory)
    if not path.exists():
        try:
            path.mkdir(parents=True, exist_ok=True)
            LOGGER.info("Created directory: %s", directory)
        except OSError as exc:
            LOGGER.error("Failed to create directory %s: %s", directory, exc)
            raise


def get_file_metadata(filepath: str | Path) -> Dict[str, float]:
    """Return basic file metadata for filepath."""
    stat = Path(filepath).stat()
    return {"size": stat.st_size, "last_modified": stat.st_mtime}
