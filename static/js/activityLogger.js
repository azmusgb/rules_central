'use strict';
// activityLogger.js
const ActivityLogger = {
  async logAction(action) {
    try {
      const response = await fetch('/api/analytics/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          ...action
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Logging failed:', error);
      return false;
    }
  },

  async getRecentActivity(days = 7) {
    try {
      const response = await fetch(`/api/analytics/activity?days=${days}`);
      if (!response.ok) throw new Error('Failed to load activity');
      return await response.json();
    } catch (error) {
      console.error('Activity load error:', error);
      return { error: true };
    }
  }
};

// Usage example:
ActivityLogger.logAction({
  type: 'rule_update',
  ruleId: 'rule_123',
  userId: 'user_456',
  changes: ['status']
});