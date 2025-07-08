"""Blueprint for analytics and activity-related routes."""

import os
import json
from collections import defaultdict
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, current_app, request, send_file
from config import Config
from utils import log_activity, get_current_user

analytics_routes = Blueprint('analytics_routes', __name__)

@analytics_routes.route('/api/stats')
def get_stats():
    """Return accurate counts of diagrams and rules."""
    try:
        diagrams_dir = current_app.config.get('DIAGRAMS_FOLDER', './diagrams')
        diagrams_count = 0
        rules_count = 0

        if os.path.exists(diagrams_dir):
            diagrams_count = sum(
                1 for root, _, files in os.walk(diagrams_dir)
                for file in files
                if file.endswith('.mmd')
            )
            for root, _, files in os.walk(diagrams_dir):
                for file in files:
                    if file.endswith('.json'):
                        with open(os.path.join(root, file), 'r') as f:
                            data = json.load(f)
                            if isinstance(data, list):
                                rules_count += len(data)
                            elif isinstance(data, dict):
                                rules_count += len(data.get('rules', []))

        return jsonify({
            'diagramsProcessed': diagrams_count,
            'rulesExtracted': rules_count,
            'status': 'success'
        })

    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Stats error: {exc}")
        return jsonify({'status': 'error', 'message': 'Could not calculate statistics'}), 500

@analytics_routes.route('/api/advanced_stats')
def get_advanced_stats():
    """Return business metrics tracked in a JSON file."""
    try:
        json_path = os.path.join(current_app.root_path, 'data', 'advanced_stats.json')
        if not os.path.exists(json_path):
            stats = {
                "rules_by_status": {"active": 0, "draft": 0, "deprecated": 0},
                "recent_changes": 0,
                "validation_errors": 0,
                "active_domain": "N/A",
            }
            os.makedirs(os.path.dirname(json_path), exist_ok=True)
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(stats, f)
        else:
            with open(json_path, 'r', encoding='utf-8') as f:
                stats = json.load(f)
        return jsonify(stats)
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Advanced stats error: {exc}")
        return jsonify({'error': str(exc)}), 500

@analytics_routes.route('/api/analytics/activity', methods=['GET'])
def get_activity():
    """Return the raw activity log file."""
    Config.ensure_data_dir()
    try:
        return send_file(
            Config.ACTIVITY_LOG,
            mimetype='application/json',
            as_attachment=False,
        )
    except FileNotFoundError:
        return jsonify({'error': 'Activity log not found'}), 404

@analytics_routes.route('/api/activity_stats')
def get_activity_stats():
    """Return comprehensive activity statistics with accurate counting."""
    try:
        Config.ensure_data_dir()
        stats = {
            "status_counts": {"active": 0, "draft": 0, "deprecated": 0},
            "recent_activity": {"total": 0, "creations": 0, "updates": 0, "deletions": 0},
            "top_contributor": {"user": "None", "actions": 0},
        }
        try:
            with open(Config.ACTIVITY_LOG, 'r') as f:
                data = json.load(f)
                for rule in data.get('rules', {}).values():
                    status = rule.get('status', 'draft').lower()
                    if status in stats['status_counts']:
                        stats['status_counts'][status] += 1
                user_actions = defaultdict(int)
                week_ago = datetime.utcnow() - timedelta(days=7)
                for entry in data.get('activity_log', []):
                    try:
                        user = entry.get('user', 'anonymous')
                        user_actions[user] += 1
                        action = entry.get('action', '').lower()
                        if 'create' in action:
                            stats['recent_activity']['creations'] += 1
                        elif 'delete' in action:
                            stats['recent_activity']['deletions'] += 1
                        elif 'update' in action:
                            stats['recent_activity']['updates'] += 1
                        entry_time = datetime.fromisoformat(entry['timestamp'])
                        if entry_time >= week_ago:
                            stats['recent_activity']['total'] += 1
                    except Exception as exc:  # pragma: no cover - skip invalid entries
                        current_app.logger.warning(f"Skipping invalid entry: {exc}")
                        continue
                if user_actions:
                    top_user, top_actions = max(user_actions.items(), key=lambda x: x[1])
                    stats['top_contributor'] = {"user": top_user, "actions": top_actions}
        except (FileNotFoundError, json.JSONDecodeError) as exc:
            current_app.logger.error(f"Activity log error: {exc}")
        return jsonify(stats)
    except Exception as exc:  # pragma: no cover - unexpected errors
        current_app.logger.error(f"Stats generation failed: {exc}")
        return jsonify({'error': str(exc)}), 500

@analytics_routes.route('/api/rules/<rule_id>', methods=['PUT'])
def update_rule(rule_id):
    """Example rule update endpoint that logs an activity entry."""
    data = request.get_json()
    try:
        # Update logic would go here
        log_activity(
            action="update",
            rule_id=rule_id,
            user=get_current_user(),
            details=f"Updated rule {rule_id}",
        )
        return jsonify({'success': True})
    except Exception as exc:
        current_app.logger.error(f"Rule update error: {exc}")
        return jsonify({'error': str(exc)}), 500

@analytics_routes.route('/test/log_activity')
def test_log_activity():
    """Test endpoint to verify activity logging."""
    try:
        log_activity(
            action="test",
            rule_id="test_rule_123",
            user="tester",
            details="Test activity logging",
        )
        return jsonify({'status': 'success', 'message': 'Activity logged'})
    except Exception as exc:
        return jsonify({'status': 'error', 'message': str(exc)}), 500

@analytics_routes.route('/test/view_activity_log')
def test_view_activity_log():
    """Test endpoint to view raw activity log."""
    try:
        Config.ensure_data_dir()
        with open(Config.ACTIVITY_LOG, 'r') as f:
            return jsonify(json.load(f))
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500

@analytics_routes.route('/force_log_activity')
def force_log_activity():
    """Force log a test activity."""
    try:
        log_activity(
            action="test_action",
            rule_id="test_rule_123",
            user="test_user",
            details="Test activity entry",
        )
        return jsonify({'status': 'success', 'message': 'Test activity logged'})
    except Exception as exc:
        return jsonify({'status': 'error', 'message': str(exc)}), 500

