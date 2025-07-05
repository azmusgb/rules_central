// Help system initialization and fallback

function loadHelpScripts() {
  const configEl = document.getElementById('help-system-config');
  const url = configEl?.dataset.helpUrl;
  if (!url) return;
  const script = document.createElement('script');
  script.src = url;
  script.onerror = function() {
    console.warn('Failed to load help_system.js, using fallback');
    initializeFallbackHelpSystem();
  };
  document.body.appendChild(script);
}

// Inline fallback help content if external files fail to load
window.helpContent = window.helpContent || {
  default: {
    title: 'Help Center',
    content: `
                <div class="space-y-4">
                    <div class="p-3 bg-blue-900/20 rounded-lg">
                        <h4 class="font-medium flex items-center">
                            <i class="fas fa-info-circle mr-2 text-blue-400"></i>
                            Need Help?
                        </h4>
                        <p class="text-sm mt-2 text-gray-300">
                            Visit our <a href="/full-help" class="text-primary-400 hover:underline">full documentation</a>
                            for detailed guides and tutorials.
                        </p>
                    </div>
                    <div class="p-3 bg-purple-900/20 rounded-lg">
                        <h4 class="font-medium flex items-center">
                            <i class="fas fa-headset mr-2 text-purple-400"></i>
                            Contact Support
                        </h4>
                        <p class="text-sm mt-2 text-gray-300">
                            Email us at <a href="mailto:support@rulescentral.com" class="text-primary-400 hover:underline">support@rulescentral.com</a>
                        </p>
                    </div>
                </div>
            `
  }
};

function initializeFallbackHelpSystem() {
  const helpButton = document.getElementById('help-button');
  const helpPanel = document.getElementById('help-panel');
  const closeHelp = document.getElementById('close-help');

  if (!helpButton || !helpPanel) return;

  helpButton.addEventListener('click', function() {
    helpPanel.classList.toggle('hidden');
    helpPanel.classList.toggle('show');
    document.getElementById('help-content-loaded').innerHTML =
      window.helpContent.default.content;
  });

  if (closeHelp) {
    closeHelp.addEventListener('click', function() {
      helpPanel.classList.remove('show');
      helpPanel.classList.add('hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', loadHelpScripts);
