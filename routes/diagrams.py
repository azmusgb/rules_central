"""Simple diagrams route placeholder."""

from flask import (
    Blueprint,
    current_app,
    jsonify,
    render_template,
)

diagrams = Blueprint("diagrams", __name__)


@diagrams.route("/diagrams")
def diagrams_index():
    """Display the diagram viewer page."""

    try:
        return render_template("diagram_viewer.html")
    except Exception as exc:
        current_app.logger.error("Diagrams route error: %s", exc)
        return jsonify(error="Unable to load diagrams"), 500

@diagrams.route("/diagram_converter")
def diagram_converter():
    """Display the FormWorks to Mermaid converter tool."""
    try:
        return render_template("mermaid_converter.html")
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error("Converter route error: %s", exc)
        return jsonify(error="Unable to load converter"), 500
