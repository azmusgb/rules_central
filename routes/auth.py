"""Authentication routes."""

from flask import Blueprint, current_app, jsonify

auth = Blueprint("auth", __name__)


@auth.route("/login")
def login():
    """Simple login endpoint placeholder."""

    try:
        return "Login Page"
    except Exception as exc:
        current_app.logger.error("Login route error: %s", exc)
        return jsonify(error="Login failure"), 500
