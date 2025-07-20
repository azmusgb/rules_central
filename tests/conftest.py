import os
import sys
import types
import pytest

# Make project root importable when test modules are loaded
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Prepopulate stubs so ``utils`` imports succeed during collection
if 'flask' not in sys.modules:
    flask_stub = types.ModuleType('flask')
    flask_stub.current_app = types.SimpleNamespace()
    flask_stub.render_template = lambda *a, **k: ''
    flask_stub.jsonify = lambda **k: k
    sys.modules['flask'] = flask_stub
if 'flask_login' not in sys.modules:
    login_stub = types.ModuleType('flask_login')
    login_stub.current_user = types.SimpleNamespace(is_authenticated=False, username='user')
    sys.modules['flask_login'] = login_stub
if 'werkzeug.utils' not in sys.modules:
    w_utils = types.ModuleType('werkzeug.utils')
    w_utils.secure_filename = lambda filename: filename
    sys.modules['werkzeug.utils'] = w_utils
if 'werkzeug' not in sys.modules:
    sys.modules['werkzeug'] = types.ModuleType('werkzeug')

@pytest.fixture(autouse=True)
def minimal_dependency_stubs(monkeypatch):
    """Allow tests to modify dependency stubs."""
    yield
