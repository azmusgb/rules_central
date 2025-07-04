import os
from flask import Blueprint, current_app, request, redirect, url_for, flash, render_template, jsonify
from werkzeug.utils import secure_filename
from utils import (
    allowed_file,
    load_and_sanitize_json,
    ensure_directory_exists,
    generate_files,
)

upload = Blueprint('upload', __name__)

@upload.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'GET':
        return render_template('upload.html', help_available=True)

    is_json = request.accept_mimetypes['application/json'] > request.accept_mimetypes['text/html']

    # Change 'files' to 'file'
    if 'file' not in request.files:
        msg = "No file provided"
        if is_json:
            return jsonify(success=False, message=msg), 400
        flash(msg, "error")
        return redirect(request.url)

    # Only one file expected
    file = request.files['file']
    if file.filename == '':
        msg = "No file selected"
        if is_json:
            return jsonify(success=False, message=msg), 400
        flash(msg, "error")
        return redirect(request.url)

    uploads_dir = current_app.config.get('UPLOAD_FOLDER', './uploads')
    diagrams_dir = current_app.config.get('DIAGRAMS_FOLDER', './diagrams')
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(diagrams_dir, exist_ok=True)

    processed_files = []
    errors = []

    try:
        if not allowed_file(file.filename):
            raise ValueError("Invalid file type")

        filename = secure_filename(file.filename)
        file_path = os.path.join(uploads_dir, filename)
        file.save(file_path)

        if filename.lower().endswith(('.json', '.mmd')):
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

    except Exception as e:
        errors.append(f"{file.filename}: {str(e)}")
        current_app.logger.error(f"Upload error: {file.filename} - {str(e)}")

    if errors:
        msg = "Some files failed to process: " + "; ".join(errors)
        if is_json:
            return jsonify(success=False, message=msg, processed=processed_files, errors=errors), 207
        flash(msg, "error")
        return redirect(request.url)

    msg = f"Processed {len(processed_files)} files successfully"
    if is_json:
        return jsonify(success=True, message=msg, processed=processed_files, redirect_url=url_for("main.catalog"))
    flash(msg, "success")
    return redirect(url_for("main.catalog"))
