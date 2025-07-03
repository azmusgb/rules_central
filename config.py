import json
import logging
import os
from pathlib import Path
from datetime import datetime

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config', 'config.json')


def load_configurations():
    try:
        with open(CONFIG_PATH, 'r', encoding="utf-8") as config_file:
            return json.load(config_file)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logging.error(f"Error loading configuration file: {e}")
        return {'translations': {}, 'styles': {}}


class Config:
    DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
    ACTIVITY_LOG = Path(DATA_DIR) / 'activity_log.json'

    @classmethod
    def ensure_data_dir(cls):
        os.makedirs(cls.DATA_DIR, exist_ok=True)
        if not cls.ACTIVITY_LOG.exists():
            initial_data = {
                "rules": {},
                "activity_log": [
                    {
                        "timestamp": datetime.utcnow().isoformat(),
                        "action": "system",
                        "user": "init",
                        "details": "Activity log initialized"
                    }
                ]
            }
            with open(cls.ACTIVITY_LOG, 'w') as f:
                json.dump(initial_data, f, indent=2)
            cls.ACTIVITY_LOG.chmod(0o644)
