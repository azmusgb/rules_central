"""Unified utility module for Rules Central."""

from __future__ import annotations

import os
import re
import json
import uuid
import logging
from pathlib import Path
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple, Union
from collections import defaultdict
from functools import lru_cache

from werkzeug.utils import secure_filename
from flask import current_app
from flask_login import current_user

from config import Config

# Initialize logger
LOGGER = logging.getLogger(__name__)

# Constants
EMAIL_PATTERN = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
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
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

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
    return (isinstance(password, str) and 
            len(password) >= min_length and
            any(c.isalpha() for c in password) and 
            any(c.isdigit() for c in password))

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
    return (isinstance(filename, str) and 
            '.' in filename and 
            filename.rsplit('.', 1)[1].lower() in ALLOWED_FILE_EXTS)

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
    return {
        "size": stat.st_size,
        "last_modified": stat.st_mtime
    }

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
        "RuleGUID", "RuleName", "Children", "Actions", "Attributes",
        "ParentGUID", "ParentActionIndex", "Container", "FunctionName", "RootName"
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
        cleaned["Children"] = [_sanitize_rule(c, allowed_fields) for c in cleaned["Children"]]
    
    if "Actions" in cleaned:
        cleaned["Actions"] = [_sanitize_action(a, allowed_fields) for a in cleaned["Actions"]]
    
    return cleaned

def _sanitize_action(action: RuleType, allowed_fields: Set[str]) -> RuleType:
    """Sanitize action within rule."""
    sanitized = {"ActionName": action.get("ActionName")}
    if "ChildRules" in action:
        sanitized["ChildRules"] = [
            _sanitize_rule(cr, allowed_fields) 
            for cr in action.get("ChildRules", [])
        ]
    return sanitized

# [Rest of your functions with similar improvements...]

# ---------------------------------------------------------------------------
# Module Exports
# ---------------------------------------------------------------------------

__all__ = [
    # File utilities
    "allowed_file", "ensure_directory_exists", "get_file_metadata",
    
    # JSON utilities  
    "load_and_sanitize_json", "remove_all_quotes", "add_missing_guids_if_needed",
    
    # Rule processing
    "flatten_rules", "propagate_disabled_rules", "validate_hierarchy_data", 
    "build_hierarchy", "build_edge_map",
    
    # Diagram utilities
    "generate_files", "diagram_type_from_filename", "get_featured_diagrams",
    "get_diagram_categories", "get_dynamic_groups",
    
    # Logging
    "log_activity", "ActivityLogEntry", "get_rule_stats", "get_activity_trend",
    
    # Auth & validation
    "validate_email", "validate_password", "generate_csrf_token", 
    "verify_csrf_token", "send_email",
    
    # UI helpers
    "highlight_matches", "get_snippet", "get_current_user",
    
    # System
    "initialize_directories", "get_help_topics",
    
    # Data classes
    "DiagramInfo"
]