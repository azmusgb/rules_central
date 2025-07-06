import os
import sys
import types
import tempfile
import json

# Ensure project root is on the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Stub modules to satisfy imports in utils
flask_stub = types.ModuleType('flask')
flask_stub.current_app = types.SimpleNamespace()
sys.modules.setdefault('flask', flask_stub)
flask_login_stub = types.ModuleType('flask_login')
flask_login_stub.current_user = types.SimpleNamespace(is_authenticated=False, username='user')
sys.modules.setdefault('flask_login', flask_login_stub)
werkzeug_utils = types.ModuleType('werkzeug.utils')
werkzeug_utils.secure_filename = lambda filename: filename
sys.modules.setdefault('werkzeug', types.ModuleType('werkzeug'))
sys.modules.setdefault('werkzeug.utils', werkzeug_utils)

import utils


def test_allowed_file():
    assert utils.allowed_file('diagram.mmd')
    assert utils.allowed_file('rules.json')
    assert not utils.allowed_file('image.png')
    assert not utils.allowed_file('noextension')


def test_diagram_type_from_filename():
    assert utils.diagram_type_from_filename('my_flowchart.mmd') == 'flowchart'
    assert utils.diagram_type_from_filename('sequence_diagram.txt') == 'sequence'


def test_highlight_matches():
    result = utils.highlight_matches('Hello World', 'world')
    assert '<strong>World</strong>' in result
    assert utils.highlight_matches('No Match', '') == 'No Match'


def test_get_snippet():
    text = 'The quick brown fox jumps over the lazy dog'
    snippet = utils.get_snippet(text, 'brown', snippet_length=10)
    assert 'brown' in snippet
    assert len(snippet) <= 10 + len('brown')


def test_ensure_directory_exists(tmp_path):
    new_dir = tmp_path / 'newdir'
    utils.ensure_directory_exists(new_dir)
    assert new_dir.exists()


def test_load_and_sanitize_json(tmp_path):
    data = [{"RuleName": "Test"}]
    f = tmp_path / 'rules.json'
    f.write_text(json.dumps(data))
    loaded = utils.load_and_sanitize_json(f)
    assert loaded and loaded[0]['RuleName'] == 'Test'
    assert 'RuleGUID' in loaded[0]


def test_get_dynamic_groups(tmp_path):
    group_dir = tmp_path / 'A_first_rule'
    group_dir.mkdir()
    (group_dir / 'diagram.mmd').write_text('flowchart TD')
    (group_dir / 'hierarchy.json').write_text('[]')

    groups = utils.get_dynamic_groups(tmp_path)
    assert groups and groups[0]['category'] == 'A_first'
    entry = groups[0]['entries'][0]
    assert entry['root'] == 'A_first_rule'
    assert entry['diagram'] == 'diagram.mmd'
    assert entry['hierarchy'] == 'hierarchy.json'
