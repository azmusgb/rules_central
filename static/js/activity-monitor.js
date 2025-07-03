'use strict';
// activity-monitor.js
export class ActivityMonitor {
  constructor() {
    this.cache = {
      lastUpdated: null,
      data: null
    };
  }

  async refresh() {
    try {
      const response = await fetch('/api/activity?cachebuster=' + Date.now());
      if (!response.ok) throw new Error('Server error');

      this.cache = {
        lastUpdated: new Date(),
        data: await response.json()
      };

      return true;
    } catch (error) {
      console.error('Activity refresh failed:', error);
      return false;
    }
  }

  getStats() {
    if (!this.cache.data) return null;

    const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalRules: Object.keys(this.cache.data.rules).length,
      recentChanges: this.cache.data.activity_log.filter(
        entry => new Date(entry.timestamp) > recentThreshold
      ).length,
      statusCounts: this.countStatuses()
    };
  }

  countStatuses() {
    const counts = { active: 0, draft: 0, deprecated: 0 };
    for (const rule of Object.values(this.cache.data.rules)) {
      counts[rule.status]++;
    }
    return counts;
  }
}

// Usage in your dashboard
const monitor = new ActivityMonitor();

async function updateDashboard() {
  await monitor.refresh();
  const stats = monitor.getStats();

  document.getElementById('totalRules').textContent = stats.totalRules;
  document.getElementById('recentActivity').textContent = stats.recentChanges;

  // Update status badges
  Object.entries(stats.statusCounts).forEach(([status, count]) => {
    document.getElementById(`${status}Rules`).textContent = count;
  });
}

// Auto-refresh every 5 minutes
setInterval(updateDashboard, 300000);
document.addEventListener('DOMContentLoaded', updateDashboard);