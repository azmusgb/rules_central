"""
app.py · v3 · 2025-07-13
=============================
Opinionated but lightweight Flask application factory with:

* ENV-aware configuration loading
* Centralised extension bootstrap (SQLAlchemy, Migrate, LoginManager… tweak as needed)
* Blueprint auto-registration (picks up `routes/*.py` or manual list)
* Structured JSON error responses
* Production-grade logging to file + console
* Click commands for shell context & DB bootstrap
"""

from __future__ import annotations

import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict

from flask import Flask

try:  # allow tests to stub a minimal 'flask' module
    from flask import jsonify
except Exception:  # pragma: no cover - stub fallback
    def jsonify(data):  # type: ignore[return-type]
        return data
try:
    from werkzeug.middleware.proxy_fix import ProxyFix
except Exception:  # pragma: no cover - stub fallback
    class ProxyFix:  # type: ignore[too-many-instance-attributes]
        def __init__(self, app, x_for=1, x_proto=1):
            self.app = app

        def __call__(self, environ, start_response):
            return self.app(environ, start_response)

# --------------------------------------------------------------------------- #
# 1. Configuration loader
# --------------------------------------------------------------------------- #

DEFAULT_CONFIG: Dict[str, Any] = {
    "ENV": "production",
    "DEBUG": False,
    "TESTING": False,
    "SECRET_KEY": os.getenv("FLASK_SECRET_KEY", "change-me"),
    "SQLALCHEMY_DATABASE_URI": os.getenv("DATABASE_URL", "sqlite:///rules.db"),
    "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    "DATA_DIR": os.getenv("DATA_DIR", "instance/data"),
    "LOG_DIR": os.getenv("LOG_DIR", "instance/logs"),
    "MAX_CONTENT_LENGTH": 30 * 1024 * 1024,  # 30 MB uploads
    "VERSION": "1.0.0",
}


def create_app(**custom: Any) -> Flask:
    """Factory pattern — returns a fully configured Flask application."""
    try:
        app = Flask(__name__, instance_relative_config=True)
    except TypeError:  # pragma: no cover - support Flask test stubs
        app = Flask(__name__)

    # Apply layered config: defaults → file → **custom
    if hasattr(app.config, "from_mapping"):
        app.config.from_mapping(DEFAULT_CONFIG)
    else:  # pragma: no cover - support minimal stubs
        app.config.update(DEFAULT_CONFIG)
    cfg_root = Path(getattr(app, "instance_path", Path.cwd()))
    cfg_file = cfg_root / "config.py"
    if cfg_file.exists():
        if hasattr(app.config, "from_pyfile"):
            app.config.from_pyfile(cfg_file)  # type: ignore[arg-type]
        else:  # pragma: no cover - support minimal stubs
            pass  # Skip loading instance file when unsupported
    if custom:
        if hasattr(app.config, "from_mapping"):
            app.config.from_mapping(custom)
        else:  # pragma: no cover - support minimal stubs
            app.config.update(custom)

    # Additional path configs used by the project
    app.config.setdefault(
        "UPLOAD_FOLDER",
        os.path.abspath(os.getenv("UPLOAD_FOLDER", os.path.join(app.root_path, "uploads"))),
    )
    app.config.setdefault(
        "DIAGRAMS_FOLDER",
        os.path.abspath(os.getenv("DIAGRAMS_FOLDER", os.path.join(app.root_path, "diagrams"))),
    )

    _ensure_directories(app)
    _configure_logging(app)
    _init_extensions(app)
    _register_blueprints(app)
    _register_error_handlers(app)
    _init_csrf(app)
    _register_cli(app)

    # If behind a reverse proxy / load balancer in prod
    if hasattr(app, "wsgi_app"):
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)  # type: ignore[attr-defined]

    return app


# --------------------------------------------------------------------------- #
# 2. Helpers
# --------------------------------------------------------------------------- #


def _ensure_directories(app: Flask) -> None:
    for key in ("DATA_DIR", "LOG_DIR", "UPLOAD_FOLDER", "DIAGRAMS_FOLDER"):
        Path(app.config[key]).mkdir(parents=True, exist_ok=True)


def _configure_logging(app: Flask) -> None:
    log_path = Path(app.config["LOG_DIR"]) / "app.log"
    handler = RotatingFileHandler(log_path, maxBytes=1_000_000, backupCount=5)
    handler.setFormatter(
        logging.Formatter("%(asctime)s  %(levelname)-8s  %(name)s  %(message)s")
    )

    log_level = logging.DEBUG if getattr(app, "debug", False) else logging.INFO
    logging.basicConfig(
        level=log_level,
        handlers=[handler, logging.StreamHandler(sys.stdout)],
        force=True,
    )
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    app.logger.info("Logging initialised → %s", log_path)


def _init_extensions(app: Flask) -> None:
    """Initialise Flask extensions in one place."""
    try:
        from extensions import db, login_manager, migrate
    except Exception:  # pragma: no cover - optional extensions
        return

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    logger = getattr(app, "logger", logging.getLogger(__name__))
    logger.debug("Extensions initialised: SQLAlchemy, Migrate, LoginManager")


def _register_blueprints(app: Flask) -> None:
    """Register project blueprints automatically."""
    try:
        from routes import all_blueprints
    except Exception as exc:
        app.logger.error("Failed to import blueprints: %s", exc)
        all_blueprints = []

    for bp in all_blueprints:
        app.register_blueprint(bp)
        app.logger.info("Blueprint registered: %s", bp.name)


def _register_error_handlers(app: Flask) -> None:
    if not hasattr(app, "errorhandler"):
        return
    @app.errorhandler(404)
    def not_found(e):  # type: ignore[missing-return-type-hint]
        return jsonify({"ok": False, "error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):  # type: ignore[missing-return-type-hint]
        app.logger.exception("Unhandled exception")
        return jsonify({"ok": False, "error": "Server error"}), 500


def _init_csrf(app: Flask) -> None:
    """Add CSRF protection if available and inject token helper."""
    try:
        from flask_wtf import CSRFProtect  # type: ignore
        from flask_wtf.csrf import generate_csrf  # type: ignore
    except Exception:  # pragma: no cover - optional dependency
        CSRFProtect = None  # type: ignore[assignment]

        def generate_csrf() -> str:  # type: ignore[misc]
            return ""

    if CSRFProtect is not None:
        CSRFProtect().init_app(app)

    if hasattr(app, "context_processor"):
        @app.context_processor
        def _inject_csrf() -> dict[str, Any]:  # noqa: D401
            return {"csrf_token": generate_csrf}


def _register_cli(app: Flask) -> None:
    if not hasattr(app, "cli"):
        return

    import click

    @app.cli.command("shell-ctx")
    def _shell_ctx() -> None:  # noqa: D401
        """🌱  Provide objects automatically in ``flask shell``."""
        ctx = {"app": app}
        db = app.extensions.get("sqlalchemy") if hasattr(app, "extensions") else None
        if db:
            ctx["db"] = db
        for name, obj in ctx.items():
            click.echo(f"  {name} → {obj}")
        app.shell_context_processor(lambda: ctx)  # type: ignore[arg-type]

    @app.cli.command("init-db")
    def _init_db() -> None:  # noqa: D401
        """Create all DB tables (dev only, prefer migrations in prod)."""
        db = app.extensions.get("sqlalchemy") if hasattr(app, "extensions") else None
        if db is None:
            click.echo("SQLAlchemy not available")
            return
        db.create_all()
        click.echo("Database tables created.")


# --------------------------------------------------------------------------- #
# 3. Legacy support — keep Gunicorn & Flask CLI happy
# --------------------------------------------------------------------------- #

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
