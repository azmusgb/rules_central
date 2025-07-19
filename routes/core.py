from __future__ import annotations

import os
import json
import csv
from io import StringIO
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Union

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
)
from werkzeug.utils import secure_filename
from werkzeug.wrappers import Response

from utils import (
    allowed_file,
    load_and_sanitize_json,
    generate_files,
    log_activity,
    get_current_user,
    get_rule_stats,
    get_activity_trend,
    get_featured_diagrams,
    generate_csrf_token,
    verify_csrf_token,
)

# ---------------------------------------------------------------------------
# Ensure get_diagram_categories is always defined
# ---------------------------------------------------------------------------
def _stub_diagram_categories() -> list:  # type: ignore
    """Fallback stub used until real get_diagram_categories is imported."""
    return []

# Pre‑define the name with the stub so downstream references never raise
get_diagram_categories = _stub_diagram_categories  # type: ignore

# ---------------------------------------------------------------------------
# Optional utility imports
# ---------------------------------------------------------------------------
# get_diagram_categories is optional; fall back to an empty list supplier
try:
    from utils import get_diagram_categories  # type: ignore
except (ImportError, AttributeError):
    def get_diagram_categories() -> list:  # type: ignore
        """Return an empty list when utils.get_diagram_categories is absent."""
        return []


# ---------------------------------------------------------------------------
# Type Aliases
# ---------------------------------------------------------------------------
JsonResponse = Dict[str, Union[str, int, bool, List, Dict]]
UploadResult = Dict[str, Union[bool, str, List[str]]]

# ---------------------------------------------------------------------------
# Blueprints
# ---------------------------------------------------------------------------

api = Blueprint("api", __name__, url_prefix="/api")
analytics_routes = Blueprint("analytics", __name__, url_prefix="/analytics")
collab = Blueprint("collab", __name__, url_prefix="/collab")
diagrams = Blueprint("diagrams", __name__, url_prefix="/diagrams")
main = Blueprint("main", __name__)
auth = Blueprint("auth", __name__, url_prefix="/auth")
upload = Blueprint("upload", __name__, url_prefix="/upload")
user_routes = Blueprint("user", __name__, url_prefix="/user")

# ---------------------------------------------------------------------------
# Template context processors
# ---------------------------------------------------------------------------

@main.app_context_processor
def inject_globals() -> Dict[str, Any]:
    """Inject global variables and functions into templates."""
    return {
        'now': datetime.now,
        'app_name': current_app.config.get('APP_NAME', 'Rules Central'),
        'version': current_app.config.get('VERSION', '1.0'),
        'current_year': datetime.now().year
    }

# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@api.route("/catalog_names")
def catalog_names() -> Response:
    """Return available catalog names."""
    try:
        names = ["Business Rules", "Validation Rules", "Process Flows"]
        return jsonify({
            "status": "success",
            "data": names,
            "count": len(names)
        })
    except Exception as exc:
        current_app.logger.error(f"Catalog names error: {exc}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Failed to fetch catalog names"
        }), 500

@api.route("/metrics")
def metrics() -> Response:
    """Return dashboard metrics for the main page."""
    try:
        stats = get_rule_stats()
        trend = get_activity_trend(days=30)
        
        return jsonify({
            "status": "success",
            "data": {
                "diagramCount": stats.get("diagrams", 0),
                "rulesExtractedCount": stats.get("rules", 0),
                "rulesStatusChart": trend,
                "recentChangesCount": stats.get("recent_changes", 0)
            }
        })
    except Exception as exc:
        current_app.logger.error(f"Metrics API error: {exc}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Failed to fetch metrics"
        }), 500


# ---------------------------------------------------------------------------
# Export Search as CSV Route
# ---------------------------------------------------------------------------

@api.route("/search/export")
def export_search() -> Response:
    """
    Export search results as a CSV file.

    Expected query-string parameters mirror those used by the /search page
    (e.g., ?q=<search term>&status=active&status=draft).
    """
    try:
        # Query params
        query = request.args.get("q", "")
        # Re‑use existing perform_search helper so export matches UI
        results = perform_search(query) if query else []

        # Build CSV dynamically
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "title", "status", "description"])
        for r in results:
            writer.writerow([
                getattr(r, "id", ""),
                getattr(r, "title", "") or getattr(r, "name", ""),
                getattr(r, "status", ""),
                getattr(r, "description", "").replace("\n", " ")
            ])

        csv_data = output.getvalue().encode()

        return Response(
            csv_data,
            mimetype="text/csv",
            headers={
                "Content-Disposition":
                    f'attachment; filename="search_export_{datetime.now().strftime("%Y%m%d%H%M%S")}.csv"'
            }
        )
    except Exception as exc:
        current_app.logger.error(f"Export search error: {exc}", exc_info=True)
        return jsonify({"status": "error",
                        "message": "Failed to export search"}), 500

# ---------------------------------------------------------------------------
# Analytics Routes
# ---------------------------------------------------------------------------

@analytics_routes.route("/stats")
def get_stats() -> Response:
    """Return accurate counts of diagrams and rules."""
    try:
        stats = get_rule_stats()
        return jsonify({
            "status": "success",
            "data": stats
        })
    except Exception as exc:
        current_app.logger.error(f"Stats error: {exc}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Could not calculate statistics"
        }), 500

@analytics_routes.route("/advanced_stats")
def get_advanced_stats() -> Response:
    """Return business metrics tracked in a JSON file."""
    try:
        json_path = Path(current_app.root_path) / "data" / "advanced_stats.json"
        json_path.parent.mkdir(exist_ok=True)
        
        if not json_path.exists():
            stats = {
                "rules_by_status": {"active": 0, "draft": 0, "deprecated": 0},
                "recent_changes": 0,
                "validation_errors": 0,
                "active_domain": "N/A",
            }
            json_path.write_text(json.dumps(stats, indent=2))
            
        with json_path.open("r") as f:
            stats = json.load(f)
            
        return jsonify({
            "status": "success",
            "data": stats
        })
    except Exception as exc:
        current_app.logger.error(f"Advanced stats error: {exc}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(exc)
        }), 500

# ---------------------------------------------------------------------------
# Collaboration Routes
# ---------------------------------------------------------------------------

@collab.route("/faq")
def faq_page() -> str:
    """Display the FAQ page."""
    try:
        faq_items = [
            ("What is Rules Central?", "A platform for managing business rules..."),
            ("How do I upload diagrams?", "Use the upload page to...")
        ]
        return render_template("faq.html", faq_items=faq_items)
    except Exception as exc:
        current_app.logger.error(f"FAQ page error: {exc}", exc_info=True)
        abort(500, description="Failed to load FAQ page")

# ---------------------------------------------------------------------------
# Diagram Routes
# ---------------------------------------------------------------------------

@diagrams.route("/")
def diagrams_index() -> str:
    """Display the diagram viewer page."""
    try:
        return render_template("diagram_viewer.html")
    except Exception as exc:
        current_app.logger.error(f"Diagrams route error: {exc}", exc_info=True)
        abort(500, description="Failed to load diagram viewer")

@diagrams.route("/converter")
def diagram_converter() -> str:
    """Display the FormWorks to Mermaid converter tool."""
    try:
        return render_template("mermaid_converter.html")
    except Exception as exc:
        current_app.logger.error(f"Converter route error: {exc}", exc_info=True)
        abort(500, description="Failed to load converter tool")

# ---------------------------------------------------------------------------
# Main Application Routes
# ---------------------------------------------------------------------------

@main.route("/")
def index() -> str:
    """Render the application home page."""
    try:
        stats = get_rule_stats()
        trend = get_activity_trend(days=30)
        return render_template(
            "index.html",
            stats=stats,
            charts={"rules": trend},
            featured_diagrams=get_featured_diagrams(limit=3)
        )
    except Exception as exc:
        current_app.logger.error(f"Index page error: {exc}", exc_info=True)
        abort(500, description="Failed to load home page")
@main.route("/search")
def search() -> str:
    """Display the search page."""
    try:
        query = request.args.get("q", "")
        results = perform_search(query) if query else []

        try:
            export_url = url_for("api.export_search")
        except Exception:  # pragma: no cover - endpoint may not exist
            export_url = "/api/search/export"

        return render_template(
            "search.html",
            query=query,
            results=results,
            result_count=len(results),
            export_url=export_url,
        )
    except Exception as exc:
        current_app.logger.error(f"Search page error: {exc}", exc_info=True)
        abort(500, description="Failed to perform search")

@main.route("/about")
def about() -> str:
    """Display project information and version."""
    try:
        team_members = get_team_members()
        return render_template(
            "about.html",
            team=team_members,
            version=current_app.config.get("VERSION", "1.0")
        )
    except Exception as exc:
        current_app.logger.error(f"About page error: {exc}", exc_info=True)
        abort(500, description="Failed to load about page")

@main.route("/contact", methods=["GET", "POST"])
def contact() -> Union[str, Response]:
    """Handle contact form submissions."""
    try:
        if request.method == "POST":
            if not verify_csrf_token(request.form.get("csrf_token")):
                flash("Invalid CSRF token", "error")
                return redirect(url_for("main.contact"))
                
            name = request.form.get("name", "").strip()
            email = request.form.get("email", "").strip()
            message = request.form.get("message", "").strip()
            
            if not all([name, email, message]):
                flash("Please fill all required fields", "error")
            elif not validate_email(email):
                flash("Please enter a valid email address", "error")
            else:
                save_contact_request(name, email, message)
                send_contact_confirmation(email)
                flash("Thank you for your message! We'll get back to you soon.", "success")
                return redirect(url_for("main.contact"))
                
        return render_template("contact.html")
    except Exception as exc:
        current_app.logger.error(f"Contact page error: {exc}", exc_info=True)
        abort(500, description="Failed to process contact request")

# ---------------------------------------------------------------------------
# Authentication Routes
# ---------------------------------------------------------------------------

@auth.route("/login", methods=["GET", "POST"])
def login() -> Union[str, Response]:
    """Handle user login."""
    try:
        if request.method == "POST":
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
    except Exception as exc:
        current_app.logger.error(f"Login error: {exc}", exc_info=True)
        abort(500, description="Failed to process login")

@auth.route("/register", methods=["GET", "POST"])
def register() -> Union[str, Response]:
    """Handle user registration."""
    try:
        if request.method == "POST":
            email = request.form.get("email", "").strip()
            password = request.form.get("password", "").strip()
            confirm_password = request.form.get("confirm_password", "").strip()
            
            if not all([email, password, confirm_password]):
                flash("Please fill all required fields", "error")
            elif not validate_email(email):
                flash("Please enter a valid email address", "error")
            elif password != confirm_password:
                flash("Passwords do not match", "error")
            elif not validate_password(password):
                flash("Password must be at least 8 characters with numbers and symbols", "error")
            else:
                if create_user(email, password):
                    flash("Account created successfully! Please log in.", "success")
                    return redirect(url_for("auth.login"))
                flash("An account with this email already exists", "error")
                
        return render_template("auth/register.html")
    except Exception as exc:
        current_app.logger.error(f"Registration error: {exc}", exc_info=True)
        abort(500, description="Failed to process registration")

@auth.route("/logout")
def logout() -> Response:
    """Handle user logout."""
    try:
        logout_user()
        flash("Logged out successfully!", "success")
        return redirect(url_for("main.index"))
    except Exception as exc:
        current_app.logger.error(f"Logout error: {exc}", exc_info=True)
        abort(500, description="Failed to process logout")

# ---------------------------------------------------------------------------
# Upload Routes
# ---------------------------------------------------------------------------

@upload.route("/", methods=["GET", "POST"])
def upload_file() -> Union[str, Response, JsonResponse]:
    """Handle file uploads and processing."""
    if request.method == "GET":
        return render_template("upload.html", csrf_token=generate_csrf_token())
    
    is_json = request.accept_mimetypes["application/json"] > request.accept_mimetypes["text/html"]
    
    # Validate request
    if "file" not in request.files:
        return handle_upload_error("No file provided", is_json)
        
    file = request.files["file"]
    if file.filename == "":
        return handle_upload_error("No file selected", is_json)
        
    if not verify_csrf_token(request.form.get("csrf_token")):
        return handle_upload_error("Invalid CSRF token", is_json, status_code=403)
    
    # Process upload
    try:
        uploads_dir = Path(current_app.config.get("UPLOAD_FOLDER", "./uploads"))
        diagrams_dir = Path(current_app.config.get("DIAGRAMS_FOLDER", "./diagrams"))
        
        uploads_dir.mkdir(exist_ok=True)
        diagrams_dir.mkdir(exist_ok=True)
        
        if not allowed_file(file.filename):
            raise ValueError("Invalid file type")
            
        filename = secure_filename(file.filename)
        file_path = uploads_dir / filename
        file.save(file_path)
        
        if filename.lower().endswith((".json", ".mmd")):
            diagrams_path = diagrams_dir / filename
            file_path.replace(diagrams_path)
            file_path = diagrams_path
            
        json_data = load_and_sanitize_json(file_path)
        if not json_data:
            raise ValueError("Invalid file content")
            
        root_name = file_path.stem
        output_dir = diagrams_dir / root_name
        output_dir.mkdir(exist_ok=True)
        
        generate_files(json_data, output_dir)
        
        log_activity(
            action="upload",
            user=get_current_user(),
            details=f"Uploaded {filename}"
        )
        
        result: UploadResult = {
            "success": True,
            "message": f"Processed {filename} successfully",
            "redirect_url": url_for("main.catalog")
        }
        
        return jsonify(result) if is_json else redirect(url_for("main.catalog"))
        
    except (OSError, ValueError, json.JSONDecodeError) as e:
        current_app.logger.error(f"Upload error: {str(e)}", exc_info=True)
        return handle_upload_error(str(e), is_json)
    except Exception as exc:
        current_app.logger.error(f"Unexpected upload error: {exc}", exc_info=True)
        return handle_upload_error("An unexpected error occurred", is_json)

def handle_upload_error(message: str, is_json: bool, status_code: int = 400) -> Union[Response, JsonResponse]:
    """Helper function to handle upload errors consistently."""
    if is_json:
        return jsonify({
            "success": False,
            "message": message
        }), status_code
    flash(message, "error")
    return redirect(url_for("upload.upload_file"))

# ---------------------------------------------------------------------------
# User Profile Routes
# ---------------------------------------------------------------------------

@user_routes.route("/profile")
def user_profile() -> str:
    """Display user profile page."""
    try:
        user = get_current_user()
        if not user:
            flash("Please log in to view your profile", "warning")
            return redirect(url_for("auth.login"))
            
        stats = get_user_stats(user.id)
        recent_activity = get_recent_activity(user.id, limit=5)
        
        return render_template(
            "profile.html",
            user=user,
            stats=stats,
            recent_activity=recent_activity
        )
    except Exception as exc:
        current_app.logger.error(f"Profile error: {exc}", exc_info=True)
        abort(500, description="Failed to load profile")

@user_routes.route("/settings", methods=["GET", "POST"])
def user_settings() -> Union[str, Response]:
    """Handle user settings updates."""
    try:
        user = get_current_user()
        if not user:
            flash("Please log in to access settings", "warning")
            return redirect(url_for("auth.login"))
            
        if request.method == "POST":
            if not verify_csrf_token(request.form.get("csrf_token")):
                flash("Invalid CSRF token", "error")
                return redirect(url_for("user.user_settings"))
                
            # Process settings updates
            update_user_settings(user.id, request.form)
            flash("Settings updated successfully!", "success")
            return redirect(url_for("user.user_settings"))
            
        settings = get_user_settings(user.id)
        security_info = get_security_info(user.id)
        
        return render_template(
            "settings.html",
            user=user,
            settings=settings,
            security=security_info,
            csrf_token=generate_csrf_token()
        )
    except Exception as exc:
        current_app.logger.error(f"Settings error: {exc}", exc_info=True)
        abort(500, description="Failed to process settings")

@user_routes.route("/api/profile")
def get_user_profile_api() -> JsonResponse:
    """API endpoint for user profile data."""
    try:
        user = get_current_user()
        if not user:
            return jsonify({
                "status": "error",
                "message": "Authentication required"
            }), 401
                
        return jsonify({
            "status": "success",
            "data": {
                "username": user.username,
                "email": user.email,
                "avatar_url": user.avatar_url,
                "member_since": user.created_at.isoformat(),
                "role": user.role,
                "stats": get_user_stats(user.id)
            }
        })
    except Exception as exc:
        current_app.logger.error(f"Profile API error: {exc}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(exc)
        }), 500
