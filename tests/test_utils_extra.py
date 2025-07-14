import os
import sys
import types
import json

# Ensure project root is on the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Stub werkzeug secure_filename so diagram_utils can be imported without the real package
werkzeug_stub = types.ModuleType('werkzeug')
werkzeug_utils_stub = types.ModuleType('werkzeug.utils')
werkzeug_utils_stub.secure_filename = lambda name: name
sys.modules.setdefault('werkzeug', werkzeug_stub)
sys.modules.setdefault('werkzeug.utils', werkzeug_utils_stub)

import utils
from utils.diagram_utils import generate_mermaid_code
from config import Config


def test_remove_all_quotes():
    data = {'a': '"quoted"', 'b': ['no"quotes', {'c': '"d"'}]}
    cleaned = utils.remove_all_quotes(data)
    assert cleaned == {'a': 'quoted', 'b': ['noquotes', {'c': 'd'}]}


def test_add_missing_guids_if_needed():
    rules = [{'RuleName': 'r1'}, {'RuleName': 'r2'}]
    utils.add_missing_guids_if_needed(rules)
    guids = [r.get('RuleGUID') for r in rules]
    assert all(guids) and len(set(guids)) == 2


def test_get_file_metadata(tmp_path):
    p = tmp_path / 'f.txt'
    content = 'hello'
    p.write_text(content)
    meta = utils.get_file_metadata(p)
    assert meta['size'] == len(content)
    assert isinstance(meta['last_modified'], float)


def test_log_activity(tmp_path, monkeypatch):
    monkeypatch.setattr(Config, 'DATA_DIR', tmp_path)
    monkeypatch.setattr(Config, 'ACTIVITY_LOG', tmp_path / 'activity_log.json')
    monkeypatch.setattr(Config, 'FEEDBACK_FILE', tmp_path / 'feedback.json')
    utils.log_activity('test', rule_id='r1', user='u1', details='demo')
    data = json.loads((Config.ACTIVITY_LOG).read_text())
    assert data['activity_log'][-1]['action'] == 'test'
    assert data['rules']['r1']['modified_by'] == 'u1'


def test_generate_mermaid_code():
    nodes = {'A': {'label': 'Start'}, 'B': {'label': 'End'}}
    edges = [{'edge_str': 'A --> B'}]
    result = generate_mermaid_code(nodes, edges)
    assert result.splitlines() == ['graph TD', 'A[Start]', 'B[End]', 'A --> B']
