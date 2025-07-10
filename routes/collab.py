"""Collaboration routes."""

from flask import Blueprint, current_app, jsonify

collab = Blueprint("collab", __name__)


@collab.route("/collab")
def collab_index():
    """Placeholder collaboration page."""

    try:
        return "Collaboration Home"
    except Exception as exc:
        current_app.logger.error("Collab route error: %s", exc)
        return jsonify(error="Collaboration service unavailable"), 500
