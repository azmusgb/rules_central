import os
import sys
import types
import json
from pathlib import Path

# Ensure project root is on the import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Stub modules required by utils
flask_stub = types.ModuleType("flask")
flask_stub.current_app = types.SimpleNamespace()
sys.modules.setdefault("flask", flask_stub)
flask_login_stub = types.ModuleType("flask_login")
flask_login_stub.current_user = types.SimpleNamespace(is_authenticated=False, username="user")
sys.modules.setdefault("flask_login", flask_login_stub)
werkzeug_utils = types.ModuleType("werkzeug.utils")
werkzeug_utils.secure_filename = lambda name: name
sys.modules.setdefault("werkzeug", types.ModuleType("werkzeug"))
sys.modules.setdefault("werkzeug.utils", werkzeug_utils)

import utils


def test_get_current_user(monkeypatch):
    user = types.SimpleNamespace(is_authenticated=True, username="alice")
    monkeypatch.setattr(utils, "current_user", user, raising=False)
    assert utils.get_current_user() == "alice"

    user.is_authenticated = False
    assert utils.get_current_user() == "anonymous"


def test_initialize_directories(tmp_path):
    uploads = tmp_path / "u"
    diagrams = tmp_path / "d"
    static = tmp_path / "static"

    class DummyApp:
        config = {"UPLOAD_FOLDER": uploads, "DIAGRAMS_FOLDER": diagrams}
        static_folder = static
        logger = types.SimpleNamespace(info=lambda *a, **k: None, error=lambda *a, **k: None)

    utils.initialize_directories(DummyApp)
    assert uploads.exists()
    assert diagrams.exists()
    assert (static / "help").exists()


def test_get_help_topics(tmp_path, monkeypatch):
    help_dir = tmp_path / "static" / "help"
    help_dir.mkdir(parents=True)
    (help_dir / "intro.md").write_text("i")
    (help_dir / "usage.md").write_text("u")
    (help_dir / "ignore.txt").write_text("x")

    current_app = types.SimpleNamespace(root_path=str(tmp_path))
    monkeypatch.setattr(utils, "current_app", current_app, raising=False)

    topics = utils.get_help_topics()
    assert topics == ["intro", "usage"]


def test_generate_files(tmp_path):
    data = [{"RuleGUID": "r1", "RuleName": "R1", "Container": "group"}]
    infos = utils.generate_files(data, str(tmp_path))
    assert infos and infos[0].filename == "group.mmd"
    mmd_content = (tmp_path / "group.mmd").read_text().strip()
    assert mmd_content == "graph TD"
    assert (tmp_path / "group.json").is_file()
