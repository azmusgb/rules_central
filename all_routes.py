"""Routes Configuration for Diagram Management System.

Organized into functional sections with consistent error handling and logging:
- API Endpoints
- View Rendering
- File Operations
- Help & Documentation
"""

import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from flask import (
    Blueprint,
    request,
    render_template,
    jsonify,
    send_from_directory,
    abort,
    current_app,
    url_for,
    Response,
)
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException
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

logger = logging.getLogger(__name__)

__all__ = ["routes_bp"]

# ------------------------------------------------------------------
# Blueprint Setup
# ------------------------------------------------------------------
routes_bp = Blueprint("routes", __name__)

# ------------------------------------------------------------------
# Template Helper Functions
# ------------------------------------------------------------------

@routes_bp.app_template_global("update_query_param")
def update_query_param(param: str, value: str | int) -> str:
    """Generate updated query string with modified parameter.
    
    Args:
        param: Query parameter to update
        value: New value for the parameter
        
    Returns:
        URL-encoded query string
    """
    args = request.args.to_dict(flat=True)
    args[param] = str(value)
    return urlencode(args, doseq=True)

@routes_bp.app_template_global("remove_query_param")
def remove_query_param(*keys: str) -> str:
    """Generate query string with specified parameters removed.
    
    Args:
        *keys: Parameters to remove
        
    Returns:
        URL-encoded query string
    """
    args = request.args.to_dict(flat=True)
    for key in keys:
        args.pop(key, None)
    return urlencode(args, doseq=True)

@routes_bp.app_template_global("safe_startswith")
def safe_startswith(value: str, prefix: str) -> bool:
    """Safe string prefix check for templates.
    
    Args:
        value: String to check
        prefix: Prefix to look for
        
    Returns:
        True if value starts with prefix, False otherwise
    """
    return isinstance(value, str) and isinstance(prefix, str) and value.startswith(prefix)

# ------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------

@routes_bp.route("/api/diagram_catalogs", methods=["GET"])
def get_diagram_catalogs() -> Tuple[Response, int]:
    """Retrieve structured catalog of available diagrams.
    
    Returns:
        JSON response with catalog structure or error message
    """
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
                    entries.append({
                        "root": root_dir.name,
                        "diagram": file.name,
                        "hierarchy": json_file.name,
                        "type": diagram_type_from_filename(file.name),
                    })

            if entries:
                category_parts = root_dir.name.split("_", 1)
                category = category_parts[0] if len(category_parts) > 0 else "General"
                subgroup = category_parts[1] if len(category_parts) > 1 else "General"
                catalogs.append({
                    "category": f"{category}_{subgroup}",
                    "entries": entries
                })

        response = jsonify(catalogs)
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        return response, 200

    except Exception as e:
        logger.exception("Error generating diagram catalog")
        return jsonify({"error": "Server error generating catalog"}), 500

@routes_bp.route("/api/catalog_names", methods=["GET"])
def get_catalog_names() -> Tuple[Response, int]:
    """Get list of catalog names for filter dropdown.
    
    Returns:
        JSON response with catalog names or error message
    """
    try:
        diagrams_dir = Path(current_app.config["DIAGRAMS_FOLDER"])
        if not diagrams_dir.exists():
            return jsonify({"error": "Diagrams directory not found"}), 404

        catalog_names = {
            root.name.split("_")[0] 
            for root in diagrams_dir.iterdir() 
            if root.is_dir()
        }
        return jsonify(sorted(catalog_names)), 200

    except Exception as e:
        logger.exception("Error getting catalog names")
        return jsonify({"error": "Server error generating catalog names"}), 500

@routes_bp.route("/api/search_diagrams", methods=["GET"])
def search_diagrams() -> Tuple[Response, int]:
    """Search diagrams with filtering and pagination.
    
    Returns:
        JSON response with search results or error message
    """
    try:
        # Validate and parse parameters
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
                if (diagram_type_filter and 
                    file_type and 
                    file_type.lower() != diagram_type_filter.lower()):
                    continue

                try:
                    content = mmd_file.read_text(encoding="utf-8").lower()
                except Exception as e:
                    logger.warning(f"Error reading {mmd_file}: {str(e)}")
                    continue

                if (not query or 
                    query in mmd_file.name.lower() or 
                    query in content):
                    results.append({
                        "filename": mmd_file.name,
                        "catalog": root_dir.name,
                        "type": file_type,
                        "size": mmd_file.stat().st_size,
                        "last_modified": mmd_file.stat().st_mtime,
                        "match_snippet": get_snippet(content, query) if query else "",
                    })

        # Paginate results
        total = len(results)
        start = (page - 1) * per_page
        paginated = results[start:start + per_page]

        return jsonify({
            "total": total,
            "page": page,
            "per_page": per_page,
            "results": paginated
        }), 200

    except ValueError as ve:
        logger.warning(f"Invalid search parameter: {str(ve)}")
        return jsonify({"error": "Invalid search parameter"}), 400
    except Exception as e:
        logger.exception("Error during search")
        return jsonify({"error": "Server error during search"}), 500

# [Additional API endpoints with similar improvements...]

# ------------------------------------------------------------------
# View Rendering
# ------------------------------------------------------------------

@routes_bp.route("/view_diagram")
def view_diagram() -> str:
    """Render diagram viewer with error handling.
    
    Returns:
        Rendered template or error page
    """
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
            logger.error(
                f"Diagram not found. Requested: {safe_file}, Available: {available}"
            )
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
    except Exception as e:
        logger.exception("Error loading diagram viewer")
        abort(500, "Error loading diagram viewer")

# [Additional view routes with similar improvements...]

# ------------------------------------------------------------------
# File Operations
# ------------------------------------------------------------------

@routes_bp.route("/upload", methods=["GET", "POST"])
def upload_file() -> Response:
    """Handle file uploads and processing.
    
    Returns:
        JSON response with upload results
    """
    if request.method == "GET":
        return render_template("upload.html", help_available=True)

    if "files" not in request.files:
        return jsonify({
            "success": False, 
            "message": "No files provided"
        }), 400

    files = request.files.getlist("files")
    if not files or any(f.filename == "" for f in files):
        return jsonify({
            "success": False, 
            "message": "Invalid file selection"
        }), 400

    uploads_dir = Path(current_app.config["UPLOAD_FOLDER"])
    diagrams_dir = Path(current_app.config["DIAGRAMS_FOLDER"])
    ensure_directory_exists(uploads_dir)
    ensure_directory_exists(diagrams_dir)

    processed = []
    errors = []

    for file in files:
        try:
            if not allowed_file(file.filename):
                raise ValueError("Invalid file type")

            filename = secure_filename(file.filename)
            file_path = uploads_dir / filename
            file.save(file_path)

            json_data = load_and_sanitize_json(file_path)
            if not json_data:
                raise ValueError("Invalid JSON content")

            root_name = Path(filename).stem
            output_dir = diagrams_dir / root_name
            ensure_directory_exists(output_dir)

            generate_files(json_data, output_dir)
            processed.append(filename)

            log_activity(
                action="upload",
                rule_id=root_name,
                user=get_current_user(),
                details=f"Uploaded {filename}",
            )

        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
            logger.error(f"Upload error: {file.filename} - {str(e)}")

    if errors:
        return jsonify({
            "success": False,
            "message": "Some files failed to process",
            "processed": processed,
            "errors": errors,
        }), 207

    return jsonify({
        "success": True,
        "message": f"Processed {len(processed)} files",
        "redirect_url": url_for("routes.catalog"),
    })

# [Additional file operation routes with similar improvements...]

# ------------------------------------------------------------------
# Help & Documentation
# ------------------------------------------------------------------

@routes_bp.route("/api/help/<page>")
def get_help_content(page: str) -> Tuple[Response, int]:
    """Retrieve help content for specified page.
    
    Args:
        page: Help page identifier
        
    Returns:
        JSON response with help content or error message
    """
    try:
        safe_page = secure_filename(page)
        help_file = Path(current_app.root_path) / "static" / "help" / f"{safe_page}.md"
        
        if not help_file.exists():
            return jsonify({"error": "Help topic not found"}), 404
            
        content = help_file.read_text(encoding="utf-8")
        return jsonify({"content": content}), 200

    except Exception as e:
        logger.exception("Error retrieving help content")
        return jsonify({"error": str(e)}), 500

# [Additional documentation routes with similar improvements...]