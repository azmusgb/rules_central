"""Opinionated Flask application factory with production-ready configuration.

Features:
- Environment-aware configuration loading (defaults → instance/config.py → custom)
- Centralized extension initialization (SQLAlchemy, Migrate, LoginManager)
- Automatic blueprint registration
- Structured JSON error responses
- Production-grade logging (file rotation + console)
- CLI commands for shell context and database management

Version: 3.0.0
Last Updated: 2025-07-13
"""

from __future__ import annotations

import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, Optional, TypeVar

from flask import Flask, jsonify

# Type variable for extension classes
F = TypeVar('F', bound=Flask)

try:
    from werkzeug.middleware.proxy_fix import ProxyFix
except ImportError:  # pragma: no cover
    class ProxyFix:  # type: ignore
        """Fallback proxy fixer when werkzeug middleware is unavailable."""
        def __init__(self, app: F, x_for: int = 1, x_proto: int = 1) -> None:
            self.app = app

        def __call__(self, environ: dict, start_response: Any) -> Any:
            return self.app(environ, start_response)

# --------------------------------------------------------------------------- #
# Configuration Constants
# --------------------------------------------------------------------------- #

DEFAULT_CONFIG: Dict[str, Any] = {
    "ENV": "production",
    "DEBUG": False,
    "TESTING": False,
    "SECRET_KEY": os.getenv("FLASK_SECRET_KEY", "change-me-in-production"),
    "SQLALCHEMY_DATABASE_URI": os.getenv("DATABASE_URL", "sqlite:///rules.db"),
    "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    "DATA_DIR": os.getenv("DATA_DIR", "instance/data"),
    "LOG_DIR": os.getenv("LOG_DIR", "instance/logs"),
    "MAX_CONTENT_LENGTH": 30 * 1024 * 1024,  # 30 MB
    "VERSION": "1.0.0",
    "TEMPLATES_AUTO_RELOAD": True,
}

# --------------------------------------------------------------------------- #
# Application Factory
# --------------------------------------------------------------------------- #

def create_app(test_config: Optional[Dict[str, Any]] = None, **overrides: Any) -> F:
    """Create and configure the Flask application.
    
    Args:
        test_config: Configuration dictionary for testing
        overrides: Additional configuration overrides
    
    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__, instance_relative_config=True)
    
    # Configuration loading order:
    # 1. Default configuration
    # 2. Instance configuration (config.py)
    # 3. test_config (if provided)
    # 4. Runtime overrides
    _load_configuration(app, test_config, **overrides)
    
    # Ensure required directories exist
    _ensure_directories(app)
    
    # Initialize core functionality
    _configure_logging(app)
    _init_extensions(app)
    _register_blueprints(app)
    _register_error_handlers(app)
    _init_security(app)
    _init_template_helpers(app)
    _register_cli(app)
    
    # Configure for reverse proxy if in production
    if app.env == "production":
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)  # type: ignore
    
    return app

# --------------------------------------------------------------------------- #
# Configuration Helpers
# --------------------------------------------------------------------------- #

def _load_configuration(
    app: F,
    test_config: Optional[Dict[str, Any]] = None,
    **overrides: Any
) -> None:
    """Load configuration in priority order."""
    app.config.from_mapping(DEFAULT_CONFIG)
    
    # Load instance config if it exists
    instance_path = Path(app.instance_path)
    config_file = instance_path / "config.py"
    if config_file.exists():
        app.config.from_pyfile(str(config_file))
    
    # Apply test config if provided
    if test_config:
        app.config.from_mapping(test_config)
    
    # Apply runtime overrides
    if overrides:
        app.config.from_mapping(overrides)
    
    # Set dynamic paths
    app.config.setdefault(
        "UPLOAD_FOLDER",
        str(instance_path / "uploads")
    )
    app.config.setdefault(
        "DIAGRAMS_FOLDER",
        str(instance_path / "diagrams")
    )

# --------------------------------------------------------------------------- #
# Core Initialization Functions
# --------------------------------------------------------------------------- #

def _ensure_directories(app: F) -> None:
    """Create required directories if they don't exist."""
    for key in ("DATA_DIR", "LOG_DIR", "UPLOAD_FOLDER", "DIAGRAMS_FOLDER"):
        Path(app.config[key]).mkdir(parents=True, exist_ok=True)

def _configure_logging(app: F) -> None:
    """Configure production-ready logging."""
    log_dir = Path(app.config["LOG_DIR"])
    log_file = log_dir / "app.log"
    
    # Create file handler with rotation
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=1_000_000,
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(logging.Formatter(
        "%(asctime)s %(levelname)-8s [%(name)s:%(lineno)d] %(message)s"
    ))
    
    # Set log level based on environment
    log_level = logging.DEBUG if app.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        handlers=[file_handler, logging.StreamHandler(sys.stdout)],
        force=True
    )
    
    # Reduce SQLAlchemy log noise
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.DEBUG if app.debug else logging.WARNING
    )
    
    app.logger.info("Application logging configured: %s", log_file)

def _init_extensions(app: F) -> None:
    """Initialize Flask extensions."""
    try:
        from extensions import db, login_manager, migrate
        
        db.init_app(app)
        migrate.init_app(app, db)
        login_manager.init_app(app)
        
        app.extensions["sqlalchemy"] = db
        app.logger.debug("Database extensions initialized")
        
    except ImportError as e:
        app.logger.warning("Extension initialization failed: %s", e)

# ... [rest of the helper functions with similar improvements] ...

# --------------------------------------------------------------------------- #
# Runtime Application
# --------------------------------------------------------------------------- #

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)