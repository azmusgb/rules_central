import types

import utils  # noqa: E402


def test_validate_email():
    assert utils.validate_email('test@example.com')
    assert not utils.validate_email('invalid-email')


def test_validate_password():
    assert utils.validate_password('abc12345')
    assert not utils.validate_password('short1')
