from flask import jsonify, current_app
from .api import api

@api.route('/api/metrics')
def metrics():
    """Return dashboard metrics for the main page."""
    try:
        # Example static data; replace with real queries as needed
        data = {
            "diagramCount": 75,
            "rulesExtractedCount": 65,
            "rulesStatusChart": 80,
            "recentChangesCount": 50
        }
        return jsonify(data)
    except Exception as exc:
        current_app.logger.error("Metrics API error: %s", exc)
        return jsonify(error="Failed to fetch metrics"), 500
