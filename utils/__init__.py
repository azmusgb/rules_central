"""Utility package for Rules Central."""

from .file_utils import allowed_file, ensure_directory_exists, get_file_metadata
from .json_utils import load_and_sanitize_json, remove_all_quotes, add_missing_guids_if_needed
from .diagram_utils import diagram_type_from_filename, generate_files
from .rule_utils import (
    get_dynamic_groups,
    flatten_rules,
    propagate_disabled_rules,
    build_edge_map,
    validate_hierarchy_data,
    build_hierarchy,
)
from .logging_utils import log_activity, ActivityLogEntry
from .core import (
    highlight_matches,
    get_snippet,
    get_current_user,
    initialize_directories,
    get_help_topics,
)

__all__ = [
    "allowed_file",
    "ensure_directory_exists",
    "load_and_sanitize_json",
    "generate_files",
    "log_activity",
    "diagram_type_from_filename",
    "get_snippet",
    "get_current_user",
    "initialize_directories",
    "get_help_topics",
    "get_dynamic_groups",
    "flatten_rules",
    "propagate_disabled_rules",
    "build_edge_map",
    "validate_hierarchy_data",
    "build_hierarchy",
    "ActivityLogEntry",
    "remove_all_quotes",
    "add_missing_guids_if_needed",
    "get_file_metadata",
    "highlight_matches",
]
