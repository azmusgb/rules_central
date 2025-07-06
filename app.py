"""Application factory and runtime setup for Rules Central."""

import logging
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Flask
from flask_material import Material
from flask_assets import Environment
from markdown import markdown

from config import Config, load_configurations
from routes import all_blueprints

# -------------------------------------------------------------------
# Environment & App Setup
# -------------------------------------------------------------------
load_dotenv()

LOGGER = logging.getLogger(__name__)

__all__ = ["create_app", "ensure_directories", "app"]


def create_app() -> Flask:
    """Factory function to create and configure the Flask application."""
    LOGGER.debug("Initializing Flask application")
    app = Flask(__name__, static_folder="static", static_url_path="/static")

    # ─── Basic configuration ────────────────────────────────────────
    app.secret_key = os.getenv("SECRET_KEY", "default_secret_key")
    app.config["VERSION"] = "1.0"

    # ─── Extensions ────────────────────────────────────────────────
    material = Material(app)
    _assets = Environment(app)

    # ─── Paths ─────────────────────────────────────────────────────
    app.config["UPLOAD_FOLDER"] = os.path.abspath(os.getenv("UPLOAD_FOLDER", "uploads"))
    app.config["DIAGRAMS_FOLDER"] = os.path.abspath(
        os.getenv("DIAGRAMS_FOLDER", "diagrams")
    )
    app.config["MATERIAL"] = material

    # ─── Filters & Globals ─────────────────────────────────────────
    @app.template_filter("markdown")
    def _render_markdown(text: str) -> str:  # noqa: ANN001
        """Render Markdown inside templates."""
        return markdown(text)

    @app.context_processor
    def _inject_now():
        """
        Make `now()` available in every template.

        Usage examples in Jinja:
            {{ now().year }}              → 2025
            {{ now('%b %d, %Y') }}        → Jun 18, 2025
        """
        def _now(fmt: str | None = None):
            ts = datetime.now(timezone.utc)
            return ts if fmt is None else ts.strftime(fmt)

        return {"now": _now}

    # ─── Logging ───────────────────────────────────────────────────
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s - %(levelname)s - %(message)s",
    )
    Config.ensure_data_dir()

    # ─── Directory checks ──────────────────────────────────────────
    with app.app_context():
        ensure_directories(app)

    # ─── Blueprints & Config ───────────────────────────────────────
    for bp in all_blueprints:
        app.register_blueprint(bp)
    try:
        app.config.update(load_configurations())
    except Exception as exc:  # pragma: no cover - config errors rarely occur
        app.logger.error("Configuration load failed: %s", exc)

    return app


def ensure_directories(app: Flask) -> None:
    """Create required directories if they don't exist."""
    required_dirs = [
        app.config["UPLOAD_FOLDER"],
        app.config["DIAGRAMS_FOLDER"],
        os.path.join(app.static_folder, "help"),
    ]
    for path in required_dirs:
        try:
            os.makedirs(path, exist_ok=True)
            app.logger.info("Directory verified: %s", path)
        except OSError as exc:
            app.logger.error("Failed to create directory %s: %s", path, exc)
            raise


# -------------------------------------------------------------------
# Create and run application
# -------------------------------------------------------------------
app = create_app()

if __name__ == "__main__":
    app.logger.info("Starting Flask Application on http://127.0.0.1:8080")
    app.run(debug=True, host="127.0.0.1", port=8080)
