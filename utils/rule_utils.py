from __future__ import annotations
import os
import uuid
import logging
from pathlib import Path
from typing import Any, Dict, Iterable, List

LOGGER = logging.getLogger(__name__)


def get_dynamic_groups(diagrams_folder: str | Path) -> List[Dict[str, Any]]:
    """Return groups of diagrams by common prefix."""
    if not Path(diagrams_folder).exists():
        return []
    grouped_catalog: Dict[str, Dict[str, Any]] = {}
    for folder in sorted(os.listdir(diagrams_folder)):
        folder_path = Path(diagrams_folder) / folder
        if not folder_path.is_dir():
            continue
        parts = folder.split("_")
        prefix = "_".join(parts[:2]) if len(parts) > 1 else folder
        grouped_catalog.setdefault(prefix, {"category": prefix, "entries": []})
        for filename in os.listdir(folder_path):
            if filename.endswith(".mmd") or filename.endswith(".json"):
                existing_entry = next(
                    (e for e in grouped_catalog[prefix]["entries"] if e["root"] == folder),
                    None,
                )
                if not existing_entry:
                    grouped_catalog[prefix]["entries"].append(
                        {
                            "root": folder,
                            "diagram": filename if filename.endswith(".mmd") else None,
                            "hierarchy": filename if filename.endswith(".json") else None,
                        }
                    )
                else:
                    if filename.endswith(".mmd"):
                        existing_entry["diagram"] = filename
                    elif filename.endswith(".json"):
                        existing_entry["hierarchy"] = filename
    groups = list(grouped_catalog.values())
    for g in groups:
        g["entries"].sort(key=lambda e: e["root"])
    return sorted(groups, key=lambda g: g["category"])


def flatten_rules(rules: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Flatten a nested structure of rules into a list."""
    flat_list: List[Dict[str, Any]] = []
    seen = set()

    def dfs(rule, parent_guid=None, parent_action_index=None):
        guid = rule.get("RuleGUID")
        if not guid:
            guid = f"udf_{uuid.uuid4()}"
            rule["RuleGUID"] = guid
        rule["ParentGUID"] = parent_guid
        rule["ParentActionIndex"] = parent_action_index
        if guid in seen:
            return
        seen.add(guid)
        flat_list.append(rule)
        for child in rule.get("Children", []):
            dfs(child, guid, None)
        for i, action in enumerate(rule.get("Actions", [])):
            for child_rule in action.get("ChildRules", []):
                dfs(child_rule, guid, i)

    for r in rules:
        dfs(r, parent_guid=None)
    return flat_list


def propagate_disabled_rules(
    rules: Iterable[Dict[str, Any]], inherited_disabled: bool = False
) -> None:
    """Propagate the disabled state through the rules in-place."""
    for rule in rules:
        current_disabled = inherited_disabled or (
            rule.get("Attributes", {}).get("_Disabled") in ["1", 1, True]
        )
        if "Attributes" not in rule:
            rule["Attributes"] = {}
        if current_disabled:
            rule["Attributes"]["_Disabled"] = "1"
        if "Children" in rule:
            propagate_disabled_rules(rule["Children"], current_disabled)
        if "Actions" in rule:
            for action in rule.get("Actions", []):
                if "ChildRules" in action:
                    propagate_disabled_rules(action["ChildRules"], current_disabled)


def build_edge_map(edges: Iterable[Dict[str, Any]]) -> Dict[str, list[str]]:
    """Build a mapping of edges for quick access."""
    edge_map: Dict[str, list[str]] = {}
    for edge in edges:
        parts = edge["edge_str"].split("-->")
        if len(parts) == 2:
            left = parts[0].strip()
            right = parts[1].split("|")[-1].strip()
            edge_map.setdefault(left, []).append(right)
    return edge_map


# Dummy implementations for build_all_edges and build_nodes so generate_files can import

def build_all_edges(rules):
    return [], []


def build_nodes(*args, **kwargs):
    return {}

def validate_hierarchy_data(data):
    """Validate and normalize hierarchy data structure."""
    if isinstance(data, dict):
        rules = data.get("rules", [data])
    else:
        rules = data
    normalized = []
    guid_map = {}
    for rule in rules:
        if not isinstance(rule, dict):
            continue
        rule["RuleGUID"] = rule.get("RuleGUID") or rule.get("_RuleGUID") or str(uuid.uuid4())
        rule["RuleName"] = rule.get("RuleName") or rule.get("_RuleName") or f"Rule_{rule['RuleGUID'][:8]}"
        rule.pop("_RuleGUID", None)
        rule.pop("_RuleName", None)
        guid_map[rule["RuleGUID"]] = rule
        normalized.append(rule)
    return normalized, guid_map


def build_hierarchy(normalized_rules, guid_map):
    """Build proper hierarchy structure from normalized rules."""
    roots = []
    for rule in normalized_rules:
        parent_guid = rule.get("ParentGUID")
        if parent_guid and parent_guid in guid_map:
            parent = guid_map[parent_guid]
            parent.setdefault("children", []).append(rule)
        else:
            roots.append(rule)
    return roots
