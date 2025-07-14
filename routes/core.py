# Combined route definitions in one module

from __future__ import annotations

import os
import json
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import (
    Blueprint,
    jsonify,
    current_app,
    send_file,
    render_template,
    abort,
    request,
    redirect,
    url_for,
    flash,
)
from werkzeug.utils import secure_filename

from config import Config
from utils import (
    allowed_file,
    load_and_sanitize_json,
    ensure_directory_exists,
    generate_files,
    log_activity,
    get_current_user,
    get_rule_stats,
    get_activity_trend,
)

# ---------------------------------------------------------------------------
# Blueprints
# ---------------------------------------------------------------------------

api = Blueprint("api", __name__)
analytics_routes = Blueprint("analytics_routes", __name__)
collab = Blueprint("collab", __name__)
diagrams = Blueprint("diagrams", __name__)
main = Blueprint("main", __name__)
auth = Blueprint("auth", __name__)
upload = Blueprint("upload", __name__)
user_routes = Blueprint("user_routes", __name__)

# ---------------------------------------------------------------------------
# API blueprint
# ---------------------------------------------------------------------------


@api.route("/api/catalog_names")
def catalog_names():
    """Return available catalog names."""
    try:
        names = ["Catalog1", "Catalog2", "Catalog3"]
        return jsonify(names)
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error("Catalog names error: %s", exc)
        return jsonify(error="Failed to fetch names"), 500


# ---------------------------------------------------------------------------
# Analytics blueprint
# ---------------------------------------------------------------------------


@analytics_routes.route("/api/stats")
def get_stats():
    """Return accurate counts of diagrams and rules."""
    try:
        diagrams_dir = current_app.config.get("DIAGRAMS_FOLDER", "./diagrams")
        diagrams_count = 0
        rules_count = 0

        if os.path.exists(diagrams_dir):
            diagrams_count = sum(
                1
                for _root, _dirs, files in os.walk(diagrams_dir)
                for file in files
                if file.endswith(".mmd")
            )
            for root, _dirs, files in os.walk(diagrams_dir):
                for file in files:
                    if file.endswith(".json"):
                        with open(os.path.join(root, file), "r") as f:
                            data = json.load(f)
                            if isinstance(data, list):
                                rules_count += len(data)
                            elif isinstance(data, dict):
                                rules_count += len(data.get("rules", []))

        return jsonify(
            {
                "diagramsProcessed": diagrams_count,
                "rulesExtracted": rules_count,
                "status": "success",
            }
        )

    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Stats error: {exc}")
        return (
            jsonify({"status": "error", "message": "Could not calculate statistics"}),
            500,
        )


def get_advanced_stats():
    """Return business metrics tracked in a JSON file."""
    try:
        json_path = os.path.join(current_app.root_path, "data", "advanced_stats.json")
        if not os.path.exists(json_path):
            stats = {
                "rules_by_status": {"active": 0, "draft": 0, "deprecated": 0},
                "recent_changes": 0,
                "validation_errors": 0,
                "active_domain": "N/A",
            }
            os.makedirs(os.path.dirname(json_path), exist_ok=True)
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(stats, f)
        else:
            with open(json_path, "r", encoding="utf-8") as f:
                stats = json.load(f)
        return jsonify(stats)
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Advanced stats error: {exc}")
        return jsonify({"error": str(exc)}), 500


def get_activity():
    """Return the raw activity log file."""
    Config.ensure_data_dir()
    try:
        return send_file(
            Config.ACTIVITY_LOG,
            mimetype="application/json",
            as_attachment=False,
        )
    except FileNotFoundError:
        return jsonify({"error": "Activity log not found"}), 404


def get_activity_stats():
    """Return comprehensive activity statistics with accurate counting."""
    try:
        Config.ensure_data_dir()
        stats = {
            "status_counts": {"active": 0, "draft": 0, "deprecated": 0},
            "recent_activity": {
                "total": 0,
                "creations": 0,
                "updates": 0,
                "deletions": 0,
            },
            "top_contributor": {"user": "None", "actions": 0},
        }
        try:
            with open(Config.ACTIVITY_LOG, "r") as f:
                data = json.load(f)
                for rule in data.get("rules", {}).values():
                    status = rule.get("status", "draft").lower()
                    if status in stats["status_counts"]:
                        stats["status_counts"][status] += 1
                user_actions = defaultdict(int)
                week_ago = datetime.utcnow() - timedelta(days=7)
                for entry in data.get("activity_log", []):
                    try:
                        user = entry.get("user", "anonymous")
                        user_actions[user] += 1
                        action = entry.get("action", "").lower()
                        if "create" in action:
                            stats["recent_activity"]["creations"] += 1
                        elif "delete" in action:
                            stats["recent_activity"]["deletions"] += 1
                        elif "update" in action:
                            stats["recent_activity"]["updates"] += 1
                        entry_time = datetime.fromisoformat(entry["timestamp"])
                        if entry_time >= week_ago:
                            stats["recent_activity"]["total"] += 1
                    except Exception as exc:  # pragma: no cover - skip invalid entries
                        current_app.logger.warning(f"Skipping invalid entry: {exc}")
                        continue
                if user_actions:
                    top_user, top_actions = max(user_actions.items(), key=lambda x: x[1])
                    stats["top_contributor"] = {
                        "user": top_user,
                        "actions": top_actions,
                    }
        except (FileNotFoundError, json.JSONDecodeError) as exc:
            current_app.logger.error(f"Activity log error: {exc}")
        return jsonify(stats)
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Stats generation failed: {exc}")
        return jsonify({"error": str(exc)}), 500


def update_rule(rule_id):
    """Example rule update endpoint that logs an activity entry."""
    try:
        log_activity(
            action="update",
            rule_id=rule_id,
            user=get_current_user(),
            details=f"Updated rule {rule_id}",
        )
        return jsonify({"success": True})
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Rule update error: {exc}")
        return jsonify({"error": str(exc)}), 500


def test_log_activity():
    """Test endpoint to verify activity logging."""
    try:
        log_activity(
            action="test",
            rule_id="test_rule_123",
            user="tester",
            details="Test activity logging",
        )
        return jsonify({"status": "success", "message": "Activity logged"})
    except Exception as exc:  # pragma: no cover - unexpected errors
        return jsonify({"status": "error", "message": str(exc)}), 500


def test_view_activity_log():
    """Test endpoint to view raw activity log."""
    try:
        Config.ensure_data_dir()
        with open(Config.ACTIVITY_LOG, "r") as f:
            return jsonify(json.load(f))
    except Exception as exc:  # pragma: no cover - unexpected errors
        return jsonify({"error": str(exc)}), 500


def force_log_activity():
    """Force log a test activity."""
    try:
        log_activity(
            action="test_action",
            rule_id="test_rule_123",
            user="test_user",
            details="Test activity entry",
        )
        return jsonify({"status": "success", "message": "Test activity logged"})
    except Exception as exc:  # pragma: no cover - unexpected errors
        return jsonify({"status": "error", "message": str(exc)}), 500


@api.route("/api/metrics")
def metrics():
    """Return dashboard metrics for the main page."""
    try:
        data = {
            "diagramCount": 75,
            "rulesExtractedCount": 65,
            "rulesStatusChart": 80,
            "recentChangesCount": 50,
        }
        return jsonify(data)
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error("Metrics API error: %s", exc)
        return jsonify(error="Failed to fetch metrics"), 500



# ---------------------------------------------------------------------------
# Collaboration blueprint
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# FAQ route (simple route)
# ---------------------------------------------------------------------------

@collab.route("/faq")
def faq_page():
    """Display the FAQ page."""
    try:
        return render_template("faq.html")
    except Exception as exc:
        current_app.logger.error("FAQ page error: %s", exc)
        abort(500)


# ---------------------------------------------------------------------------
# Diagrams blueprint
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Main blueprint
# ---------------------------------------------------------------------------


@main.route("/")
def index():
    """Render the application home page."""
    try:
        stats = get_rule_stats()
        trend = get_activity_trend(days=30)
        return render_template("index.html", stats=stats, charts={"rules": trend})
    except Exception as exc:
        current_app.logger.error("Index page error: %s", exc)
        abort(500)


@main.route("/catalog")
def catalog():
    """Display the diagram catalog."""
    try:
        return render_template("catalog.html")
    except Exception as exc:
        current_app.logger.error("Catalog page error: %s", exc)
        abort(500)


@main.route("/search")
def search():
    """Display the search page."""
    try:
        return render_template("search.html")
    except Exception as exc:
        current_app.logger.error("Search page error: %s", exc)
        abort(500)


@main.route("/get-started")
def get_started():
    """Guide new users through the basic workflow."""
    try:
        return render_template("get_started.html")
    except Exception as exc:
        current_app.logger.error("Get Started page error: %s", exc)
        abort(500)


@main.route("/about")
def about():
    """Display project information and version."""
    try:
        version = current_app.config.get("VERSION", "1.0")
        return render_template("about.html", version=version)
    except Exception as exc:  # pragma: no cover
        current_app.logger.error("About page error: %s", exc)
        abort(500)


@main.route("/contact", methods=["GET", "POST"])
def contact():
    """Display the contact page and handle feedback submissions."""
    try:
        if request.method == "POST":
            data = {
                "name": request.form.get("name", "Anonymous"),
                "email": request.form.get("email", ""),
                "subject": request.form.get("subject", ""),
                "message": request.form.get("message", ""),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            feedback_path = Path(Config.FEEDBACK_FILE)
            ensure_directory_exists(feedback_path.parent)
            existing = []
            if feedback_path.exists():
                try:
                    existing = json.loads(feedback_path.read_text())
                except json.JSONDecodeError:
                    existing = []
            existing.append(data)
            feedback_path.write_text(json.dumps(existing, indent=2))
            flash("Thank you for your feedback!", "success")
            return redirect(url_for("main.contact"))

        return render_template("contact.html")
    except Exception as exc:  # pragma: no cover
        current_app.logger.error("Contact page error: %s", exc)
        abort(500)


@main.route("/markdown-notes")
def markdown_notes():
    """Show the Markdown Notes marketing page."""
    try:
        return render_template("markdown_notes.html")
    except Exception as exc:
        current_app.logger.error("Markdown Notes page error: %s", exc)
        abort(500)


@main.route("/bear-clone")
def bear_clone():
    """Render the Bear App clone page."""
    try:
        return render_template("bear_app_clone.html")
    except Exception as exc:
        current_app.logger.error("Bear clone page error: %s", exc)
        abort(500)


# ---------------------------------------------------------------------------
# Auth blueprint
# ---------------------------------------------------------------------------


@auth.route("/login", methods=["GET", "POST"])
def login():
    """Render the login page and handle submissions."""
    try:
        if request.method == "POST":
            flash("Logged in successfully!", "success")
            return redirect(url_for("main.index"))
        return render_template("auth/login.html")
    except Exception as exc:
        current_app.logger.error("Login route error: %s", exc)
        return jsonify(error="Login failure"), 500


@auth.route("/register", methods=["GET", "POST"])
def register():
    """Render the registration page and handle submissions."""
    try:
        if request.method == "POST":
            flash("Account created!", "success")
            return redirect(url_for("auth.login"))
        return render_template("auth/register.html")
    except Exception as exc:
        current_app.logger.error("Register route error: %s", exc)
        return jsonify(error="Registration failure"), 500


@auth.route("/logout")
def logout():
    """Log the user out and redirect to the login page."""
    try:
        flash("Logged out successfully!", "success")
        return redirect(url_for("auth.login"))
    except Exception as exc:
        current_app.logger.error("Logout route error: %s", exc)
        return jsonify(error="Logout failure"), 500


# ---------------------------------------------------------------------------
# Upload blueprint
# ---------------------------------------------------------------------------


@upload.route("/upload", methods=["GET", "POST"])
def upload_file():
    """Handle file uploads and generate diagrams."""

    if request.method == "GET":
        return render_template("upload.html", help_available=True)

    is_json = (
        request.accept_mimetypes["application/json"]
        > request.accept_mimetypes["text/html"]
    )

    if "file" not in request.files:
        msg = "No file provided"
        if is_json:
            return jsonify(success=False, message=msg), 400
        flash(msg, "error")
        return redirect(request.url)

    file = request.files["file"]
    if file.filename == "":
        msg = "No file selected"
        if is_json:
            return jsonify(success=False, message=msg), 400
        flash(msg, "error")
        return redirect(request.url)

    uploads_dir = current_app.config.get("UPLOAD_FOLDER", "./uploads")
    diagrams_dir = current_app.config.get("DIAGRAMS_FOLDER", "./diagrams")
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(diagrams_dir, exist_ok=True)

    processed_files: list[str] = []
    errors: list[str] = []

    try:
        if not allowed_file(file.filename):
            raise ValueError("Invalid file type")

        filename = secure_filename(file.filename)
        file_path = os.path.join(uploads_dir, filename)
        file.save(file_path)

        if filename.lower().endswith((".json", ".mmd")):
            diagrams_path = os.path.join(diagrams_dir, filename)
            os.replace(file_path, diagrams_path)
            file_path = diagrams_path

        json_data = load_and_sanitize_json(file_path)
        if not json_data:
            raise ValueError("Invalid JSON content")

        root_name = os.path.splitext(filename)[0]
        output_dir = os.path.join(diagrams_dir, root_name)
        ensure_directory_exists(output_dir)

        generate_files(json_data, output_dir)
        processed_files.append(filename)

    except (OSError, ValueError, json.JSONDecodeError) as e:
        errors.append(f"{file.filename}: {str(e)}")
        current_app.logger.error(f"Upload error: {file.filename} - {str(e)}")

    if errors:
        msg = "Some files failed to process: " + "; ".join(errors)
        if is_json:
            return (
                jsonify(success=False, message=msg, processed=processed_files, errors=errors),
                207,
            )
        flash(msg, "error")
        return redirect(request.url)

    msg = f"Processed {len(processed_files)} files successfully"
    if is_json:
        return jsonify(
            success=True,
            message=msg,
            processed=processed_files,
            redirect_url=url_for("main.catalog"),
        )
    flash(msg, "success")
    return redirect(url_for("main.catalog"))


# ---------------------------------------------------------------------------
# User blueprint
# ---------------------------------------------------------------------------


@user_routes.route("/profile")
def user_profile():
    """User profile page with activity and statistics."""
    try:
        user_data = {
            "username": "johndoe",
            "email": "john.doe@example.com",
            "avatar": url_for("static", filename="images/default-avatar.png"),
            "member_since": "2023-01-15",
            "last_login": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "role": "Administrator",
        }

        activity_stats = {
            "rules_created": 142,
            "diagrams_uploaded": 28,
            "api_calls": 1240,
            "recent_activity": [
                {
                    "action": "Uploaded rule set",
                    "timestamp": "2023-06-15 14:30",
                    "details": "Fraud Detection v2.1",
                },
                {
                    "action": "Extracted rules",
                    "timestamp": "2023-06-14 09:15",
                    "details": "From production dataset",
                },
                {
                    "action": "API Test",
                    "timestamp": "2023-06-12 16:45",
                    "details": "/rules/validate endpoint",
                },
            ],
        }

        return render_template(
            "profile.html",
            user=user_data,
            stats=activity_stats,
            help_available=True,
        )
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Profile error: {exc}")
        abort(500, "Error loading profile page")


@user_routes.route("/settings", methods=["GET", "POST"])
def user_settings():
    """User settings page with form handling."""
    try:
        user_data = {
            "display_name": "John Doe",
            "email": "john.doe@example.com",
            "avatar_url": url_for("static", filename="images/default-avatar.png"),
        }

        settings_data = {
            "theme": "dark",
            "timezone": "UTC",
            "email_notifications": True,
            "push_notifications": False,
            "inapp_notifications": True,
            "language": "en",
            "experimental_features": False,
            "font_size": "normal",
            "contrast": "normal",
            "motion": "normal",
        }

        settings_saved = False
        if request.method == "POST":
            settings_data.update(
                {
                    "theme": request.form.get("theme", "dark"),
                    "timezone": request.form.get("timezone", "UTC"),
                    "email_notifications": "email_notifications" in request.form,
                    "push_notifications": "push_notifications" in request.form,
                    "inapp_notifications": "inapp_notifications" in request.form,
                    "language": request.form.get("language", "en"),
                    "experimental_features": "experimental_features" in request.form,
                    "font_size": request.form.get("font_size", "normal"),
                    "contrast": request.form.get("contrast", "normal"),
                    "motion": request.form.get("motion", "normal"),
                }
            )
            flash("Settings updated successfully!", "success")
            settings_saved = True

        security_data = {
            "last_password_change": "2023-05-10",
            "two_factor_enabled": False,
            "active_sessions": [
                {
                    "ip": "192.168.1.100",
                    "browser": "Chrome",
                    "location": "New York",
                    "last_active": "10 minutes ago",
                },
            ],
        }

        return render_template(
            "settings.html",
            user=user_data,
            settings=settings_data,
            security=security_data,
            help_available=True,
            settings_saved=settings_saved,
        )
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Settings error: {exc}")
        abort(500, "Error loading settings page")


@user_routes.route("/settings.html", methods=["GET", "POST"])
def user_settings_html():
    """Alias for ``/settings`` that renders the same page."""
    return user_settings()


@user_routes.route("/api/profile")
def get_user_profile():
    """API endpoint for user profile data."""
    try:
        profile_data = {
            "username": "johndoe",
            "email": "john.doe@example.com",
            "avatar_url": url_for("static", filename="images/default-avatar.png"),
            "member_since": "2023-01-15",
            "role": "Administrator",
            "stats": {
                "rules_created": 142,
                "diagrams_uploaded": 28,
                "api_calls": 1240,
            },
        }
        return jsonify(profile_data)
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Profile API error: {exc}")
        return jsonify({"error": str(exc)}), 500
