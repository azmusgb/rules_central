export function initDashboard() {
  const timeEl = document.getElementById('current-time');
  function updateTime() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (timeEl) {
    updateTime();
    setInterval(updateTime, 1000);
  }

  const refreshBtn = document.getElementById('rc-metrics-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetch(refreshBtn.dataset.url, { headers: { Accept: 'application/json' } })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then(data => {
          if (!data.stats) return;
          const map = {
            'Total Rules': data.stats.total_rules ?? 0,
            'Changed · 7 Days': data.stats.changed_7d ?? 0,
            'Changed · 30 Days': data.stats.changed_30d ?? 0,
            'Changed · 90 Days': data.stats.changed_90d ?? 0,
          };
          document.querySelectorAll('.rc-metric').forEach(card => {
            const label = card.querySelector('.rc-metric-label')?.textContent.trim();
            if (label in map) {
              const el = card.querySelector('.rc-metric-value');
              if (el) el.textContent = map[label];
            }
          });
        })
        .catch(() => {});
    });
  }

  const ctx = document.getElementById('rulesTrendChart');
  if (ctx && window.Chart && window.trendData) {
    const { labels, counts } = (() => {
      const L = [], C = [];
      (window.trendData || []).forEach(d => {
        L.push(d.label || d.date || '');
        C.push(d.count ?? d.value ?? 0);
      });
      return { labels: L, counts: C };
    })();

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Rule Changes',
          data: counts,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244,63,94,.15)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#f43f5e',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(229,231,235,.3)' }, beginAtZero: true }
        }
      }
    });

    document.querySelectorAll('.rc-toggle-pill .rc-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rc-toggle-pill .rc-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        chart.update();
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);
