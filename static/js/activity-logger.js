"use strict";
// activity-logger.js
const ActivityLogger = {
  async logAction(action, attempt = 1) {
    try {
      const response = await fetch("/api/analytics/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          ...action,
        }),
      });
      return response.ok;
    } catch (error) {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 300 * attempt));
        return this.logAction(action, attempt + 1);
      }
      console.error("Logging failed:", error);
      return false;
    }
  },

  async getRecentActivity(days = 7) {
    try {
      const response = await fetch(`/api/analytics/activity?days=${days}`);
      if (!response.ok) throw new Error("Failed to load activity");
      return await response.json();
    } catch (error) {
      console.error("Activity load error:", error);
      return { error: true };
    }
  },
};

// Usage example:
// ActivityLogger.logAction({
//   type: "rule_update",
//   ruleId: "rule_123",
//   userId: "user_456",
//   changes: ["status"],
// });

// Usage: ActivityLogger.logAction({ type: "rule_update", ... })
