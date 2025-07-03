'use strict';
class StatsManager {
  constructor() {
    // Cache all stats elements
    this.statsElements = {
      // Basic stats
      diagramsProcessed: document.getElementById('diagramsProcessed'),
      rulesExtracted: document.getElementById('rulesExtracted'),

      // Advanced stats
      activeRulesCount: document.getElementById('activeRulesCount'),
      draftRulesCount: document.getElementById('draftRulesCount'),
      deprecatedRulesCount: document.getElementById('deprecatedRulesCount'),
      recentChangesCount: document.getElementById('recentChangesCount'),
      creationsCount: document.getElementById('creationsCount'),
      updatesCount: document.getElementById('updatesCount'),
      deletionsCount: document.getElementById('deletionsCount'),
      topContributor: document.getElementById('topContributor')
    };

    // Additional element caching for contributor
    if (this.statsElements.topContributor) {
      this.statsElements.contributorName = this.statsElements.topContributor.querySelector('.contributor-name');
      this.statsElements.contributorActions = this.statsElements.topContributor.querySelector('.contributor-actions');
    }

    this.lastUpdate = null;
    this.updateInterval = 300000; // 5 minutes
  }

  async updateAllStats() {
    try {
      await Promise.all([
        this.updateBasicStats(),
        this.updateAdvancedStats()
      ]);
      this.lastUpdate = new Date();
      console.log(`Stats successfully updated at ${this.lastUpdate.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  async updateBasicStats() {
    try {
      this.showLoading(['diagramsProcessed', 'rulesExtracted']);

      const response = await fetch(`/api/stats?_=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log('Basic stats data:', data);

      // Update diagrams count with animation
      if (this.statsElements.diagramsProcessed && data.diagramsProcessed !== undefined) {
        this.animateCount(this.statsElements.diagramsProcessed, data.diagramsProcessed);
      }

      // Update rules count with animation
      if (this.statsElements.rulesExtracted && data.rulesExtracted !== undefined) {
        this.animateCount(this.statsElements.rulesExtracted, data.rulesExtracted);
      }
    } catch (error) {
      console.error('Error fetching basic stats:', error);
      this.showErrorState(['diagramsProcessed', 'rulesExtracted']);
      window.app.showToast('Failed to load diagram statistics', 'error');
    }
  }

  async updateAdvancedStats() {
    try {
      const advancedKeys = Object.keys(this.statsElements)
        .filter(k => !['diagramsProcessed', 'rulesExtracted', 'topContributor'].includes(k));
      this.showLoading(advancedKeys);

      const response = await fetch(`/api/activity_stats?_=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to load stats');

      const data = await response.json();
      console.log('Advanced stats data:', data);
      this.updateAdvancedStatsElements(data);
    } catch (error) {
      console.error('Error loading activity stats:', error);
      const advancedKeys = Object.keys(this.statsElements)
        .filter(k => !['diagramsProcessed', 'rulesExtracted', 'topContributor'].includes(k));
      this.showErrorState(advancedKeys);
    }
  }

  updateAdvancedStatsElements(data) {
    // Rule status counts
    if (data.status_counts) {
      if (this.statsElements.activeRulesCount) {
        this.animateCount(this.statsElements.activeRulesCount, data.status_counts.active);
      }
      if (this.statsElements.draftRulesCount) {
        this.animateCount(this.statsElements.draftRulesCount, data.status_counts.draft);
      }
      if (this.statsElements.deprecatedRulesCount) {
        this.animateCount(this.statsElements.deprecatedRulesCount, data.status_counts.deprecated);
      }
    }

    // Recent activity
    if (data.recent_activity) {
      if (this.statsElements.recentChangesCount) {
        this.animateCount(this.statsElements.recentChangesCount, data.recent_activity.total);
      }
      if (this.statsElements.creationsCount) {
        this.animateCount(this.statsElements.creationsCount, data.recent_activity.creations);
      }
      if (this.statsElements.updatesCount) {
        this.animateCount(this.statsElements.updatesCount, data.recent_activity.updates);
      }
      if (this.statsElements.deletionsCount) {
        this.animateCount(this.statsElements.deletionsCount, data.recent_activity.deletions);
      }
    }

    // Top contributor
    if (data.top_contributor) {
      if (this.statsElements.contributorName) {
        this.statsElements.contributorName.textContent = data.top_contributor.user || 'None';
      }
      if (this.statsElements.contributorActions) {
        this.statsElements.contributorActions.textContent =
          `${data.top_contributor.actions || 0} actions`;
      }
    }

    // Briefly pulse the stats cards to draw attention
    document.querySelectorAll('.stats-card').forEach(card => {
      card.classList.add('pulse-highlight');
      setTimeout(() => card.classList.remove('pulse-highlight'), 600);
    });
  }

  animateCount(element, target) {
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;

    const duration = 1000;
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentValue = current + Math.floor(progress * (target - current));

      element.textContent = currentValue.toLocaleString(); // Format with commas

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }

  showLoading(keys) {
    keys.forEach(key => {
      if (this.statsElements[key]) {
        this.statsElements[key].innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      }
    });
  }

  showErrorState(keys) {
    keys.forEach(key => {
      if (this.statsElements[key]) {
        this.statsElements[key].textContent = '--';
      }
    });
  }
}

// Initialize StatsManager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if stats elements exist on this page
  if (document.getElementById('diagramsProcessed') || document.getElementById('activeRulesCount')) {
    const statsManager = new StatsManager();

    // Initial load
    statsManager.updateAllStats();

    // Set up auto-refresh (every 5 minutes)
    setInterval(() => {
      console.log('Auto-refreshing stats...');
      statsManager.updateAllStats();
    }, statsManager.updateInterval);

    // Optional: Refresh on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        statsManager.updateAllStats();
      }
    });

    // Export for debugging
    window.statsManager = statsManager;
  }
});