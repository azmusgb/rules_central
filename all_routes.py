"""
Routes Configuration for Diagram Management System
Organized by functional areas with consistent error handling
"""

import os
import json
import logging
from flask import (
    Blueprint,
    request,
    render_template,
    jsonify,
    send_from_directory,
    abort,
    current_app,
    url_for,
    make_response,
)
from werkzeug.utils import secure_filename
from utils import (
    generate_files,
    allowed_file,
    ensure_directory_exists,
    load_and_sanitize_json,
    log_activity,
    diagram_type_from_filename,
    get_snippet,
    get_current_user,
    get_help_topics,
)
from urllib.parse import urlencode

LOGGER = logging.getLogger(__name__)

__all__ = ["routes_bp"]

# ------------------------------------------------------------------
# Blueprint setup
# ------------------------------------------------------------------
routes_bp = Blueprint("routes", __name__)

# ------------------------------------------------------------------
# Template helper functions
# ------------------------------------------------------------------


@routes_bp.app_template_global("update_query_param")
def update_query_param(param: str, value: str | int):
    """
    Return the current query string with *param* set to *value*.
    Usage in a Jinja template:
        href="?{{ update_query_param('page', 2) }}"
    """
    args = request.args.to_dict(flat=True)  # copy to avoid mutation
    args[param] = value
    return urlencode(args, doseq=True)



@routes_bp.app_template_global("remove_query_param")
def remove_query_param(*keys: str):
    """
    Return the current query string with the specified *keys* removed.
    Usage in a Jinja template:
        href="?{{ remove_query_param('sort', 'type') }}"
    """
    args = request.args.to_dict(flat=True)  # copy to avoid mutation
    for key in keys:
        args.pop(key, None)
    return urlencode(args, doseq=True)


# ------------------------------------------------------------------
# Safe str.startswith for template use
# ------------------------------------------------------------------
@routes_bp.app_template_global("safe_startswith")
def safe_startswith(value, prefix):
    """
    Safe wrapper around str.startswith that prevents the
    “startswith first arg must be str” TypeError when *prefix*
    is undefined or not a string.
    """
    if not isinstance(value, str):
        return False
    if not isinstance(prefix, str):
        return False
    return value.startswith(prefix)

# ------------------------------------------------------------------
# API ENDPOINTS
# ------------------------------------------------------------------


@routes_bp.route("/api/diagram_catalogs", methods=["GET"])
def get_diagram_catalogs():
    """
    Get a structured catalog of all available diagrams.
    """
    try:
        diagrams_dir = current_app.config.get("DIAGRAMS_FOLDER")
        current_app.logger.debug("Using DIAGRAMS_FOLDER: %s", diagrams_dir)

        if not diagrams_dir or not os.path.exists(diagrams_dir):
            current_app.logger.error("Diagrams directory not found: %s", diagrams_dir)
            return jsonify({"error": "Diagrams directory not found"}), 404

        catalogs = []
        # Iterate through each container directory in DIAGRAMS_FOLDER
        for root_name in os.listdir(diagrams_dir):
            root_path = os.path.join(diagrams_dir, root_name)
            if not os.path.isdir(root_path):
                current_app.logger.debug("Skipping non-directory: %s", root_path)
                continue

            try:
                current_files = os.listdir(root_path)
                current_app.logger.debug(
                    "Directory '%s' files: %s", root_name, current_files
                )
            except Exception as list_error:
                current_app.logger.error(
                    "Error listing directory %s: %s", root_path, list_error
                )
                continue

            entries = []
            # Check each file in the directory for a matching pair: .mmd and .json
            for filename in current_files:
                if filename.endswith(".mmd"):
                    json_file = filename.replace(".mmd", ".json")
                    json_file_path = os.path.join(root_path, json_file)
                    if os.path.exists(json_file_path):
                        entries.append(
                            {
                                "root": root_name,
                                "diagram": filename,
                                "hierarchy": json_file,
                                "type": diagram_type_from_filename(filename),
                            }
                        )
                    else:
                        current_app.logger.debug(
                            "JSON file %s not found in directory %s",
                            json_file,
                            root_name,
                        )

            if entries:
                parts = root_name.split("_")
                category = parts[0] if len(parts) > 1 else "General"
                subgroup = "_".join(parts[1:]) if len(parts) > 1 else "General"
                catalogs.append(
                    {"category": f"{category}_{subgroup}", "entries": entries}
                )

        current_app.logger.debug("Generated catalog: %s", catalogs)
        response = make_response(jsonify(catalogs))
        response.headers["Cache-Control"] = (
            "no-store, no-cache, must-revalidate, max-age=0"
        )
        return response

    except Exception as e:
        current_app.logger.error(
            "Error generating diagram catalog: %s", str(e), exc_info=True
        )
        return jsonify({"error": "Server error generating catalog"}), 500


@routes_bp.route("/api/catalog_names", methods=["GET"])
def get_catalog_names():
    """Get simple list of catalog names for filter dropdown"""
    try:
        diagrams_dir = current_app.config["DIAGRAMS_FOLDER"]
        if not os.path.exists(diagrams_dir):
            return jsonify({"error": "Diagrams directory not found"}), 404

        catalog_names = set()
        for root_name in os.listdir(diagrams_dir):
            root_path = os.path.join(diagrams_dir, root_name)
            if os.path.isdir(root_path):
                base_name = root_name.split("_")[0]
                catalog_names.add(base_name)

        return jsonify(sorted(list(catalog_names)))

    except Exception as e:
        current_app.logger.error(f"Catalog names error: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error generating catalog names"}), 500


@routes_bp.route("/api/search_diagrams", methods=["GET"])
def search_diagrams():
    """Search diagrams with improved filtering and pagination"""
    try:
        # Get and validate parameters
        query = request.args.get("q", "").lower().strip()
        catalog = request.args.get("catalog", "").strip()
        diagram_type = request.args.get("type", "").strip()
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(50, max(1, int(request.args.get("per_page", 9))))

        diagrams_dir = current_app.config["DIAGRAMS_FOLDER"]
        if not os.path.exists(diagrams_dir):
            return jsonify({"error": "Diagrams directory not found"}), 404

        results = []
        # Search through catalogs
        for root_name in os.listdir(diagrams_dir):
            root_path = os.path.join(diagrams_dir, root_name)
            if not os.path.isdir(root_path):
                continue

            base_catalog = root_name.split("_")[0]
            if catalog and base_catalog.lower() != catalog.lower():
                continue

            for filename in os.listdir(root_path):
                if not filename.endswith(".mmd"):
                    continue

                file_type = diagram_type_from_filename(filename)
                file_path = os.path.join(root_path, filename)
                if (
                    diagram_type
                    and file_type
                    and file_type.lower() != diagram_type.lower()
                ):
                    continue

                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read().lower()

                matches_query = (
                    not query or query in filename.lower() or query in content
                )
                if matches_query:
                    results.append(
                        {
                            "filename": filename,
                            "catalog": root_name,
                            "type": file_type,
                            "size": os.path.getsize(file_path),
                            "last_modified": os.path.getmtime(file_path),
                            "match_snippet": (
                                get_snippet(content, query) if query else ""
                            ),
                        }
                    )

        total_count = len(results)
        start_index = (page - 1) * per_page
        end_index = start_index + per_page
        paginated_results = results[start_index:end_index]

        return jsonify(
            {
                "total": total_count,
                "page": page,
                "per_page": per_page,
                "results": paginated_results,
            }
        )

    except Exception as e:
        current_app.logger.error(f"Search error: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error during search"}), 500


@routes_bp.route("/api/hierarchy/<root_name>/<diagram_name>")
def get_hierarchy_data(root_name, diagram_name):
    current_app.logger.info(
        f"DIAGRAMS_FOLDER is: {current_app.config.get('DIAGRAMS_FOLDER')}"
    )
    try:
        # Sanitize inputs
        safe_root = secure_filename(root_name)
        safe_file = secure_filename(diagram_name)
        if not safe_root or not safe_file:
            return jsonify({"error": "Invalid parameters"}), 400

        # Ensure filename ends with .json
        if not safe_file.endswith(".json"):
            safe_file += ".json"

        # Build full path
        diagrams_dir = current_app.config.get("DIAGRAMS_FOLDER")
        json_path = os.path.join(diagrams_dir, safe_root, safe_file)

        if not os.path.exists(json_path):
            current_app.logger.warning(f"Hierarchy not found: {json_path}")
            return jsonify({"error": "Hierarchy data not found"}), 404

        # Load and validate JSON
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Normalize to list
        if isinstance(data, dict):
            data = [data]
        elif not isinstance(data, list):
            return jsonify({"error": "Invalid hierarchy format"}), 400

        return jsonify(data)

    except json.JSONDecodeError as decode_err:
        current_app.logger.error(f"JSON decode error: {decode_err}")
        return jsonify({"error": "Malformed JSON"}), 400
    except Exception as e:
        current_app.logger.error(f"Unexpected hierarchy error: {e}", exc_info=True)
        return jsonify({"error": "Server error loading hierarchy"}), 500


@routes_bp.route("/diagrams/<root_name>/<path:diagram_name>")
def serve_diagram(root_name, diagram_name):
    """Serve diagram files with improved path handling"""
    try:
        safe_root = secure_filename(root_name)
        safe_file = secure_filename(os.path.basename(diagram_name))
        diagram_dir = os.path.join(current_app.config["DIAGRAMS_FOLDER"], safe_root)
        diagram_path = os.path.join(diagram_dir, safe_file)
        if not os.path.exists(diagram_path):
            current_app.logger.error("File not found: %s", diagram_path)
            available_files: list[str] = []
            if os.path.exists(diagram_dir):
                available_files = os.listdir(diagram_dir)
            return (
                jsonify(
                    {
                        "error": "File not found",
                        "requested": safe_file,
                        "available": available_files,
                    }
                ),
                404,
            )
        return send_from_directory(diagram_dir, safe_file)
    except Exception as e:
        current_app.logger.error(f"Error serving diagram: {str(e)}")
        abort(500, "Internal server error")


@routes_bp.route("/api/debug/files")
def debug_files():
    """Debug endpoint to list all available files"""
    try:
        diagrams_dir = current_app.config["DIAGRAMS_FOLDER"]
        if not os.path.exists(diagrams_dir):
            return jsonify({"error": "Diagrams directory not found"}), 404
        file_structure = {}
        for root_name in os.listdir(diagrams_dir):
            root_path = os.path.join(diagrams_dir, root_name)
            if os.path.isdir(root_path):
                file_structure[root_name] = os.listdir(root_path)
        return jsonify(
            {
                "diagrams_folder": diagrams_dir,
                "exists": os.path.exists(diagrams_dir),
                "files": file_structure,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes_bp.route("/api/diagrams/<root_name>/<diagram_name>")
def serve_diagram_file(root_name, diagram_name):
    """Serve raw diagram files (both .mmd and .json)"""
    try:
        safe_root = secure_filename(root_name)
        safe_file = secure_filename(diagram_name)
        dir_path = os.path.join(current_app.config["DIAGRAMS_FOLDER"], safe_root)
        if not os.path.exists(os.path.join(dir_path, safe_file)):
            return jsonify({"error": "Diagram file not found"}), 404
        return send_from_directory(dir_path, safe_file)
    except Exception as e:
        current_app.logger.error(f"File serve error: {str(e)}")
        abort(500, "Server error retrieving file")


# ================
# VIEW RENDERING
# ================


@routes_bp.route("/activity")
def activity():
    """Display recent activity logs."""
    return render_template("activity.html", help_available=True)


@routes_bp.route("/config")
def config_page():
    """Configuration view"""
    return render_template(
        "config.html", config=current_app.config, help_available=True
    )


# =============
# FILE OPERATIONS
# =============
@routes_bp.route("/upload", methods=["GET", "POST"])
def upload_file():
    """Handle file uploads, generate diagrams, and log the activity."""
    if request.method == "GET":
        return render_template("upload.html", help_available=True)

    if "files" not in request.files:
        return jsonify(success=False, message="No files provided"), 400

    files = request.files.getlist("files")
    if not files or any(f.filename == "" for f in files):
        return jsonify(success=False, message="Invalid file selection"), 400

    uploads_dir = current_app.config["UPLOAD_FOLDER"]
    diagrams_dir = current_app.config["DIAGRAMS_FOLDER"]
    ensure_directory_exists(uploads_dir)
    ensure_directory_exists(diagrams_dir)

    processed_files = []
    errors = []

    for file in files:
        try:
            if not allowed_file(file.filename):
                raise ValueError("Invalid file type")

            filename = secure_filename(file.filename)
            file_path = os.path.join(uploads_dir, filename)
            file.save(file_path)

            json_data = load_and_sanitize_json(file_path)
            if not json_data:
                raise ValueError("Invalid JSON content")

            root_name = os.path.splitext(filename)[0]
            output_dir = os.path.join(diagrams_dir, root_name)
            ensure_directory_exists(output_dir)

            generate_files(json_data, output_dir)
            processed_files.append(filename)

            log_activity(
                action="upload",
                rule_id=root_name,
                user=get_current_user(),
                details=f"Uploaded {filename}",
            )

        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
            current_app.logger.error(f"Upload error: {file.filename} - {str(e)}")

    if errors:
        return (
            jsonify(
                success=not bool(errors),
                message="Some files failed to process",
                processed=processed_files,
                errors=errors,
            ),
            207,
        )

    return jsonify(
        success=True,
        message=f"Processed {len(processed_files)} files",
        redirect_url=url_for("routes.catalog"),
    )


# ============
# APP ROUTES
# ============
@routes_bp.route("/config/config.json")
def serve_config():
    """Serve application configuration"""
    try:
        return send_from_directory("config", "config.json")
    except FileNotFoundError:
        abort(404, "Configuration not available")


@routes_bp.route("/api/logs")
def get_logs():
    """Retrieve application logs"""
    try:
        log_path = current_app.config.get("LOG_FILE", "error.log")
        if not os.path.exists(log_path):
            return "No log file found", 404
        with open(log_path, "r", encoding="utf-8") as log_file:
            return log_file.read(), 200, {"Content-Type": "text/plain"}
    except Exception as e:
        current_app.logger.error(f"Log retrieval error: {str(e)}")
        return str(e), 500


@routes_bp.route("/full-help")
def full_help():
    """Comprehensive help documentation"""
    return render_template(
        "documentation.html",
        version=current_app.config.get("VERSION", "1.0"),
        help_topics=get_help_topics(),
    )


@routes_bp.route("/faq")
def faq_page():
    """Frequently asked questions page."""
    return render_template("faq.html", version=current_app.config.get("VERSION", "1.0"))


@routes_bp.route("/api/help/<page>")
def get_help_content(page):
    """API endpoint for help content"""
    try:
        safe_page = secure_filename(page)
        help_file = os.path.join(
            current_app.root_path, "static", "help", f"{safe_page}.md"
        )
        if not os.path.exists(help_file):
            return jsonify({"error": "Help topic not found"}), 404
        with open(help_file, "r", encoding="utf-8") as f:
            return jsonify({"content": f.read()})
    except Exception as e:
        current_app.logger.error(f"Help error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@routes_bp.route("/view_diagram")
def view_diagram():
    """Render diagram viewer with better error handling"""
    root_name = request.args.get("root_name")
    diagram_name = request.args.get("diagram_name") or request.args.get("diagramName")
    if not root_name or not diagram_name:
        abort(400, "Missing required parameters")
    try:
        safe_root = secure_filename(root_name)
        safe_file = secure_filename(diagram_name)
        diagram_path = os.path.join(
            current_app.config["DIAGRAMS_FOLDER"], safe_root, safe_file
        )
        if not os.path.exists(diagram_path):
            available_files = []
            dir_path = os.path.dirname(diagram_path)
            if os.path.exists(dir_path):
                available_files = os.listdir(dir_path)
            current_app.logger.error(
                f"Diagram not found. Requested: {safe_file}, Available: {available_files}"
            )
            abort(404, "Diagram file not found")
        with open(diagram_path, "r", encoding="utf-8") as file:
            mermaid_code = file.read()
        return render_template(
            "diagram_viewer.html",
            root_name=safe_root,
            diagram_name=safe_file,
            mermaid_code=mermaid_code,
            help_available=True,
        )
    except Exception as e:
        current_app.logger.error(f"View error: {str(e)}")
        abort(500, "Error loading diagram viewer")




