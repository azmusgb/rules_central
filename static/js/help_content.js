'use strict';
// Help content object for all pages
window.helpContent = {
  "index": {
    "title": "Dashboard Overview",
    "content": `
      <div class="space-y-4">
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-tachometer-alt mr-2 text-primary-400"></i>
            Quick Start Guide
          </h4>
          <ol class="list-decimal list-inside text-sm mt-2 space-y-1 text-slate-300">
            <li>Use <strong class="text-primary-300">Upload Diagrams</strong> to add new JSON diagram files</li>
            <li><strong class="text-primary-300">Rule Extraction</strong> converts FormWorks docs to diagrams</li>
            <li>Explore existing diagrams in the <strong class="text-primary-300">Catalog</strong></li>
            <li>Test API endpoints using the <strong class="text-primary-300">API Test Utility</strong></li>
          </ol>
        </div>
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-lightbulb mr-2 text-yellow-400"></i>
            Pro Tips
          </h4>
          <ul class="text-sm mt-2 space-y-1 text-slate-300">
            <li>Drag-and-drop JSON files directly onto the upload page</li>
            <li>Bookmark frequently used diagrams for quick access</li>
            <li>Customize diagram colors in the Theme Manager</li>
            <li>Use Ctrl+F to search within diagram viewers</li>
          </ul>
        </div>
      </div>
    `
  },
  "api_test_utility": {
    "title": "API Test Utility",
    "content": `
      <div class="space-y-4">
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-paper-plane mr-2 text-primary-400"></i>
            API Test Quick Guide
          </h4>
          <ol class="list-decimal list-inside text-sm mt-2 space-y-1 text-slate-300">
            <li>Enter the API endpoint (default: "/webhook_listener") in the Endpoint field</li>
            <li>Fill in the JSON body in the provided textarea</li>
            <li>Click the <strong class="text-primary-300">Send Request</strong> button to submit the API call</li>
            <li>Review the response details in the Response section</li>
          </ol>
        </div>
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-lightbulb mr-2 text-yellow-400"></i>
            Pro Tips
          </h4>
          <ul class="text-sm mt-2 space-y-1 text-slate-300">
            <li>Ensure the JSON body is properly formatted</li>
            <li>Watch the spinner for processing feedback</li>
            <li>Use toast notifications to confirm successful operations</li>
            <li>Double-check the endpoint URL for accuracy</li>
          </ul>
        </div>
      </div>
    `
  },
  "catalog": {
    "title": "Diagram Catalog",
    "content": `
      <div class="space-y-4">
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-th-large mr-2 text-primary-400"></i>
            Catalog Quick Guide
          </h4>
          <ol class="list-decimal list-inside text-sm mt-2 space-y-1 text-slate-300">
            <li>Use the search bar to quickly find diagrams</li>
            <li>Apply filters to narrow diagrams by type or category</li>
            <li>Expand or collapse diagram groups for a clearer view</li>
            <li>Click on a diagram card to open its detailed viewer</li>
          </ol>
        </div>
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-lightbulb mr-2 text-yellow-400"></i>
            Pro Tips
          </h4>
          <ul class="text-sm mt-2 space-y-1 text-slate-300">
            <li>Hover over cards for quick preview details</li>
            <li>Reset filters to start a new search</li>
            <li>Bookmark diagrams you frequently use</li>
            <li>Use expand/collapse buttons for a summarized view</li>
          </ul>
        </div>
      </div>
    `
  },
  "config": {
    "title": "Diagram Theme Manager",
    "content": `
      <div class="space-y-4">
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-palette mr-2 text-primary-400"></i>
            Theme Manager Quick Guide
          </h4>
          <ol class="list-decimal list-inside text-sm mt-2 space-y-1 text-slate-300">
            <li>Select an existing theme from the list to preview and edit</li>
            <li>Use the color pickers to customize node colors and borders</li>
            <li>Apply advanced settings via the Mermaid class definitions editor</li>
            <li>Utilize Import, Export, and Save Changes buttons</li>
          </ol>
        </div>
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-lightbulb mr-2 text-yellow-400"></i>
            Pro Tips
          </h4>
          <ul class="text-sm mt-2 space-y-1 text-slate-300">
            <li>Hover over theme cards for additional options</li>
            <li>Use the preview tab for real-time updates</li>
            <li>Search themes quickly using the search input</li>
            <li>Remember to save your changes</li>
          </ul>
        </div>
      </div>
    `
  },
  "view_diagram": {
    "title": "Diagram Viewer",
    "content": `
      <div class="space-y-4">
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-project-diagram mr-2 text-primary-400"></i>
            Diagram Viewer Quick Guide
          </h4>
          <ol class="list-decimal list-inside text-sm mt-2 space-y-1 text-slate-300">
            <li>Click the <strong class="text-primary-300">Editor</strong> button to modify diagram code</li>
            <li>Use the search bar to locate elements within the diagram</li>
            <li>Toggle themes to update the diagram's appearance</li>
            <li>Zoom and pan to explore details</li>
          </ol>
        </div>
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-lightbulb mr-2 text-yellow-400"></i>
            Pro Tips
          </h4>
          <ul class="text-sm mt-2 space-y-1 text-slate-300">
            <li>Use Ctrl+F for quick in-diagram search</li>
            <li>Double-click nodes to see more details</li>
            <li>Switch themes for optimal viewing contrast</li>
            <li>Experiment with editor mode to preview changes</li>
          </ul>
        </div>
      </div>
    `
  },
  "view_hierarchy": {
    "title": "Hierarchy Viewer",
    "content": `
      <div class="space-y-4">
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-sitemap mr-2 text-primary-400"></i>
            Hierarchy Viewer Quick Guide
          </h4>
          <ol class="list-decimal list-inside text-sm mt-2 space-y-1 text-slate-300">
            <li>Use the search box to filter rule nodes</li>
            <li>Click on nodes to expand or collapse details</li>
            <li>Review the JSON view for in-depth rule data</li>
            <li>Utilize expand/collapse all buttons for an overview</li>
          </ol>
        </div>
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-lightbulb mr-2 text-yellow-400"></i>
            Pro Tips
          </h4>
          <ul class="text-sm mt-2 space-y-1 text-slate-300">
            <li>Hover over nodes for a quick preview</li>
            <li>Reset filters to show the complete hierarchy</li>
            <li>Refresh the view if the tree structure changes</li>
            <li>Bookmark key nodes for fast access</li>
          </ul>
        </div>
      </div>
    `
  },
  "rules_extraction_utility": {
    "title": "Rules Extraction Utility",
    "content": `
      <div class="space-y-4">
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-cogs mr-2 text-primary-400"></i>
            Rules Extraction Quick Guide
          </h4>
          <ol class="list-decimal list-inside text-sm mt-2 space-y-1 text-slate-300">
            <li>Click <strong class="text-primary-300">Extract FormWorks Rules</strong> to start</li>
            <li>Monitor the Execution Status panel for progress</li>
            <li>Wait for the spinner to indicate processing</li>
            <li>Review the output in the log section when complete</li>
          </ol>
        </div>
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-lightbulb mr-2 text-yellow-400"></i>
            Pro Tips
          </h4>
          <ul class="text-sm mt-2 space-y-1 text-slate-300">
            <li>Ensure FormWorks documents are correctly formatted</li>
            <li>Refresh and retry if extraction stalls</li>
            <li>Use output logs to troubleshoot issues</li>
            <li>Contact support if problems persist</li>
          </ul>
        </div>
      </div>
    `
  },
  "search": {
    "title": "Search Diagrams",
    "content": `
      <div class="space-y-4">
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-search mr-2 text-primary-400"></i>
            Search Quick Guide
          </h4>
          <ol class="list-decimal list-inside text-sm mt-2 space-y-1 text-slate-300">
            <li>Enter keywords in the search box</li>
            <li>Use advanced filters to refine results</li>
            <li>Click <strong class="text-primary-300">Search</strong> to view matches</li>
            <li>Clear filters to start a new search</li>
          </ol>
        </div>
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-lightbulb mr-2 text-yellow-400"></i>
            Pro Tips
          </h4>
          <ul class="text-sm mt-2 space-y-1 text-slate-300">
            <li>Use quotes for exact phrase matching</li>
            <li>Try various keyword combinations</li>
            <li>Look for highlighted results</li>
            <li>Bookmark frequent searches</li>
          </ul>
        </div>
      </div>
    `
  },
  "upload": {
    "title": "Upload JSON Diagrams",
    "content": `
      <div class="space-y-4">
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-upload mr-2 text-primary-400"></i>
            Upload Quick Guide
          </h4>
          <ol class="list-decimal list-inside text-sm mt-2 space-y-1 text-slate-300">
            <li>Drag & Drop JSON files into the drop zone</li>
            <li>Or click to select files from your computer</li>
            <li>Preview the selected files in the file list</li>
            <li>Click <strong class="text-primary-300">Upload JSON</strong> to begin</li>
          </ol>
        </div>
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
          <h4 class="font-medium flex items-center text-white">
            <i class="fas fa-lightbulb mr-2 text-yellow-400"></i>
            Pro Tips
          </h4>
          <ul class="text-sm mt-2 space-y-1 text-slate-300">
            <li>Ensure files are valid JSON and under 10MB</li>
            <li>Clear selections if you change your mind</li>
            <li>Watch the progress bar during upload</li>
            <li>Contact support if upload fails</li>
          </ul>
        </div>
      </div>
    `
  },
  "default": {
    "title": "Help Center",
    "content": `
      <div class="p-4 bg-dark-800 rounded-lg border border-slate-700">
        <p class="text-sm text-slate-300">
          For comprehensive documentation, please visit our
          <a href="/full-help" class="text-primary-400 hover:underline">Help Portal</a>.
        </p>
        <p class="text-sm mt-2 text-slate-300">
          Contact support at
          <a href="mailto:support@rulescentral.com" class="text-primary-400 hover:underline">support@rulescentral.com</a>
          for additional assistance.
        </p>
      </div>
    `
  }
};

// Helper function to show help content
function showHelp(page = 'default') {
  const helpData = window.helpContent[page] || window.helpContent['default'];

  // Create help modal HTML with higher z-index and improved styling
  const helpModal = `
    <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="help-modal-backdrop"></div>
      <div class="relative z-[10000] bg-dark-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700 transform transition-all duration-200 scale-95 opacity-0"
           id="help-modal-content">
        <div class="flex items-center justify-between p-5 border-b border-slate-700 bg-gradient-to-r from-dark-800 to-dark-850">
          <h3 class="text-xl font-bold text-white flex items-center">
            <i class="fas fa-question-circle mr-3 text-primary-400"></i>
            ${helpData.title}
          </h3>
          <button id="close-help" class="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <div class="p-5 text-slate-300 overflow-y-auto" style="max-height: calc(90vh - 120px)">
          ${helpData.content}
        </div>
        <div class="p-4 border-t border-slate-700 bg-dark-850 flex justify-end">
          <button id="close-help-btn" class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all flex items-center">
            <i class="fas fa-check mr-2"></i> Got it!
          </button>
        </div>
      </div>
    </div>
  `;

  // Add modal to DOM
  const modalContainer = document.createElement('div');
  modalContainer.id = 'help-modal';
  modalContainer.innerHTML = helpModal;
  document.body.appendChild(modalContainer);

  // Animate modal in
  setTimeout(() => {
    const content = document.getElementById('help-modal-content');
    content.classList.remove('scale-95', 'opacity-0');
    content.classList.add('scale-100', 'opacity-100');
  }, 10);

  // Add event listeners
  document.getElementById('close-help').addEventListener('click', closeHelp);
  document.getElementById('close-help-btn').addEventListener('click', closeHelp);
  document.getElementById('help-modal-backdrop').addEventListener('click', closeHelp);

  // Close on ESC key
  document.addEventListener('keydown', function helpKeyListener(e) {
    if (e.key === 'Escape') {
      closeHelp();
      document.removeEventListener('keydown', helpKeyListener);
    }
  });

  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
}

function closeHelp() {
  const modal = document.getElementById('help-modal');
  if (modal) {
    const content = document.getElementById('help-modal-content');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 200);
  }
}

// Initialize help system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add help button to header if it exists
  const header = document.querySelector('header');
  if (header) {
    const helpBtn = document.createElement('button');
    helpBtn.className = 'ml-4 p-2 text-slate-400 hover:text-primary-400 transition-colors relative group';
    helpBtn.innerHTML = `
      <i class="fas fa-question-circle text-lg"></i>
      <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-slate-700 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Help
      </span>
    `;
    helpBtn.title = 'Help';
    helpBtn.addEventListener('click', function() {
      // Get current page from URL or use default
      const path = window.location.pathname.split('/').pop().replace('.html', '') || 'default';
      showHelp(path);
    });

    // Add to header (try to find a suitable spot)
    const nav = header.querySelector('nav') || header.querySelector('.header-actions') || header;
    nav.appendChild(helpBtn);
  }
});