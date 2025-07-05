// Additional behaviour for API test utility page

document.addEventListener('DOMContentLoaded', function() {
  const helpButton = document.getElementById('helpButton');
  const helpModal = document.getElementById('quickHelpModal');
  const closeHelpModal = document.getElementById('closeHelpModal');
  if (helpButton && helpModal && closeHelpModal) {
    helpButton.addEventListener('click', () => {
      helpModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
    closeHelpModal.addEventListener('click', () => {
      helpModal.classList.add('hidden');
      document.body.style.overflow = '';
    });
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        helpModal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });
  }

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const endpointInput = document.getElementById('endpoint');
      if (endpointInput) endpointInput.focus();
    }
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('[id$="Modal"]:not(.hidden)');
      openModals.forEach(modal => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      });
    }
  });
});
