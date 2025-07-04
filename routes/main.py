"""Main user-facing pages."""

from flask import Blueprint, render_template, current_app, abort

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
