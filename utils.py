"""Unified utility module for Rules Central."""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple, Union

from flask import current_app
from flask_login import current_user
from werkzeug.utils import secure_filename

from config import Config

# Initialize logger
LOGGER = logging.getLogger(__name__)

# Constants
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
ALLOWED_FILE_EXTS = {"json", "mmd"}
DEFAULT_SNIPPET_LENGTH = 100

# Type aliases
JsonType = Union[Dict[str, Any], List[Any], str, int, float, bool, None]
RuleType = Dict[str, Any]
RuleListType = List[RuleType]

# ---------------------------------------------------------------------------
# Core Utility Classes
# ---------------------------------------------------------------------------


@dataclass
class ActivityLogEntry:
    """Represents an activity log entry."""

    action: str
    user: str
    details: str
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


@dataclass
class DiagramInfo:
    """Represents diagram metadata."""

    filename: str
    created: str
    size: int = 0
    file_type: str = "mmd"


# ---------------------------------------------------------------------------
# Validation Utilities
# ---------------------------------------------------------------------------


def validate_email(email: str) -> bool:
    """Validate email format using regex pattern.

    Args:
        email: Email address to validate

    Returns:
        bool: True if email is valid
    """
    return isinstance(email, str) and bool(EMAIL_PATTERN.fullmatch(email))


def validate_password(password: str, min_length: int = 8) -> bool:
    """Validate password meets basic complexity requirements.

    Args:
        password: Password to validate
        min_length: Minimum required length

    Returns:
        bool: True if password meets requirements
    """
    return (
        isinstance(password, str)
        and len(password) >= min_length
        and any(c.isalpha() for c in password)
        and any(c.isdigit() for c in password)
    )


# ---------------------------------------------------------------------------
# File System Utilities
# ---------------------------------------------------------------------------


def allowed_file(filename: str) -> bool:
    """Check if filename has an allowed extension.

    Args:
        filename: Name of file to check

    Returns:
        bool: True if extension is allowed
    """
    return (
        isinstance(filename, str)
        and "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_FILE_EXTS
    )


def ensure_directory_exists(directory: Union[str, Path]) -> None:
    """Ensure directory exists, creating if necessary.

    Args:
        directory: Path to directory

    Raises:
        OSError: If directory creation fails
    """
    path = Path(directory)
    try:
        path.mkdir(parents=True, exist_ok=True)
        LOGGER.debug("Directory verified: %s", path)
    except OSError as exc:
        LOGGER.error("Failed to create directory %s: %s", path, exc)
        raise


@lru_cache(maxsize=128)
def get_file_metadata(filepath: Union[str, Path]) -> Dict[str, float]:
    """Get basic file metadata with caching.

    Args:
        filepath: Path to file

    Returns:
        Dict with size and last_modified timestamps
    """
    stat = Path(filepath).stat()
    return {"size": stat.st_size, "last_modified": stat.st_mtime}


# ---------------------------------------------------------------------------
# Misc Utilities
# ---------------------------------------------------------------------------


def diagram_type_from_filename(name: str) -> str:
    """Infer diagram type from a filename."""
    name = name.lower()
    if "sequence" in name:
        return "sequence"
    if "flow" in name or name.endswith(".mmd"):
        return "flowchart"
    return "unknown"


def highlight_matches(text: str, term: str) -> str:
    """Highlight case-insensitive term matches within text."""
    if not term:
        return text
    pattern = re.compile(re.escape(term), re.IGNORECASE)
    return pattern.sub(lambda m: f"<strong>{m.group(0)}</strong>", text)


def get_snippet(
    text: str, term: str, snippet_length: int = DEFAULT_SNIPPET_LENGTH
) -> str:
    """Return a substring around the first occurrence of term."""
    if not term:
        return text[:snippet_length]
    idx = text.lower().find(term.lower())
    if idx == -1:
        return text[:snippet_length]
    start = max(0, idx - snippet_length // 2)
    end = start + snippet_length
    return text[start:end]


def get_current_user() -> str:
    """Return the username if logged in else 'anonymous'."""
    if getattr(current_user, "is_authenticated", False):
        return getattr(current_user, "username", "anonymous")
    return "anonymous"


def initialize_directories(app: Any) -> None:
    """Create required application directories."""
    ensure_directory_exists(app.config.get("UPLOAD_FOLDER"))
    ensure_directory_exists(app.config.get("DIAGRAMS_FOLDER"))
    if app.static_folder:
        ensure_directory_exists(Path(app.static_folder) / "help")


def get_help_topics() -> List[str]:
    """Return sorted help topic slugs from static/help."""
    help_dir = Path(current_app.root_path) / "static" / "help"
    if not help_dir.exists():
        return []
    return sorted(p.stem for p in help_dir.glob("*.md"))


def generate_files(rules: RuleListType, out_dir: str) -> List[DiagramInfo]:
    """Write simple diagram and JSON files for rules."""
    out_path = Path(out_dir)
    ensure_directory_exists(out_path)
    infos: List[DiagramInfo] = []
    for rule in rules:
        name = rule.get("Container", "diagram")
        mmd = out_path / f"{name}.mmd"
        json_path = out_path / f"{name}.json"
        mmd.write_text("graph TD")
        json_path.write_text(json.dumps(rules))
        infos.append(
            DiagramInfo(
                filename=mmd.name,
                created=datetime.now(timezone.utc).isoformat(),
                size=mmd.stat().st_size,
            )
        )
    return infos


# ---------------------------------------------------------------------------
# JSON Processing Utilities
# ---------------------------------------------------------------------------


def remove_all_quotes(obj: Any) -> Any:
    """Recursively remove double quotes from strings in JSON structure.

    Args:
        obj: JSON structure to process

    Returns:
        Processed JSON structure
    """
    if isinstance(obj, str):
        return obj.replace('"', "")
    if isinstance(obj, dict):
        return {k: remove_all_quotes(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [remove_all_quotes(item) for item in obj]
    return obj


def load_and_sanitize_json(filepath: Union[str, Path]) -> Optional[RuleListType]:
    """Load and sanitize JSON rule file.

    Args:
        filepath: Path to JSON file

    Returns:
        List of sanitized rules or None if error occurs
    """
    try:
        with open(filepath, "r", encoding="utf-8") as file:
            content = file.read()
            if content.lstrip().startswith("<"):
                raise ValueError("Uploaded file appears to be HTML, not JSON.")

            data = json.loads(content)
            return _process_json_data(data)

    except (json.JSONDecodeError, FileNotFoundError, ValueError) as exc:
        LOGGER.error("Error loading JSON file %s: %s", filepath, exc)
        return None


def _process_json_data(data: JsonType) -> RuleListType:
    """Internal helper to process and sanitize JSON data."""
    if isinstance(data, dict):
        rules = data.get("rules", [data])
    elif isinstance(data, list):
        rules = data
    else:
        raise ValueError("JSON data must be an object or array")

    if not isinstance(rules, list):
        raise ValueError("Rules must be an array")

    allowed_fields = {
        "RuleGUID",
        "RuleName",
        "Children",
        "Actions",
        "Attributes",
        "ParentGUID",
        "ParentActionIndex",
        "Container",
        "FunctionName",
        "RootName",
    }

    sanitized = [_sanitize_rule(rule, allowed_fields) for rule in rules]
    add_missing_guids_if_needed(sanitized)
    return sanitized


def _sanitize_rule(rule: RuleType, allowed_fields: Set[str]) -> RuleType:
    """Sanitize individual rule."""
    if not isinstance(rule, dict):
        return {}

    cleaned = {k: v for k, v in rule.items() if k in allowed_fields}

    if "Attributes" in cleaned:
        cleaned["Attributes"] = remove_all_quotes(cleaned["Attributes"])

    if "Children" in cleaned:
        cleaned["Children"] = [
            _sanitize_rule(c, allowed_fields) for c in cleaned["Children"]
        ]

    if "Actions" in cleaned:
        cleaned["Actions"] = [
            _sanitize_action(a, allowed_fields) for a in cleaned["Actions"]
        ]

    return cleaned


def _sanitize_action(action: RuleType, allowed_fields: Set[str]) -> RuleType:
    """Sanitize action within rule."""
    sanitized = {"ActionName": action.get("ActionName")}
    if "ChildRules" in action:
        sanitized["ChildRules"] = [
            _sanitize_rule(cr, allowed_fields) for cr in action.get("ChildRules", [])
        ]
    return sanitized


# ---------------------------------------------------------------------------
# Diagram Helper
# ---------------------------------------------------------------------------


def generate_mermaid_code(
    nodes: Dict[str, Dict[str, str]], edges: List[Dict[str, str]]
) -> str:
    """Convert node and edge data into Mermaid chart syntax."""
    lines = ["graph TD"]

    for key, info in (nodes or {}).items():
        label = info.get("label", key)
        lines.append(f"{key}[{label}]")

    for edge in edges or []:
        edge_str = edge.get("edge_str")
        if edge_str:
            lines.append(edge_str)

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Activity Logging & Stats
# ---------------------------------------------------------------------------


def add_missing_guids_if_needed(rules: RuleListType) -> None:
    """Add a unique RuleGUID to rules that lack one."""
    for rule in rules:
        if not isinstance(rule, dict):
            continue
        rule.setdefault("RuleGUID", str(uuid.uuid4()))
        for child in rule.get("Children", []):
            add_missing_guids_if_needed([child])


def log_activity(
    action: str, rule_id: Optional[str] = None, user: str = "", details: str = ""
) -> None:
    """Append an entry to the activity log JSON file."""
    path = Path(Config.ACTIVITY_LOG)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = {}
    if path.exists():
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError:
            data = {}
    log = data.setdefault("activity_log", [])
    rules = data.setdefault("rules", {})
    log.append(
        {
            "action": action,
            "rule_id": rule_id,
            "user": user,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )
    if rule_id:
        rules.setdefault(rule_id, {}).update({"modified_by": user})
    path.write_text(json.dumps(data))


def get_rule_stats() -> Dict[str, int]:
    """Return simple counts of rules and activity from the log."""
    path = Path(Config.ACTIVITY_LOG)
    if not path.exists():
        return {
            "total_rules": 0,
            "last_7_days": 0,
            "last_30_days": 0,
            "last_90_days": 0,
        }
    data = json.loads(path.read_text())
    activity = data.get("activity_log", [])
    now = datetime.now(timezone.utc)

    def within(days: int) -> int:
        cutoff = now - timedelta(days=days)
        return sum(
            1 for a in activity if datetime.fromisoformat(a["timestamp"]) >= cutoff
        )

    return {
        "total_rules": len(data.get("rules", {})),
        "last_7_days": within(7),
        "last_30_days": within(30),
        "last_90_days": within(90),
    }


def get_activity_trend(days: int = 30) -> List[Dict[str, int]]:
    """Return daily counts for the given day range."""
    path = Path(Config.ACTIVITY_LOG)
    activity = []
    if path.exists():
        try:
            activity = json.loads(path.read_text()).get("activity_log", [])
        except json.JSONDecodeError:
            activity = []
    now = datetime.now(timezone.utc)
    trend = []
    for i in range(days):
        day = (now - timedelta(days=days - i - 1)).date()
        count = sum(
            1 for a in activity if datetime.fromisoformat(a["timestamp"]).date() == day
        )
        trend.append({"date": day.isoformat(), "count": count})
    return trend


# ---------------------------------------------------------------------------
# Hierarchy & Group Utilities
# ---------------------------------------------------------------------------


def get_dynamic_groups(base_dir: Union[str, Path]) -> List[Dict[str, Any]]:
    """Scan directories for diagrams and hierarchies."""
    groups = []
    for d in Path(base_dir).iterdir():
        if not d.is_dir():
            continue
        category = "_".join(d.name.split("_")[:-1])
        entry = {
            "root": d.name,
            "diagram": "diagram.mmd" if (d / "diagram.mmd").exists() else None,
            "hierarchy": "hierarchy.json" if (d / "hierarchy.json").exists() else None,
        }
        groups.append({"category": category, "entries": [entry]})
    return groups


def flatten_rules(rules: RuleListType) -> RuleListType:
    """Flatten nested rule structures into a list."""
    flat: RuleListType = []

    def _walk(rule: RuleType, parent: Optional[str], action_idx: Optional[int]):
        r = {
            "RuleGUID": rule.get("RuleGUID"),
            "ParentGUID": parent,
            "ParentActionIndex": action_idx,
        }
        flat.append(r)
        for child in rule.get("Children", []):
            _walk(child, rule.get("RuleGUID"), None)
        for idx, act in enumerate(rule.get("Actions", [])):
            for cr in act.get("ChildRules", []):
                _walk(cr, rule.get("RuleGUID"), idx)

    for r in rules:
        _walk(r, None, None)
    return flat


def build_edge_map(edges: List[Dict[str, str]]) -> Dict[str, List[str]]:
    """Map parent nodes to child nodes from edge strings."""
    result: Dict[str, List[str]] = defaultdict(list)
    for e in edges:
        edge = e.get("edge_str", "")
        if "-->" not in edge:
            continue
        left, right = edge.split("-->", 1)
        src = left.strip().split()[0]
        target = right.strip()
        if "|" in target:
            target = target.split("|")[-1]
        target = target.split()[-1]
        result[src].append(target)
    return dict(result)


def propagate_disabled_rules(rules: RuleListType) -> None:
    """Cascade the _Disabled attribute to children."""

    def _prop(r: RuleType, disabled: Optional[str]):
        attrs = r.setdefault("Attributes", {})
        if disabled is not None:
            attrs.setdefault("_Disabled", disabled)
            disabled = attrs.get("_Disabled")
        else:
            disabled = attrs.get("_Disabled")
        for c in r.get("Children", []):
            _prop(c, disabled)

    for r in rules:
        _prop(r, None)


def validate_hierarchy_data(
    data: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], Dict[str, Dict[str, Any]]]:
    """Normalize hierarchy rows and build a guid map."""
    normalized = []
    guid_map = {}
    for row in data:
        norm = {k.lstrip("_"): v for k, v in row.items()}
        normalized.append(norm)
        guid_map[norm.get("RuleGUID")] = norm
    return normalized, guid_map


def build_hierarchy(
    normalized: List[Dict[str, Any]], guid_map: Dict[str, Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Construct a hierarchy tree from normalized rows."""
    for n in normalized:
        n.setdefault("children", [])
    for n in normalized:
        parent = n.get("ParentGUID")
        if parent and parent in guid_map:
            guid_map[parent].setdefault("children", []).append(n)
    return [n for n in normalized if not n.get("ParentGUID")]


# [Rest of your functions with similar improvements...]

# ---------------------------------------------------------------------------
# Module Exports
# ---------------------------------------------------------------------------

__all__ = [
    # File utilities
    "allowed_file",
    "ensure_directory_exists",
    "get_file_metadata",
    # JSON utilities
    "load_and_sanitize_json",
    "remove_all_quotes",
    "add_missing_guids_if_needed",
    # Rule processing
    "flatten_rules",
    "propagate_disabled_rules",
    "validate_hierarchy_data",
    "build_hierarchy",
    "build_edge_map",
    # Diagram utilities
    "generate_files",
    "diagram_type_from_filename",
    "get_featured_diagrams",
    "get_diagram_categories",
    "get_dynamic_groups",
    "generate_mermaid_code",
    # Logging
    "log_activity",
    "ActivityLogEntry",
    "get_rule_stats",
    "get_activity_trend",
    # Auth & validation
    "validate_email",
    "validate_password",
    "generate_csrf_token",
    "verify_csrf_token",
    "send_email",
    # UI helpers
    "highlight_matches",
    "get_snippet",
    "get_current_user",
    # System
    "initialize_directories",
    "get_help_topics",
    # Data classes
    "DiagramInfo",
]
