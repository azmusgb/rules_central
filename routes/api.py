"""Minimal API endpoints."""

from flask import Blueprint, jsonify, current_app

api = Blueprint('api', __name__)

@api.route('/api/catalog_names')
def catalog_names():
    """Return available catalog names."""

    try:
        names = ['Catalog1', 'Catalog2', 'Catalog3']
        return jsonify(names)
    except Exception as exc:
        current_app.logger.error("Catalog names error: %s", exc)
        return jsonify(error="Failed to fetch names"), 500
