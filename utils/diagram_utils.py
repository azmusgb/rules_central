import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
import logging
from typing import Dict, Iterable

from werkzeug.utils import secure_filename

from .rule_utils import flatten_rules, build_all_edges, build_nodes, build_edge_map, propagate_disabled_rules

LOGGER = logging.getLogger(__name__)


@dataclass
class DiagramInfo:
    filename: str
    created: str


def diagram_type_from_filename(filename: str) -> str | None:
    """Return the diagram type inferred from its filename."""
    fname = filename.lower()
    if "flowchart" in fname:
        return "flowchart"
    if "sequence" in fname:
        return "sequence"
    if "class" in fname:
        return "class"
    return None


def generate_files(json_data: list, output_dir: str) -> list[DiagramInfo]:
    """Process ``json_data`` and generate diagram and JSON files."""
    LOGGER.info("Processing %d rules...", len(json_data))
    os.makedirs(output_dir, exist_ok=True)
    propagate_disabled_rules(json_data)
    flat_rules = flatten_rules(json_data)
    edges, _ = build_all_edges(json_data)
    edge_map = build_edge_map(edges)
    LOGGER.info(
        "Processed %d flat rules and %d edges.",
        len(flat_rules),
        len(edges),
    )
    container_groups: Dict[str, list] = {}
    for rule in flat_rules:
        container = rule.get("Container") or os.path.basename(output_dir)
        container_groups.setdefault(container, []).append(rule)
    root_name = os.path.basename(output_dir)
    infos: list[DiagramInfo] = []
    for container, rules in container_groups.items():
        group_ids = {r["RuleGUID"] for r in rules}
        group_nodes = build_nodes(
            rules,
            group_ids=group_ids,
            root_name=root_name,
            edge_map=edge_map,
            rule_to_page=None,
            current_page=1,
        )
        group_edges = [
            e for e in edges if e["edge_str"].split("-->")[0].strip() in group_ids
        ]
        mermaid_code = generate_mermaid_code(group_nodes, group_edges, layout="TD")
        sanitized_container = secure_filename(container)
        diagram_filename = f"{sanitized_container}.mmd"
        diagram_path = os.path.join(output_dir, diagram_filename)
        with open(diagram_path, "w", encoding="utf-8") as f:
            f.write(mermaid_code)
        info = DiagramInfo(diagram_filename, datetime.now(timezone.utc).isoformat())
        infos.append(info)
        LOGGER.info("Created diagram %s", info.filename)
        with open(os.path.join(output_dir, f"{sanitized_container}.json"), "w", encoding="utf-8") as f:
            json.dump({"rules": rules}, f, indent=4)
    return infos


# Support functions -----------------------------------------------------------

def generate_mermaid_code(nodes: Dict[str, Dict[str, str]], edges: Iterable[Dict[str, str]], layout: str = "TD") -> str:
    """Convert nodes and edges into a simple mermaid diagram string."""
    lines = [f"graph {layout}"]
    for node_id, node in nodes.items():
        lines.append(f"{node_id}[{node['label']}]")
    for edge in edges:
        lines.append(edge["edge_str"])
    return "\n".join(lines)
