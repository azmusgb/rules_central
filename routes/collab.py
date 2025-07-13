"""Collaboration routes."""

from flask import (
    Blueprint,
    current_app,
    jsonify,
    render_template,
)

collab = Blueprint("collab", __name__)


@collab.route("/collab")
def collab_index():
    """Collaboration hub main page."""

    try:
        return render_template("collab/index.html")
    except Exception as exc:
        current_app.logger.error("Collab route error: %s", exc)
        return jsonify(error="Collaboration service unavailable"), 500


@collab.route("/collab/team")
def team():
    """Team management page."""

    try:
        return render_template("collab/team.html")
    except Exception as exc:
        current_app.logger.error("Collab team route error: %s", exc)
        return jsonify(error="Collaboration service unavailable"), 500
