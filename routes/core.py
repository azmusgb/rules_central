"""
Flask route configuration for Rules Central application.

This module organizes all application routes into logical blueprints with:
- Consistent error handling
- Type hints
- Comprehensive documentation
- Secure file uploads
- CSRF protection
- Structured API responses
All route handlers document inputs and outputs per the style guide in
``AGENTS.md``.
"""

from __future__ import annotations

import os
import json
import csv
import logging
from io import StringIO
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Union, Optional, Tuple

from flask import (
    Blueprint,
    jsonify,
    current_app,
    render_template,
    abort,
    request,
    redirect,
    url_for,
    flash,
    Response,
)
from werkzeug.exceptions import HTTPException
from werkzeug.utils import secure_filename
from werkzeug.wrappers import Response as WerkzeugResponse
from flask_wtf.csrf import generate_csrf

from flask_login import (
    login_required,
    login_user,
    logout_user,
    current_user,
)

from utils import (
    allowed_file,
    diagram_type_from_filename,
    ensure_directory_exists,
    generate_files,
    get_current_user,
    get_help_topics,
    get_snippet,
    load_and_sanitize_json,
    log_activity,
    verify_csrf_token,
    validate_email,
)

# Type aliases
JsonResponse = Dict[str, Union[str, int, bool, List, Dict]]
UploadResult = Dict[str, Union[bool, str, List[str]]]
RouteReturn = Union[str, WerkzeugResponse, JsonResponse]

# ---------------------------------------------------------------------------
# Blueprint Initialization
# ---------------------------------------------------------------------------

api = Blueprint("api", __name__, url_prefix="/api")
collab = Blueprint("collab", __name__, url_prefix="/collab")
diagrams = Blueprint("diagrams", __name__, url_prefix="/diagrams")

@diagrams.route("/")
def diagrams_index() -> str:
    """Redirect or render a page for /diagrams/ route."""
    try:
        # Redirect to /diagrams/diagram_converter
        from flask import redirect, url_for
        return redirect(url_for("diagrams.diagram_converter"))
    except Exception as e:
        current_app.logger.error(f"Diagrams index page error: {e}", exc_info=True)
        abort(500, description="Failed to load diagrams index page")

@diagrams.route("/diagram_converter")
def diagram_converter() -> str:
    """Render the diagram converter page."""
    try:
        return render_template("diagram_converter.html")
    except Exception as e:
        current_app.logger.error(f"Diagram converter page error: {e}", exc_info=True)
        abort(500, description="Failed to load diagram converter page")
main = Blueprint("main", __name__)

@main.route("/contact")
def contact() -> str:
    """Contact/support page placeholder."""
    try:
        return render_template("contact.html")
    except Exception as e:
        current_app.logger.error(f"Contact page error: {e}", exc_info=True)
        abort(500, description="Failed to load contact page")
auth = Blueprint("auth", __name__, url_prefix="/auth")

@auth.route("/register", methods=["GET", "POST"])
def register() -> str:
    """User registration page placeholder."""
    if request.method == "GET":
        return render_template("auth/register.html")
    # For POST, you can add registration logic here later
    return render_template("auth/register.html")
upload = Blueprint("upload", __name__, url_prefix="/upload")

user_routes = Blueprint("user", __name__, url_prefix="/user")

logger = logging.getLogger(__name__)


@user_routes.route("/profile")
@login_required
def profile() -> str:
    """Display the current user's profile page."""
    return render_template("profile.html", user=current_user)

# ---------------------------------------------------------------------------
# Template Helpers
# ---------------------------------------------------------------------------


@main.app_template_global("update_query_param")
def update_query_param(param: str, value: str | int) -> str:
    """Return query string with ``param`` updated to ``value``."""
    args = request.args.to_dict(flat=True)
    args[param] = str(value)
    from urllib.parse import urlencode

    return urlencode(args, doseq=True)


@main.app_template_global("remove_query_param")
def remove_query_param(*keys: str) -> str:
    """Return query string with ``keys`` removed."""
    args = request.args.to_dict(flat=True)
    for key in keys:
        args.pop(key, None)
    from urllib.parse import urlencode

    return urlencode(args, doseq=True)


@main.app_template_global("safe_startswith")
def safe_startswith(value: str, prefix: str) -> bool:
    """Template helper to check ``value`` starts with ``prefix`` safely."""
    return isinstance(value, str) and isinstance(prefix, str) and value.startswith(prefix)

# ---------------------------------------------------------------------------
# UI‑only pages (placeholders) — satisfy url_for("routes.*") references
# ---------------------------------------------------------------------------
ui_routes = Blueprint("routes", __name__)  # internal name must be "routes"

@ui_routes.route("/full_help")
def full_help() -> str:
    """Placeholder full help page."""
    try:
        return render_template("full_help.html")
    except Exception as e:
        current_app.logger.error(f"Full help page error: {e}", exc_info=True)
        abort(500, description="Failed to load full help page")

@ui_routes.route("/config")
def config_page() -> str:
    """Placeholder for the new‑rule wizard."""
    return "Config page (coming soon)"

@ui_routes.route("/activity")
def activity_page() -> str:
    """Placeholder activity log page."""
    return "Activity page (coming soon)"

@ui_routes.route("/help")
def help_page() -> str:
    """Placeholder docs hub used by the nav bar."""
    return "Documentation hub (coming soon)"

# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def handle_api_error(error: Exception, message: str) -> Tuple[JsonResponse, int]:
    """Standard error handler for API routes."""
    current_app.logger.error(f"{message}: {error}", exc_info=True)
    return (
        jsonify({
            "status": "error", 
            "message": message,
            "error": str(error)
        }),
        500
    )

def validate_upload_file(file) -> Optional[str]:
    """Validate an uploaded file."""
    if not file or file.filename == "":
        return "No file selected"
    if not allowed_file(file.filename):
        return "Invalid file type"
    return None

def save_uploaded_file(file, upload_dir: Path) -> Path:
    """Securely save an uploaded file."""
    filename = secure_filename(file.filename)
    file_path = upload_dir / filename
    file.save(file_path)
    return file_path

# ---------------------------------------------------------------------------
# Metrics Fallback Helpers
# ---------------------------------------------------------------------------

def get_rule_stats() -> Dict[str, int]:
    """Return empty rule statistics as a placeholder."""
    return {}


def get_activity_trend(days: int = 30) -> List[Dict[str, int]]:
    """Return empty activity trend data as a placeholder."""
    return []


def get_featured_diagrams(limit: int = 3) -> List[Dict[str, Any]]:
    """Return an empty list of featured diagrams as a placeholder."""
    return []

# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@api.route("/catalog_names")
def catalog_names() -> Tuple[JsonResponse, int]:
    """Return catalog names discovered under ``DIAGRAMS_FOLDER``."""
    try:
        diagrams_dir = Path(current_app.config["DIAGRAMS_FOLDER"])
        if not diagrams_dir.exists():
            return jsonify({"error": "Diagrams directory not found"}), 404

        names = {
            root.name.split("_")[0] for root in diagrams_dir.iterdir() if root.is_dir()
        }
        sorted_names = sorted(names)
        return jsonify(sorted_names), 200
    except Exception as e:
        logger.exception("Error getting catalog names")
        return jsonify({"error": "Server error generating catalog names"}), 500

@api.route("/metrics")
def metrics() -> Tuple[JsonResponse, int]:
    """Get dashboard metrics.
    
    Returns:
        JSON response with metrics data or error message
    """
    try:
        stats = get_rule_stats()
        trend = get_activity_trend(days=30)
        
        return (
            jsonify({
                "status": "success",
                "data": {
                    "diagramCount": stats.get("diagrams", 0),
                    "rulesExtractedCount": stats.get("rules", 0),
                    "rulesStatusChart": trend,
                    "recentChangesCount": stats.get("recent_changes", 0)
                }
            }),
            200
        )
    except Exception as e:
        return handle_api_error(e, "Failed to fetch metrics")


@api.route("/diagram_catalogs")
def diagram_catalogs() -> Tuple[Response, int]:
    """Return structured catalog of available diagrams."""
    try:
        diagrams_dir = Path(current_app.config["DIAGRAMS_FOLDER"])
        if not diagrams_dir.exists():
            logger.error("Diagrams directory not found: %s", diagrams_dir)
            return jsonify({"error": "Diagrams directory not found"}), 404

        catalogs = []
        for root_dir in diagrams_dir.iterdir():
            if not root_dir.is_dir():
                continue

            entries = []
            for file in root_dir.glob("*.mmd"):
                json_file = file.with_suffix(".json")
                if json_file.exists():
                    entries.append(
                        {
                            "root": root_dir.name,
                            "diagram": file.name,
                            "hierarchy": json_file.name,
                            "type": diagram_type_from_filename(file.name),
                        }
                    )

            if entries:
                category_parts = root_dir.name.split("_", 1)
                category = category_parts[0] if len(category_parts) > 0 else "General"
                subgroup = category_parts[1] if len(category_parts) > 1 else "General"
                catalogs.append({"category": f"{category}_{subgroup}", "entries": entries})

        response = jsonify(catalogs)
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        return response, 200
    except Exception as e:
        logger.exception("Error generating diagram catalog")
        return jsonify({"error": "Server error generating catalog"}), 500


@api.route("/search_diagrams")
def search_diagrams() -> Tuple[Response, int]:
    """Search diagrams with filtering and pagination."""
    try:
        query = request.args.get("q", "").lower().strip()
        catalog_filter = request.args.get("catalog", "").strip()
        diagram_type_filter = request.args.get("type", "").strip()
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(50, max(1, int(request.args.get("per_page", 9))))

        diagrams_dir = Path(current_app.config["DIAGRAMS_FOLDER"])
        if not diagrams_dir.exists():
            return jsonify({"error": "Diagrams directory not found"}), 404

        results = []
        for root_dir in diagrams_dir.iterdir():
            if not root_dir.is_dir():
                continue

            base_catalog = root_dir.name.split("_")[0]
            if catalog_filter and base_catalog.lower() != catalog_filter.lower():
                continue

            for mmd_file in root_dir.glob("*.mmd"):
                file_type = diagram_type_from_filename(mmd_file.name)
                if (
                    diagram_type_filter
                    and file_type
                    and file_type.lower() != diagram_type_filter.lower()
                ):
                    continue

                try:
                    content = mmd_file.read_text(encoding="utf-8").lower()
                except Exception as e:
                    logger.warning("Error reading %s: %s", mmd_file, e)
                    continue

                if not query or query in mmd_file.name.lower() or query in content:
                    results.append(
                        {
                            "filename": mmd_file.name,
                            "catalog": root_dir.name,
                            "type": file_type,
                            "size": mmd_file.stat().st_size,
                            "last_modified": mmd_file.stat().st_mtime,
                            "match_snippet": get_snippet(content, query) if query else "",
                        }
                    )

        total = len(results)
        start = (page - 1) * per_page
        paginated = results[start : start + per_page]

        return jsonify({"total": total, "page": page, "per_page": per_page, "results": paginated}), 200
    except ValueError:
        return jsonify({"error": "Invalid search parameter"}), 400
    except Exception as e:
        logger.exception("Error during search")
        return jsonify({"error": "Server error during search"}), 500


@api.route("/help/<page>")
def get_help_content(page: str) -> Tuple[Response, int]:
    """Return help file content for ``page``."""
    try:
        safe_page = secure_filename(page)
        help_file = Path(current_app.root_path) / "static" / "help" / f"{safe_page}.md"
        if not help_file.exists():
            return jsonify({"error": "Help topic not found"}), 404
        content = help_file.read_text(encoding="utf-8")
        return jsonify({"content": content}), 200
    except Exception:
        logger.exception("Error retrieving help content")
        return jsonify({"error": "Server error"}), 500

# ---------------------------------------------------------------------------
# File Upload Routes
# ---------------------------------------------------------------------------

@upload.route("/", methods=["GET", "POST"])
def upload_file() -> RouteReturn:
    """Handle file uploads.
    
    GET: Render upload form
    POST: Process file upload
    
    Returns:
        HTML response or JSON response based on Accept header
    """
    if request.method == "GET":
        return render_template(
            "upload.html",
            csrf_token=generate_csrf_token()
        )
    
    # Check if client prefers JSON response
    is_json = request.accept_mimetypes["application/json"] > request.accept_mimetypes["text/html"]
    
    # Validate request
    if "file" not in request.files:
        error = "No file provided"
        return handle_upload_response(error, is_json, 400)
        
    file = request.files["file"]
    if error := validate_upload_file(file):
        return handle_upload_response(error, is_json, 400)
        
    if not verify_csrf_token(request.form.get("csrf_token")):
        return handle_upload_response("Invalid CSRF token", is_json, 403)
    
    # Process upload
    try:
        uploads_dir = Path(current_app.config["UPLOAD_FOLDER"])
        diagrams_dir = Path(current_app.config["DIAGRAMS_FOLDER"])
        
        uploads_dir.mkdir(exist_ok=True, parents=True)
        diagrams_dir.mkdir(exist_ok=True, parents=True)
        
        file_path = save_uploaded_file(file, uploads_dir)
        
        # Process JSON/Mermaid files
        if file_path.suffix.lower() in (".json", ".mmd"):
            diagrams_path = diagrams_dir / file_path.name
            file_path.replace(diagrams_path)
            file_path = diagrams_path
            
        json_data = load_and_sanitize_json(file_path)
        if not json_data:
            raise ValueError("Invalid file content")
            
        # Generate output files
        output_dir = diagrams_dir / file_path.stem
        output_dir.mkdir(exist_ok=True)
        generate_files(json_data, output_dir)
        
        log_activity(
            action="upload",
            user=get_current_user(),
            details=f"Uploaded {file_path.name}"
        )
        
        return handle_upload_response(
            f"Processed {file_path.name} successfully",
            is_json,
            redirect_url=url_for("main.catalog")
        )
        
    except (OSError, ValueError, json.JSONDecodeError) as e:
        current_app.logger.error(f"Upload error: {e}", exc_info=True)
        return handle_upload_response(str(e), is_json, 400)
    except Exception as e:
        current_app.logger.error(f"Unexpected upload error: {e}", exc_info=True)
        return handle_upload_response("An unexpected error occurred", is_json, 500)

def handle_upload_response(
    message: str,
    is_json: bool,
    status_code: int = 200,
    redirect_url: Optional[str] = None
) -> RouteReturn:
    """Create consistent upload responses."""
    if is_json:
        return (
            jsonify({
                "success": status_code == 200,
                "message": message,
                "redirect_url": redirect_url
            }),
            status_code
        )
    
    if status_code >= 400:
        flash(message, "error")
    else:
        flash(message, "success")
        
    return redirect(redirect_url or url_for("upload.upload_file"))

# ---------------------------------------------------------------------------
# Authentication Routes
# ---------------------------------------------------------------------------

@auth.route("/login", methods=["GET", "POST"])
def login() -> RouteReturn:
    """Handle user login.
    
    GET: Render login form
    POST: Process login credentials
    
    Returns:
        HTML response or redirect
    """
    if request.method == "GET":
        return render_template("auth/login.html")
    
    try:
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()
        
        if not all([email, password]):
            flash("Please fill all required fields", "error")
        elif not validate_email(email):
            flash("Please enter a valid email address", "error")
        else:
            user = authenticate_user(email, password)
            if user:
                login_user(user)
                flash("Logged in successfully!", "success")
                return redirect(url_for("main.index"))
            flash("Invalid email or password", "error")
            
        return render_template("auth/login.html")
    except Exception as e:
        current_app.logger.error(f"Login error: {e}", exc_info=True)
        abort(500, description="Failed to process login")


@auth.route("/logout")
@login_required
def logout() -> RouteReturn:
    """Log out the current user."""
    logout_user()
    flash("You are logged out.", "success")
    return redirect(url_for("main.index"))

# [Additional routes with similar improvements...]

# ---------------------------------------------------------------------------
# Main Application Routes
# ---------------------------------------------------------------------------

@main.route("/")
def index() -> str:
    """Render the application home page with the polished dashboard.

    Includes floating navigation widgets for improved usability.

    Returns:
        Rendered template
    """
    try:
        stats = get_rule_stats()
        trend = get_activity_trend(days=30)
        return render_template(
            "dashboard.html",
            stats=stats,
            charts={"rules": trend},
            featured_diagrams=get_featured_diagrams(limit=3)
        )
    except Exception as e:
        current_app.logger.error(f"Index page error: {e}", exc_info=True)
        abort(500, description="Failed to load home page")


@main.route("/catalog")
def catalog() -> str:
    """Display the diagram catalog page."""
    try:
        return render_template("catalog.html")
    except Exception as e:
        current_app.logger.error(f"Catalog page error: {e}", exc_info=True)
        abort(500, description="Failed to load catalog")


@main.route("/view_diagram")
def view_diagram() -> str:
    """Render an individual diagram viewer."""
    root_name = request.args.get("root_name")
    diagram_name = request.args.get("diagram_name") or request.args.get("diagramName")

    if not root_name or not diagram_name:
        abort(400, "Missing required parameters")

    try:
        safe_root = secure_filename(root_name)
        safe_file = secure_filename(diagram_name)
        diagram_path = Path(current_app.config["DIAGRAMS_FOLDER"]) / safe_root / safe_file

        if not diagram_path.exists():
            available = []
            dir_path = diagram_path.parent
            if dir_path.exists():
                available = [f.name for f in dir_path.iterdir()]
            logger.error("Diagram not found. Requested: %s, Available: %s", safe_file, available)
            abort(404, "Diagram file not found")

        mermaid_code = diagram_path.read_text(encoding="utf-8")
        return render_template(
            "diagram_viewer.html",
            root_name=safe_root,
            diagram_name=safe_file,
            mermaid_code=mermaid_code,
            help_available=True,
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error loading diagram viewer")
        abort(500, "Error loading diagram viewer")
@main.route("/search")
def search() -> str:
    """Display the search page."""
    try:
        return render_template("search.html")
    except Exception as e:
        current_app.logger.error(f"Search page error: {e}", exc_info=True)
        abort(500, description="Failed to load search page")



# ---------------------------------------------------------------------------
# Context Processors
# ---------------------------------------------------------------------------

@main.app_context_processor
def inject_globals() -> Dict[str, Any]:
    """Inject global variables into templates."""
    return {
        'now': datetime.now,
        'app_name': current_app.config.get('APP_NAME', 'Rules Central'),
        'version': current_app.config.get('VERSION', '1.0'),
        'current_year': datetime.now().year
    }

@main.app_context_processor
def inject_main_blueprint() -> dict:
    """Inject the 'main' blueprint into templates."""
    return {"main": main}

def generate_csrf_token() -> str:
    """Return a CSRF token for use in routes and templates."""
    return generate_csrf()
