"""Blueprint for user profile and settings routes."""

from datetime import datetime
from flask import (
    Blueprint,
    render_template,
    current_app,
    abort,
    url_for,
    request,
    flash,
    jsonify,
)

user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/profile')
def user_profile():
    """User profile page with activity and statistics."""
    try:
        user_data = {
            "username": "johndoe",
            "email": "john.doe@example.com",
            "avatar": url_for('static', filename='images/default-avatar.png'),
            "member_since": "2023-01-15",
            "last_login": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "role": "Administrator",
        }

        activity_stats = {
            "rules_created": 142,
            "diagrams_uploaded": 28,
            "api_calls": 1240,
            "recent_activity": [
                {"action": "Uploaded rule set", "timestamp": "2023-06-15 14:30", "details": "Fraud Detection v2.1"},
                {"action": "Extracted rules", "timestamp": "2023-06-14 09:15", "details": "From production dataset"},
                {"action": "API Test", "timestamp": "2023-06-12 16:45", "details": "/rules/validate endpoint"},
            ],
        }

        return render_template(
            'profile.html',
            user=user_data,
            stats=activity_stats,
            help_available=True,
        )
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Profile error: {exc}")
        abort(500, "Error loading profile page")

@user_routes.route('/settings', methods=['GET', 'POST'])
def user_settings():
    """User settings page with form handling."""
    try:
        user_data = {
            "display_name": "John Doe",
            "email": "john.doe@example.com",
            "avatar_url": url_for('static', filename='images/default-avatar.png'),
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

        if request.method == 'POST':
            settings_data.update({
                "theme": request.form.get('theme', 'dark'),
                "timezone": request.form.get('timezone', 'UTC'),
                "email_notifications": 'email_notifications' in request.form,
                "push_notifications": 'push_notifications' in request.form,
                "inapp_notifications": 'inapp_notifications' in request.form,
                "language": request.form.get('language', 'en'),
                "experimental_features": 'experimental_features' in request.form,
                "font_size": request.form.get('font_size', 'normal'),
                "contrast": request.form.get('contrast', 'normal'),
                "motion": request.form.get('motion', 'normal'),
            })
            flash('Settings updated successfully!', 'success')

        security_data = {
            "last_password_change": "2023-05-10",
            "two_factor_enabled": False,
            "active_sessions": [
                {"ip": "192.168.1.100", "browser": "Chrome", "location": "New York", "last_active": "10 minutes ago"},
            ],
        }

        return render_template(
            'settings.html',
            user=user_data,
            settings=settings_data,
            security=security_data,
            help_available=True,
        )
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Settings error: {exc}")
        abort(500, "Error loading settings page")

@user_routes.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """API endpoint for user profile data."""
    try:
        profile_data = {
            "username": "johndoe",
            "email": "john.doe@example.com",
            "avatar_url": url_for('static', filename='images/default-avatar.png'),
            "member_since": "2023-01-15",
            "role": "Administrator",
            "stats": {
                "rules_created": 142,
                "diagrams_uploaded": 28,
                "api_calls": 1240,
            },
        }
        return jsonify(profile_data)
    except Exception as exc:
        current_app.logger.error(f"Profile API error: {exc}")
        return jsonify({'error': str(exc)}), 500

@user_routes.route('/api/user/activity', methods=['GET'])
def get_user_activity():
    """API endpoint for user activity data."""
    try:
        activity_data = [
            {
                "id": 1,
                "action": "rule_upload",
                "description": "Uploaded Fraud Detection v2.1 rules",
                "timestamp": "2023-06-15T14:30:00Z",
                "details": {
                    "file": "fraud_detection_v2.1.json",
                    "rule_count": 24,
                },
            },
            {
                "id": 2,
                "action": "rule_extraction",
                "description": "Extracted rules from production dataset",
                "timestamp": "2023-06-14T09:15:00Z",
                "details": {
                    "source": "production_db",
                    "rule_count": 18,
                },
            },
        ]
        return jsonify(activity_data)
    except Exception as exc:
        current_app.logger.error(f"Activity API error: {exc}")
        return jsonify({'error': str(exc)}), 500

@user_routes.route('/api/user/settings', methods=['GET', 'PUT'])
def handle_user_settings():
    """API endpoint for user settings."""
    try:
        if request.method == 'GET':
            settings = {
                "theme": "dark",
                "timezone": "UTC",
                "notifications": {"email": True, "push": False},
                "language": "en",
            }
            return jsonify(settings)
        if request.method == 'PUT':
            new_settings = request.get_json()
            current_app.logger.info(f"Updating settings: {new_settings}")
            return jsonify({'status': 'success', 'message': 'Settings updated'})
    except Exception as exc:
        current_app.logger.error(f"Settings API error: {exc}")
        return jsonify({'error': str(exc)}), 500

