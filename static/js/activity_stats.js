// Activity statistics widget

document.addEventListener('DOMContentLoaded', function() {
  const statsList = document.getElementById('activityStatsList');
  const loading = document.getElementById('activityStatsLoading');
  const error = document.getElementById('activityStatsError');
  const retryBtn = document.getElementById('retryActivityStats');

  async function loadActivityStats() {
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    statsList.innerHTML = '';
    try {
      const res = await fetch('/api/diagram_catalogs');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const entries = Object.entries(data);
      if (entries.length === 0) {
        statsList.innerHTML = '<li class="text-gray-400">No activity data available.</li>';
      } else {
        entries.forEach(([catalog, diagrams], idx) => {
          const li = document.createElement('li');
          li.className = 'flex items-center justify-between bg-dark-800/80 rounded-lg px-6 py-4 shadow transition hover:bg-dark-700/90';
          li.innerHTML = `
                        <span class="font-semibold text-primary-300 flex items-center gap-2">
                            <i class="fas fa-folder-open"></i>
                            ${catalog}
                        </span>
                        <span class="flex items-center gap-2">
                            <span class="text-lg font-bold text-white">${diagrams.length}</span>
                            <span class="text-gray-400 text-sm">diagrams</span>
                            <span class="inline-block w-32 h-2 bg-dark-700 rounded-full ml-4 overflow-hidden">
                                <span class="block h-full bg-primary-400 activity-bar" style="width: 0%"></span>
                            </span>
                        </span>`;
          statsList.appendChild(li);
          setTimeout(() => {
            const bar = li.querySelector('.activity-bar');
            const max = Math.max(...entries.map(e => e[1].length));
            const percent = max ? Math.round((diagrams.length / max) * 100) : 0;
            bar.style.width = percent + '%';
            bar.style.transition = 'width 1.2s cubic-bezier(0.4,0,0.2,1)';
          }, 100 + idx * 100);
        });
      }
      loading.classList.add('hidden');
    } catch (e) {
      loading.classList.add('hidden');
      error.classList.remove('hidden');
    }
  }
  if (retryBtn) retryBtn.addEventListener('click', loadActivityStats);
  loadActivityStats();
});
