import os
import json
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, Iterable

from flask import current_app
from flask_login import current_user

from config import load_configurations, Config
from werkzeug.utils import secure_filename

# Load configurations
CONFIG = load_configurations()

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s [%(filename)s:%(lineno)d]",
)
LOGGER = logging.getLogger(__name__)

# --- File and Directory Utilities ---

def allowed_file(filename: str) -> bool:
    """Return ``True`` if ``filename`` has an approved extension."""
    allowed_exts = {"json", "mmd"}
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_exts

def ensure_directory_exists(directory: str | Path) -> None:
    """Ensure ``directory`` exists, creating it if necessary."""
    path = Path(directory)
    if not path.exists():
        try:
            path.mkdir(parents=True, exist_ok=True)
            LOGGER.info("Created directory: %s", directory)
        except OSError as exc:
            LOGGER.error("Failed to create directory %s: %s", directory, exc)


def get_file_metadata(filepath: str | Path) -> Dict[str, float]:
    """Return basic file metadata for ``filepath``."""
    stat = Path(filepath).stat()
    return {"size": stat.st_size, "last_modified": stat.st_mtime}

# --- JSON Loading and Sanitization ---

def remove_all_quotes(obj: Any) -> Any:
    """Recursively remove all double quotes from strings in ``obj``."""
    if isinstance(obj, str):
        return obj.replace('"', '')
    elif isinstance(obj, dict):
        return {k: remove_all_quotes(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [remove_all_quotes(item) for item in obj]
    return obj

def add_missing_guids_if_needed(rules: Iterable[Dict[str, Any]]) -> None:
    """Recursively add GUIDs to ``rules`` if they are missing."""
    def recurse(rule):
        if not rule.get("RuleGUID"):
            rule["RuleGUID"] = f"udf_{uuid.uuid4()}"
        for child in rule.get("Children", []):
            recurse(child)
        for action in rule.get("Actions", []):
            for c in action.get("ChildRules", []):
                recurse(c)
    for top_rule in rules:
        recurse(top_rule)

def load_and_sanitize_json(filepath: str | Path) -> list[Dict[str, Any]] | None:
    """Load and sanitize JSON data from ``filepath``."""
    try:
        with open(filepath, "r", encoding="utf-8") as file:
            content = file.read()
            if content.lstrip().startswith("<"):
                raise ValueError("Uploaded file appears to be HTML, not valid JSON.")
            file.seek(0)
            data = json.load(file)
            if isinstance(data, dict) and "rules" in data:
                data = data["rules"]
            if not isinstance(data, list):
                raise ValueError("JSON data must be a list of rules.")
            for rule in data:
                if "RuleName" not in rule:
                    rule["RuleName"] = "Unnamed"
                if "Attributes" in rule and isinstance(rule["Attributes"], dict):
                    rule["Attributes"] = remove_all_quotes(rule["Attributes"])
                    udf_value = rule["Attributes"].get("UDFName", "").strip()
                    if udf_value:
                        pass  # Placeholder for any UDF-specific logic
            add_missing_guids_if_needed(data)
            LOGGER.info("JSON file %s successfully loaded. Missing GUIDs assigned if needed.", filepath)
            return data
    except (json.JSONDecodeError, FileNotFoundError, ValueError) as e:
        LOGGER.error("Error loading JSON file %s: %s", filepath, e)
        return None

# --- Grouping and Catalog Utilities ---

def get_dynamic_groups(diagrams_folder: str | Path) -> list[Dict[str, Any]]:
    """Return groups of diagrams by common prefix."""
    if not os.path.exists(diagrams_folder):
        return []
    grouped_catalog: Dict[str, Dict[str, Any]] = {}
    for folder in os.listdir(diagrams_folder):
        folder_path = os.path.join(diagrams_folder, folder)
        if not os.path.isdir(folder_path):
            continue
        parts = folder.split("_")
        prefix = "_".join(parts[:2]) if len(parts) > 1 else folder
        if prefix not in grouped_catalog:
            grouped_catalog[prefix] = {"category": prefix, "entries": []}
        for filename in os.listdir(folder_path):
            if filename.endswith('.mmd') or filename.endswith('.json'):
                # base_name = os.path.splitext(filename)[0]
                existing_entry = next((e for e in grouped_catalog[prefix]["entries"] if e["root"] == folder), None)
                if not existing_entry:
                    grouped_catalog[prefix]["entries"].append({
                        "root": folder,
                        "diagram": filename if filename.endswith('.mmd') else None,
                        "hierarchy": filename if filename.endswith('.json') else None
                    })
                else:
                    if filename.endswith('.mmd'):
                        existing_entry["diagram"] = filename
                    elif filename.endswith('.json'):
                        existing_entry["hierarchy"] = filename
    return list(grouped_catalog.values())

# --- Rule Flattening and Hierarchy ---

def flatten_rules(rules: Iterable[Dict[str, Any]]) -> list[Dict[str, Any]]:
    """
    Flatten a nested structure of rules (Children, Actions->ChildRules) into
    a single list, ensuring each rule has a valid 'ParentGUID' reference.
    """
    flat_list = []
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

# --- Mermaid Diagram Generation ---

def escape_mermaid_chars(text):
    """Escape special characters for Mermaid syntax."""
    return (
        text.replace('"', '\\"')
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('&lt;br&gt;', '<br>')
        .replace('(', '- ')
        .replace(')', '')
    )

def apply_translations(text):
    """Apply translations to the given text based on the configuration."""
    for key, value in CONFIG.get('translations', {}).items():
        text = text.replace(key, value)
    return text

def get_node_label(rule, clickable=False):
    """Generate a label for a node based on its attributes."""
    label = rule.get("RuleName", "")
    if "FunctionName" in rule and rule["FunctionName"]:
        label += f"<br>Function: {rule['FunctionName']}"
    label = apply_translations(label)
    label = escape_mermaid_chars(label)
    if clickable:
        label += " ↪"
    return label

def get_node_shape(rule):
    """Determine the shape of a node based on its name."""
    rname = rule.get("RuleName", "").lower()
    if "?" in rname:
        return "diamond"
    if "plug" in rname:
        return "plug"
    if "set" in rname:
        return "set"
    return "rect"

def build_sibling_chain(rule, edges):
    """Build sibling chains for a given rule."""
    parent_guid = rule["RuleGUID"]
    children = rule.get("Children", [])
    action_names = []
    if children:
        first_child_guid = children[0]["RuleGUID"]
        edges.append({
            "edge_str": f"{parent_guid} --> {first_child_guid}",
            "edge_type": "PC",
            "label": ""
        })
        for i in range(len(children) - 1):
            edges.append({
                "edge_str": f"{children[i]['RuleGUID']} --> {children[i + 1]['RuleGUID']}",
                "edge_type": "SB",
                "label": ""
            })
    for action in rule.get("Actions", []):
        child_rules = action.get("ChildRules", [])
        if child_rules:
            action_name = action.get("ActionName", "").strip()
            if action_name.strip() == "---":
                action_name = "Continue"
            label_part = f"|{escape_mermaid_chars(action_name)}|" if action_name else ""
            first_c_guid = child_rules[0]["RuleGUID"]
            edges.append({
                "edge_str": f"{parent_guid} -->{label_part} {first_c_guid}",
                "edge_type": "PC",
                "label": action_name
            })
            for i in range(len(child_rules) - 1):
                edges.append({
                    "edge_str": f"{child_rules[i]['RuleGUID']} --> {child_rules[i + 1]['RuleGUID']}",
                    "edge_type": "SB",
                    "label": ""
                })
            if action_name:
                action_names.append(action_name)
    for c in children:
        build_sibling_chain(c, edges)
    for action in rule.get("Actions", []):
        for c in action.get("ChildRules", []):
            build_sibling_chain(c, edges)
    return action_names

def build_all_edges(rules):
    """Build all edges for the given rules."""
    edges = []
    action_names = []
    top_level = [r for r in rules if r.get("ParentGUID") is None]
    for rule in top_level:
        action_names.extend(build_sibling_chain(rule, edges))
    return edges, action_names

def build_nodes(flat_rules, group_ids=None, root_name="", edge_map=None, rule_to_page=None, current_page=None):
    """Build nodes for the Mermaid diagram."""
    nodes = {}
    for rule in flat_rules:
        guid = rule["RuleGUID"]
        rule["RootName"] = root_name
        if group_ids is not None:
            children = rule.get("Children", [])
            if children:
                clickable = any(child["RuleGUID"] not in group_ids for child in children)
            else:
                clickable = False
                if edge_map is not None and guid in edge_map:
                    clickable = any(child_guid not in group_ids for child_guid in edge_map[guid])
        else:
            has_children = bool(rule.get("Children")) or any("ChildRules" in a and a["ChildRules"]
                                                             for a in rule.get("Actions", []))
            clickable = has_children
        label = get_node_label(rule, clickable=clickable)
        shape = get_node_shape(rule)
        if shape == "diamond":
            node_str = f'{guid}{{"{label}"}}'
        else:
            node_str = f'{guid}["{label}"]'
        disabled = rule.get("Attributes", {}).get("_Disabled") in ["1", 1, True]
        if disabled:
            node_str += ':::classDisabled'
        else:
            node_str += f':::class{shape}'
        node_str = node_str.rstrip() + "\n"
        if clickable:
            node_str += f"{get_node_click(rule, rule_to_page, current_page, root_name, edge_map)}\n"
        nodes[guid] = node_str
    return nodes

def get_node_click(rule, rule_to_page, current_page, root_name, edge_map):
    """Generate click event for a node."""
    guid = rule["RuleGUID"]
    target_page = None
    if edge_map and guid in edge_map and rule_to_page is not None and current_page is not None:
        for child_guid in edge_map[guid]:
            if rule_to_page.get(child_guid, current_page) != current_page:
                target_page = rule_to_page[child_guid]
                break
    if target_page is not None:
        return f'click {guid} "/view_diagrams/{root_name}?page={target_page}" "View Page {target_page}"'
    return ""

def generate_mermaid_code(nodes, edges, layout="TD"):
    """Generate Mermaid code for the diagram."""
    code = f"flowchart {layout}\n"
    for node_str in nodes.values():
        for line in node_str.splitlines():
            code += "    " + line + "\n"
    for i, edge_info in enumerate(edges):
        edge_str = edge_info["edge_str"]
        edge_type = edge_info["edge_type"]
        code += f"    {edge_str}\n"
        if edge_type == "PC":
            code += f"    linkStyle {i} stroke:#000,stroke-width:2px;\n"
        elif edge_type == "SB":
            code += f"    linkStyle {i} stroke:#666,stroke-dasharray:3,stroke-width:2px;\n"
    return code

# --- File Generation ---

def generate_files(json_data: list, output_dir: str) -> None:
    """
    Process the input JSON data and generate output files directly into the main output directory.
    Each unique container in the JSON will yield:
      - A Mermaid diagram file named <container>.mmd.
      - A JSON file containing the rules and the action names for that container named <container>.json.
    """
    LOGGER.info("Processing %d rules...", len(json_data))
    os.makedirs(output_dir, exist_ok=True)
    propagate_disabled_rules(json_data)
    flat_rules = flatten_rules(json_data)
    edges, _ = build_all_edges(json_data)
    edge_map = build_edge_map(edges)
    LOGGER.info("Processed %d flat rules and %d edges.", len(flat_rules), len(edges))
    container_groups = {}
    for rule in flat_rules:
        container = rule.get("Container") or os.path.basename(output_dir)
        container_groups.setdefault(container, []).append(rule)
    total_containers = len(container_groups)
    root_name = os.path.basename(output_dir)
    LOGGER.info("Found %d unique container(s) in the data.", total_containers)
    for container, rules in container_groups.items():
        group_ids = {r["RuleGUID"] for r in rules}
        group_nodes = build_nodes(
            rules,
            group_ids=group_ids,
            root_name=root_name,
            edge_map=edge_map,
            rule_to_page=None,
            current_page=1
        )
        group_edges = [
            e for e in edges
            if e["edge_str"].split("-->")[0].strip() in group_ids
        ]
        container_action_names = set()
        for rule in rules:
            for action in rule.get("Actions", []):
                name = action.get("ActionName", "").strip()
                if name and name != "---":
                    container_action_names.add(name)
        mermaid_code = generate_mermaid_code(
            group_nodes,
            group_edges,
            layout="TD"
        )
        if container_action_names:
            mermaid_code += "\n%% ActionNames: " + ", ".join(sorted(container_action_names))
        sanitized_container = secure_filename(container)
        diagram_filename = f"{sanitized_container}.mmd"
        diagram_path = os.path.join(output_dir, diagram_filename)
        with open(diagram_path, "w", encoding="utf-8") as f:
            f.write(mermaid_code)
        LOGGER.info("Created diagram file '%s' with %d nodes.", diagram_filename, len(group_nodes))
        output_data = {
            "rules": rules,
            "actionNames": sorted(list(container_action_names))
        }
        container_json_path = os.path.join(output_dir, f"{sanitized_container}.json")
        with open(container_json_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=4)
        LOGGER.info("Saved container JSON to '%s'.", container_json_path)

# --- Activity Logging ---

def log_activity(
    action: str,
    rule_id: str | None = None,
    user: str | None = None,
    details: str | None = None,
) -> None:
    """Log an activity entry to :data:`Config.ACTIVITY_LOG`."""
    try:
        Config.ensure_data_dir()
        activity_log_path = Config.ACTIVITY_LOG
        data: dict = {}
        if os.path.exists(activity_log_path):
            try:
                with open(activity_log_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                data = {"rules": {}, "activity_log": []}
        else:
            data = {"rules": {}, "activity_log": []}
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "user": user or "anonymous",
            "details": details or f"{action} operation"
        }
        data["activity_log"].append(entry)
        if rule_id:
            data["rules"][rule_id] = {
                "status": "active",
                "last_modified": entry["timestamp"],
                "modified_by": user or "system"
            }
        with open(activity_log_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except Exception as exc:
        LOGGER.error("Failed to log activity: %s", exc)

# --- Hierarchy Validation and Building ---

def validate_hierarchy_data(data):
    """Validate and normalize hierarchy data structure."""
    if isinstance(data, dict):
        rules = data.get('rules', [data])
    elif isinstance(data, list):
        rules = data
    else:
        raise ValueError("Invalid data format - expected array or object")
    normalized = []
    guid_map = {}
    for rule in rules:
        if not isinstance(rule, dict):
            continue
        rule['RuleGUID'] = rule.get('RuleGUID') or rule.get('_RuleGUID', '').strip('"') or str(uuid.uuid4())
        rule['RuleName'] = rule.get('RuleName') or \
                           rule.get('_RuleName', '').strip('"') or \
                           rule.get('RootName') or \
                           f"Rule_{rule['RuleGUID'][:8]}"
        for legacy_field in ['_RuleGUID', '_RuleName', '_FunctionName']:
            rule.pop(legacy_field, None)
        guid_map[rule['RuleGUID']] = rule
        normalized.append(rule)
    return normalized, guid_map

def build_hierarchy(normalized_rules, guid_map):
    """Build proper hierarchy structure from normalized rules."""
    roots = []
    for rule in normalized_rules:
        parent_guid = rule.get('ParentGUID')
        if parent_guid and parent_guid in guid_map:
            parent = guid_map[parent_guid]
            if 'children' not in parent:
                parent['children'] = []
            if rule.get('ParentActionIndex') is not None:
                if 'Actions' not in parent:
                    parent['Actions'] = []
                while len(parent['Actions']) <= rule['ParentActionIndex']:
                    parent['Actions'].append({'ActionName': f'Action {len(parent["Actions"])}'})
                if 'ChildRules' not in parent['Actions'][rule['ParentActionIndex']]:
                    parent['Actions'][rule['ParentActionIndex']]['ChildRules'] = []
                parent['Actions'][rule['ParentActionIndex']]['ChildRules'].append(rule)
            else:
                parent['children'].append(rule)
        else:
            roots.append(rule)
    return roots

# --- Miscellaneous Utilities ---

import re

def highlight_matches(text, query):
    """Highlight matches case-insensitively."""
    if not query:
        return text
    try:
        pattern = re.compile(re.escape(query), re.IGNORECASE)
    except re.error as exc:
        LOGGER.error("Invalid regex in highlight_matches: %s", exc)
        return text
    return pattern.sub(lambda m: f'<strong>{m.group()}</strong>', text)
def find_rule_by_guid(rules, guid):
    """Find a rule by its GUID."""
    for rule in rules:
        if rule.get("RuleGUID") == guid:
            return rule
        if "Children" in rule:
            found = find_rule_by_guid(rule["Children"], guid)
            if found:
                return found
        if "Actions" in rule:
            for action in rule.get("Actions", []):
                if "ChildRules" in action:
                    found = find_rule_by_guid(action["ChildRules"], guid)
                    if found:
                        return found
    return None

def update_mmd_files_with_translations(diagrams_folder, translations):
    """Update .mmd files in the given folder with translations."""
    for filename in os.listdir(diagrams_folder):
        if filename.endswith(".mmd"):
            filepath = os.path.join(diagrams_folder, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                for key, replacement in translations.items():
                    content = content.replace(key, replacement)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                LOGGER.info("Updated translations in %s", filename)
            except Exception as exc:
                LOGGER.error("Error updating %s: %s", filename, exc)

def propagate_disabled_rules(rules, inherited_disabled=False):
    """Propagate the disabled state through the rules."""
    for rule in rules:
        current_disabled = inherited_disabled or (rule.get("Attributes", {}).get("_Disabled") in ["1", 1, True])
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

def build_edge_map(edges):
    """Build a mapping of edges for quick access."""
    edge_map = {}
    for edge in edges:
        parts = edge["edge_str"].split("-->")
        if len(parts) == 2:
            left = parts[0].strip()
            right = parts[1].strip()
            if "|" in right:
                right = right.split("|")[-1].strip()
            edge_map.setdefault(left, []).append(right)
    return edge_map


def diagram_type_from_filename(filename: str) -> str | None:
    """Return the diagram type inferred from its filename."""
    fname = filename.lower()
    if "flowchart" in fname:
        return "flowchart"
    if "sequence" in fname:
        return "sequence"
    if "class" in fname:
        return "class"
    if "state" in fname:
        return "state"
    return None


def get_snippet(content: str, query: str, snippet_length: int = 100) -> str:
    """Extract a short snippet of ``content`` around ``query``."""
    index = content.find(query)
    if index == -1:
        return ""
    start = max(0, index - snippet_length // 2)
    end = min(len(content), index + len(query) + snippet_length // 2)
    return content[start:end]


# --- Application Helper Utilities ---

def get_current_user() -> str:
    """Return the username of the authenticated user or 'anonymous'."""
    try:
        return current_user.username if current_user.is_authenticated else 'anonymous'
    except Exception:
        return 'anonymous'


def initialize_directories(app) -> None:
    """Ensure required application directories exist."""
    required_dirs = {
        'uploads': app.config.get('UPLOAD_FOLDER', './uploads'),
        'diagrams': app.config.get('DIAGRAMS_FOLDER', './diagrams'),
        'help': os.path.join(app.static_folder, 'help'),
    }
    for path in required_dirs.values():
        try:
            os.makedirs(path, exist_ok=True)
            app.logger.info(f"Directory verified: {path}")
        except OSError as e:
            app.logger.error(f"Failed to create directory {path}: {e}")
            raise


def get_help_topics() -> list[str]:
    """Return a sorted list of available help topic names."""
    help_dir = os.path.join(current_app.root_path, 'static', 'help')
    if not os.path.exists(help_dir):
        return []
    return sorted(
        f.replace('.md', '') for f in os.listdir(help_dir) if f.endswith('.md')
    )
