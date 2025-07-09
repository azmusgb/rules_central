"""Application factory and runtime setup for Rules Central."""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional dependency
    def load_dotenv(*_args, **_kwargs):
        logging.getLogger("rules_central").warning(
            "python-dotenv not installed; skipping load_dotenv"
        )

from flask import Flask
from flask_assets import Environment
from markdown import markdown

from config import Config, load_configurations
from routes import all_blueprints

# -------------------------------------------------------------------
# Environment & Logging Setup
# -------------------------------------------------------------------
load_dotenv()

LOGGER = logging.getLogger("rules_central")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

__all__ = ["create_app", "ensure_directories", "app"]


def create_app() -> Flask:
    """Factory function to create and configure the Flask application."""
    LOGGER.debug("Initializing Flask application")
    app = Flask(__name__, static_folder="static", static_url_path="/static")

    # ─── Basic configuration ───────────────────────────────────────
    app.secret_key = os.getenv("SECRET_KEY", "default_secret_key")
    app.config["VERSION"] = "1.0"

    # ─── Extensions ────────────────────────────────────────────────
    Environment(app)

    # ─── Paths ─────────────────────────────────────────────────────
    app.config["UPLOAD_FOLDER"] = os.path.abspath(os.getenv("UPLOAD_FOLDER", "uploads"))
    app.config["DIAGRAMS_FOLDER"] = os.path.abspath(os.getenv("DIAGRAMS_FOLDER", "diagrams"))

    # ─── Filters & Globals ─────────────────────────────────────────
    @app.template_filter("markdown")
    def _render_markdown(text: str) -> str:
        """Render Markdown inside templates."""
        if not text:
            return ""
        return markdown(text)

    @app.context_processor
    def _inject_now():
        """
        Make `now()` available in every template.
        Usage:
            {{ now().year }}              → 2025
            {{ now('%b %d, %Y') }}        → Jul 07, 2025
        """
        def _now(fmt: Optional[str] = None):
            ts = datetime.now(timezone.utc)
            return ts if fmt is None else ts.strftime(fmt)
        return {"now": _now}

    @app.context_processor
    def _active_nav():
        """Return helper to mark navigation links as active."""
        def is_active(endpoint: str) -> str:
            from flask import request

            return (
                "text-primary-600 dark:text-primary-400 font-medium"
                if request.endpoint == endpoint
                else ""
            )

        return {"is_active": is_active}

    # ─── Directory checks ──────────────────────────────────────────
    with app.app_context():
        ensure_directories(app)

    # ─── Blueprints & Config ───────────────────────────────────────
    for bp in all_blueprints:
        app.register_blueprint(bp)
    try:
        app.config.update(load_configurations())
    except Exception as exc:
        LOGGER.error("Configuration load failed: %s", exc, exc_info=True)
        raise

    # ─── Data directory check ─────────────────────────────────────
    Config.ensure_data_dir()

    # ─── Onboarding/Welcome Log ────────────────────────────────────
    LOGGER.info("Rules Central Flask app initialized. Version: %s", app.config["VERSION"])
    LOGGER.info("Static folder: %s", app.static_folder)
    LOGGER.info("Upload folder: %s", app.config["UPLOAD_FOLDER"])
    LOGGER.info("Diagrams folder: %s", app.config["DIAGRAMS_FOLDER"])

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
            LOGGER.info("Directory verified: %s", path)
        except OSError as exc:
            LOGGER.error("Failed to create directory %s: %s", path, exc, exc_info=True)
            raise


# -------------------------------------------------------------------
# Create and run application
# -------------------------------------------------------------------
app = create_app()

if __name__ == "__main__":
    LOGGER.info("Starting Flask Application on http://127.0.0.1:8080")
    try:
        app.run(debug=True, host="127.0.0.1", port=8080)
    except Exception as exc:
        LOGGER.critical("Flask app failed to start: %s", exc, exc_info=True)
        raise
