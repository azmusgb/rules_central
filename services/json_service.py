import json
import os
from typing import Any


class JSONService:
    """Service to handle loading and saving JSON files."""

    def load_json(self, path: str) -> Any:
        """Load JSON data from the specified file path."""
        if not os.path.exists(path):
            raise FileNotFoundError(f"JSON file not found: {path}")
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def save_json(self, path: str, data: Any) -> None:
        """Save data to the specified file path in JSON format."""
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
