"""Main user-facing pages."""

from flask import (
    Blueprint,
    render_template,
    current_app,
    abort,
    request,
    redirect,
    url_for,
    flash,
)
import json
from datetime import datetime, timezone
from pathlib import Path
from config import Config
from utils import ensure_directory_exists

main = Blueprint('main', __name__)

@main.route('/')
def index():
    """Render the application home page."""

    try:
        return render_template('index.html')
    except Exception as exc:
        current_app.logger.error("Index page error: %s", exc)
        abort(500)

@main.route('/catalog')
def catalog():
    """Display the diagram catalog."""

    try:
        return render_template('catalog.html')
    except Exception as exc:
        current_app.logger.error("Catalog page error: %s", exc)
        abort(500)

@main.route('/search')
def search():
    """Display the search page."""

    try:
        return render_template('search.html')
    except Exception as exc:
        current_app.logger.error("Search page error: %s", exc)
        abort(500)


@main.route('/about')
def about():
    """Display project information and version."""

    try:
        version = current_app.config.get("VERSION", "1.0")
        return render_template('about.html', version=version)
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error("About page error: %s", exc)
        abort(500)


@main.route('/contact', methods=['GET', 'POST'])
def contact():
    """Display the contact page and handle feedback submissions."""

    try:
        if request.method == 'POST':
            data = {
                'name': request.form.get('name', 'Anonymous'),
                'email': request.form.get('email', ''),
                'subject': request.form.get('subject', ''),
                'message': request.form.get('message', ''),
                'timestamp': datetime.now(timezone.utc).isoformat(),
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
            flash('Thank you for your feedback!', 'success')
            return redirect(url_for('main.contact'))

        return render_template('contact.html')
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error("Contact page error: %s", exc)
        abort(500)
