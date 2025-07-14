import json
from pathlib import Path
from typing import Any, Dict, Iterable
import logging

from .file_utils import ensure_directory_exists

LOGGER = logging.getLogger(__name__)


def remove_all_quotes(obj: Any) -> Any:
    """Recursively remove all double quotes from strings in obj."""
    if isinstance(obj, str):
        return obj.replace('"', "")
    if isinstance(obj, dict):
        return {k: remove_all_quotes(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [remove_all_quotes(item) for item in obj]
    return obj


def add_missing_guids_if_needed(rules: Iterable[Dict[str, Any]]) -> None:
    """Recursively add GUIDs to rules if they are missing."""
    import uuid

    def recurse(rule):
        if "RuleGUID" not in rule:
            rule["RuleGUID"] = str(uuid.uuid4())
        for child in rule.get("Children", []):
            recurse(child)
        for action in rule.get("Actions", []):
            for child in action.get("ChildRules", []):
                recurse(child)

    for r in rules:
        recurse(r)


def load_and_sanitize_json(filepath: str | Path) -> list[Dict[str, Any]] | None:
    """Load JSON from filepath and sanitize unexpected fields."""
    try:
        with open(filepath, "r", encoding="utf-8") as file:
            content = file.read()
            if content.lstrip().startswith("<"):
                raise ValueError("Uploaded file appears to be HTML, not JSON.")
            file.seek(0)
            data = json.load(file)

        if isinstance(data, dict) and "rules" in data:
            data = data["rules"]
        if not isinstance(data, list):
            raise ValueError("JSON data must be a list of rules.")

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

        def sanitize_rule(rule: Dict[str, Any]) -> Dict[str, Any]:
            cleaned = {k: v for k, v in rule.items() if k in allowed_fields}
            if "Attributes" in cleaned and isinstance(cleaned["Attributes"], dict):
                cleaned["Attributes"] = remove_all_quotes(cleaned["Attributes"])
            if "Children" in cleaned and isinstance(cleaned["Children"], list):
                cleaned["Children"] = [sanitize_rule(c) for c in cleaned["Children"]]
            if "Actions" in cleaned and isinstance(cleaned["Actions"], list):
                actions = []
                for action in cleaned["Actions"]:
                    a = {"ActionName": action.get("ActionName")}
                    if "ChildRules" in action and isinstance(action["ChildRules"], list):
                        a["ChildRules"] = [sanitize_rule(cr) for cr in action["ChildRules"]]
                    actions.append(a)
                cleaned["Actions"] = actions
            return cleaned

        sanitized = [sanitize_rule(r) for r in data]
        add_missing_guids_if_needed(sanitized)
        LOGGER.info("JSON file %s successfully loaded", filepath)
        return sanitized
    except (json.JSONDecodeError, FileNotFoundError, ValueError) as exc:
        LOGGER.error("Error loading JSON file %s: %s", filepath, exc)
        return None
