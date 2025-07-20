import os
import sys
import types

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Stub flask_login current_user for get_current_user
flask_login_stub = types.ModuleType('flask_login')
flask_login_stub.current_user = types.SimpleNamespace(is_authenticated=False, username='user')
sys.modules.setdefault('flask_login', flask_login_stub)

import utils  # noqa: E402


def test_validate_email():
    assert utils.validate_email('test@example.com')
    assert not utils.validate_email('invalid-email')


def test_validate_password():
    assert utils.validate_password('abc12345')
    assert not utils.validate_password('short1')
