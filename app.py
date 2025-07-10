"""Application factory and runtime setup for Rules Central."""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

from flask import Flask
from flask_assets import Environment
from markdown import markdown

# Optional .env support -------------------------------------------------------
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # pragma: no cover
    logging.getLogger("rules_central").warning(
        "python-dotenv not installed; skipping load_dotenv()"
    )

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
LOGGER = logging.getLogger("rules_central")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# -----------------------------------------------------------------------------
# Blueprint auto‑import
# -----------------------------------------------------------------------------
try:
    from routes import all_blueprints  # your project aggregates them here
except ImportError:  # pragma: no cover
    LOGGER.error("Cannot import 'routes.all_blueprints'.")
    all_blueprints = []  # keep the app bootable for now


# -----------------------------------------------------------------------------
# Factory
# -----------------------------------------------------------------------------
def create_app() -> Flask:
    """Create and configure a Flask application instance."""
    app = Flask(__name__, static_folder="static", static_url_path="/static")

    # -------------------------------------------------------------------------
    # Config
    # -------------------------------------------------------------------------
    app.config["VERSION"] = "1.0.0"
    app.config["UPLOAD_FOLDER"] = os.path.abspath(
        os.getenv("UPLOAD_FOLDER", os.path.join(app.root_path, "uploads"))
    )
    app.config["DIAGRAMS_FOLDER"] = os.path.abspath(
        os.getenv("DIAGRAMS_FOLDER", os.path.join(app.root_path, "diagrams"))
    )

    # -------------------------------------------------------------------------
    # Extensions
    # -------------------------------------------------------------------------
    Environment(app)  # Flask-Assets pipeline (CSS/JS)

    # -------------------------------------------------------------------------
    # Template helpers
    # -------------------------------------------------------------------------
    @app.template_filter("markdown")
    def _render_markdown(text: str) -> str:  # noqa: WPS430
        """Render Markdown inside templates."""
        if not text:
            return ""
        return markdown(text)

    @app.context_processor
    def _inject_now():  # noqa: WPS430
        """Expose `now()` helper to Jinja."""
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

    @app.context_processor
    def _expose_globals():
        """Expose Jinja environment globals for conditional checks."""

        from flask import current_app

        def _globals() -> dict:
            return current_app.jinja_env.globals

        return {"globals": _globals}

    # ─── Directory checks ──────────────────────────────────────────
    with app.app_context():
        ensure_directories(app)

    # ─── Blueprints & Config ───────────────────────────────────────
    # -------------------------------------------------------------------------
    # Register blueprints
    # -------------------------------------------------------------------------
    for bp in all_blueprints:
        app.register_blueprint(bp)

    # -------------------------------------------------------------------------
    # Ensure required directories
    # -------------------------------------------------------------------------
    for path in (app.config["UPLOAD_FOLDER"], app.config["DIAGRAMS_FOLDER"]):
        os.makedirs(path, exist_ok=True)
        LOGGER.info("Directory ensured: %s", path)

    LOGGER.info("Rules Central initialised (version %s)", app.config["VERSION"])
    return app


# Create a global application instance for WSGI servers -----------------------
app = create_app()

if __name__ == "__main__":  # pragma: no cover
    LOGGER.info("Starting Flask dev server: http://127.0.0.1:8080")
    app.run(debug=True, host="127.0.0.1", port=8080)
