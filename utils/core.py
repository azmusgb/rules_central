"""Core utility helpers not yet categorized."""

from __future__ import annotations

import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List

from flask import current_app
from flask_login import current_user

LOGGER = logging.getLogger(__name__)


def highlight_matches(text: str, query: str) -> str:
    """Highlight matches case-insensitively."""
    if not query:
        return text
    try:
        words: List[str] = [w for w in query.split() if w]
        if len(words) > 1:
            for w in words:
                pattern = re.compile(re.escape(w), re.IGNORECASE)
                text = pattern.sub(lambda m: f"<strong>{m.group()}</strong>", text)
            return text
        pattern = re.compile(re.escape(query), re.IGNORECASE)
        return pattern.sub(lambda m: f"<strong>{m.group()}</strong>", text)
    except re.error as exc:  # pragma: no cover - regex errors
        LOGGER.error("Invalid regex in highlight_matches: %s", exc)
        return text


def get_snippet(content: str, query: str, snippet_length: int = 100) -> str:
    """Extract a short snippet of content around query without cutting words."""
    index = content.lower().find(query.lower())
    if index == -1:
        return ""
    if len(content) <= len(query) + snippet_length:
        return content
    half = snippet_length // 2
    start = max(0, index - half)
    start = content.rfind(" ", 0, start)
    start = 0 if start == -1 else start + 1
    end = min(len(content), index + len(query) + half)
    space_after = content.rfind(" ", index + len(query), end)
    if space_after != -1 and space_after > index + len(query):
        end = space_after
    snippet = content[start:end]
    return snippet.strip()


def get_current_user() -> str:
    """Return the username of the authenticated user or 'anonymous'."""
    try:
        return current_user.username if current_user.is_authenticated else "anonymous"
    except Exception:  # pragma: no cover - runtime guard
        return "anonymous"


def initialize_directories(app) -> None:
    """Ensure required application directories exist."""
    required_dirs = {
        "uploads": app.config.get("UPLOAD_FOLDER", "./uploads"),
        "diagrams": app.config.get("DIAGRAMS_FOLDER", "./diagrams"),
        "help": os.path.join(app.static_folder, "help"),
    }
    for path in required_dirs.values():
        try:
            os.makedirs(path, exist_ok=True)
            app.logger.info("Directory verified: %s", path)
        except OSError as e:  # pragma: no cover - unexpected
            app.logger.error("Failed to create directory %s: %s", path, e)
            raise


def get_help_topics() -> list[str]:
    """Return a sorted list of available help topic names."""
    help_dir = Path(current_app.root_path) / "static" / "help"
    if not help_dir.exists():
        return []
    return sorted(f.stem for f in help_dir.glob("*.md"))
