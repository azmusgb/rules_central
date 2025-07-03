import os
import json
from typing import Any


class GroupingService:
    """Service to manage saving and loading hierarchical rule structures."""

    def __init__(self, diagrams_folder: str):
        self.diagrams_folder = diagrams_folder
        os.makedirs(self.diagrams_folder, exist_ok=True)

    def save_hierarchy(self, root_name: str, data: Any) -> None:
        """Save the normalized hierarchy JSON under a subdirectory named after the root_name."""
        output_dir = os.path.join(self.diagrams_folder, root_name)
        os.makedirs(output_dir, exist_ok=True)
        path = os.path.join(output_dir, f"{root_name}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def get_dynamic_groups(self) -> list:
        """Return a list of available hierarchy JSON files in the diagrams folder."""
        groups = []
        for filename in os.listdir(self.diagrams_folder):
            if filename.endswith(".json"):
                groups.append(filename[:-5])  # remove .json extension
        return sorted(groups)
