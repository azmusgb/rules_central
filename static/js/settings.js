   document.addEventListener('DOMContentLoaded', function() {
      // Update current time every second
      function updateCurrentTime() {
        const now = new Date();
        const options = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        };
        document.getElementById('current-time').textContent =
          now.toLocaleDateString('en-US', options) + ' ' + now.toLocaleTimeString('en-US', options);
      }

      // Initial update
      updateCurrentTime();

      // Update every second
      setInterval(updateCurrentTime, 1000);
    });