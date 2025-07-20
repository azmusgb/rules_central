"""
Flask route configuration for Rules Central application.

This module organizes all application routes into logical blueprints with:
- Consistent error handling
- Type hints
- Comprehensive documentation
- Secure file uploads
- CSRF protection
- Structured API responses
"""

from __future__ import annotations

import os
import json
import csv
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
from werkzeug.utils import secure_filename
from werkzeug.wrappers import Response as WerkzeugResponse

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
main = Blueprint("main", __name__)
auth = Blueprint("auth", __name__, url_prefix="/auth")
upload = Blueprint("upload", __name__, url_prefix="/upload")
user = Blueprint("user", __name__, url_prefix="/user")

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
# API Routes
# ---------------------------------------------------------------------------

@api.route("/catalog_names")
def catalog_names() -> Tuple[JsonResponse, int]:
    """Get available catalog names.
    
    Returns:
        JSON response with catalog names or error message
    """
    try:
        names = ["Business Rules", "Validation Rules", "Process Flows"]
        return (
            jsonify({
                "status": "success",
                "data": names,
                "count": len(names)
            }),
            200
        )
    except Exception as e:
        return handle_api_error(e, "Failed to fetch catalog names")

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

# [Additional routes with similar improvements...]

# ---------------------------------------------------------------------------
# Main Application Routes
# ---------------------------------------------------------------------------

@main.route("/")
def index() -> str:
    """Render the application home page.
    
    Returns:
        Rendered template
    """
    try:
        stats = get_rule_stats()
        trend = get_activity_trend(days=30)
        return render_template(
            "index.html",
            stats=stats,
            charts={"rules": trend},
            featured_diagrams=get_featured_diagrams(limit=3)
        )
    except Exception as e:
        current_app.logger.error(f"Index page error: {e}", exc_info=True)
        abort(500, description="Failed to load home page")

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