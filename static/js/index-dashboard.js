// Mobile menu toggle
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const sidebar = menu.querySelector('div');
  
  menu.classList.toggle('hidden');
  
  setTimeout(() => {
    sidebar.classList.toggle('-translate-x-full');
  }, 10);
}

// Close mobile menu when clicking overlay
document.getElementById('mobileMenu').addEventListener('click', function(e) {
  if (e.target === this) {
    toggleMobileMenu();
  }
});

// Initialize chart
function initChart() {
  const ctx = document.getElementById('rulesChart').getContext('2d');
  const chartLoading = document.getElementById('chartLoading');
  
  // Simulate data loading
  setTimeout(() => {
    chartLoading.style.display = 'none';
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Executions',
            data: [3200, 4200, 3100, 5800, 5100, 4800, 6300],
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          },
          {
            label: 'Success Rate',
            data: [95, 97, 96, 98, 97, 96, 99],
            borderColor: '#a78bfa',
            backgroundColor: 'rgba(167, 139, 250, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#94a3b8'
            }
          },
          y1: {
            position: 'right',
            min: 90,
            max: 100,
            grid: {
              drawOnChartArea: false,
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#94a3b8',
              callback: function(value) {
                return value + '%';
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#94a3b8'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#e2e8f0',
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#e2e8f0',
            bodyColor: '#cbd5e1',
            borderColor: '#1e293b',
            borderWidth: 1,
            padding: 12,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label.includes('Rate')) {
                  return label + ': ' + context.raw + '%';
                }
                return label + ': ' + context.raw.toLocaleString();
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          intersect: false
        }
      }
    });
  }, 1000);
}

// Search functionality
document.querySelector('.search-input').addEventListener('input', function(e) {
  const query = e.target.value.toLowerCase();
  if (query.length > 2) {
    console.log('Searching for:', query);
    // Add search logic here
  }
});

// Real-time updates simulation
function simulateRealTimeUpdates() {
  const indicators = document.querySelectorAll('.real-time-dot');
  indicators.forEach(dot => {
    dot.style.animation = 'none';
    setTimeout(() => {
      dot.style.animation = 'pulse 2s infinite';
    }, 10);
  });
  
  // Random notification
  if (Math.random() > 0.7) {
    showNotification('New rule execution detected', 'info');
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const toast = document.getElementById('notificationToast');
  const icon = toast.querySelector('i');
  
  // Set type-specific styles
  switch(type) {
    case 'success':
      icon.className = 'fas fa-check-circle text-emerald-400 mr-3';
      break;
    case 'warning':
      icon.className = 'fas fa-exclamation-triangle text-yellow-400 mr-3';
      break;
    case 'error':
      icon.className = 'fas fa-times-circle text-red-400 mr-3';
      break;
    default:
      icon.className = 'fas fa-info-circle text-blue-400 mr-3';
  }
  
  toast.querySelector('span').textContent = message;
  toast.classList.remove('hidden');
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 5000);
}

// Dismiss notification
function dismissNotification() {
  document.getElementById('notificationToast').classList.add('hidden');
}

// Auto-refresh stats simulation
function updateStats() {
  const stats = document.querySelectorAll('[class*="text-3xl"]');
  stats.forEach(stat => {
    if (stat.textContent.includes('k')) {
      const currentValue = parseFloat(stat.textContent.replace('k', ''));
      const newValue = (currentValue + Math.random() * 0.5).toFixed(1);
      stat.textContent = newValue + 'k';
    } else if (stat.textContent.includes(',')) {
      const currentValue = parseInt(stat.textContent.replace(',', ''));
      const newValue = currentValue + Math.floor(Math.random() * 10);
      stat.textContent = newValue.toLocaleString();
    }
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 'k':
        e.preventDefault();
        document.querySelector('.search-input').focus();
        break;
      case 'n':
        e.preventDefault();
        showNotification('Creating new rule...', 'info');
        break;
    }
  }
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initChart();
  
  // Set up intervals
  setInterval(simulateRealTimeUpdates, 5000);
  setInterval(updateStats, 30000);
  
  // Progressive enhancement for animations
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-up');
        }
      });
    });
    
    document.querySelectorAll('.card-hover').forEach(card => {
      observer.observe(card);
    });
  }
  
  // Demo notification after 3 seconds
  setTimeout(() => {
    showNotification('Welcome to Rules Central!', 'success');
  }, 3000);
});
