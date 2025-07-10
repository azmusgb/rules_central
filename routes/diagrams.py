"""Simple diagrams route placeholder."""

from flask import Blueprint, current_app, jsonify

diagrams = Blueprint("diagrams", __name__)


@diagrams.route("/diagrams")
def diagrams_index():
    """Return a placeholder message for diagrams."""

    try:
        return "Diagrams Home"
    except Exception as exc:
        current_app.logger.error("Diagrams route error: %s", exc)
        return jsonify(error="Unable to load diagrams"), 500
