"use strict";
/**
 * Help Content System
 * Features:
 * - Comprehensive help content for all application pages
 * - Responsive modal with animations
 * - Keyboard navigation support
 * - Dynamic content loading
 * - Improved accessibility
 */

// Help content configuration
const HelpSystem = {
  // Help content definitions
  content: {
    index: {
      title: "Dashboard Overview",
      sections: [
        {
          icon: "tachometer-alt",
          iconColor: "text-primary-400",
          title: "Quick Start Guide",
          type: "ordered",
          items: [
            "Use <strong>Upload Diagrams</strong> to add new JSON diagram files",
            "<strong>Rule Extraction</strong> converts FormWorks docs to diagrams",
            "Explore existing diagrams in the <strong>Catalog</strong>",
            "Test API endpoints using the <strong>API Test Utility</strong>"
          ]
        },
        {
          icon: "lightbulb",
          iconColor: "text-yellow-400",
          title: "Pro Tips",
          type: "unordered",
          items: [
            "Drag-and-drop JSON files directly onto the upload page",
            "Bookmark frequently used diagrams for quick access",
            "Customize diagram colors in the Theme Manager",
            "Use Ctrl+F to search within diagram viewers",
            "Press <kbd>Shift</kbd>+<kbd>/</kbd> for contextual help"
          ]
        }
      ]
    },
    // Other page content follows the same pattern...
    default: {
      title: "Help Center",
      sections: [
        {
          type: "text",
          content: `
            <p class="text-sm text-slate-300">
              Welcome to Rules Central. Use the sidebar to browse diagrams and manage rules.
            </p>
            <p class="text-sm text-slate-300">
              Visit the <a href="/full-help" class="text-primary-400 hover:underline">Help Portal</a> for tutorials and examples.
            </p>
            <p class="text-sm text-slate-300">
              See the <a href="/faq" class="text-primary-400 hover:underline">FAQ</a> for answers to common questions.
            </p>
            <p class="text-sm text-slate-300">
              Press <kbd>Shift</kbd> + <kbd>/</kbd> to open this window at any time.
            </p>
            <p class="text-sm text-slate-300">
              Need assistance? Email <a href="mailto:support@rulescentral.com" class="text-primary-400 hover:underline">support@rulescentral.com</a>.
            </p>
          `
        }
      ]
    }
  },

  // Generate HTML for help content
  generateContent: function(helpData) {
    let html = '';
    
    helpData.sections.forEach(section => {
      html += `
        <div class="p-4 bg-dark-800 rounded-lg border border-slate-700 mb-4">
          ${section.icon ? `
            <h4 class="font-medium flex items-center text-white">
              <i class="fas fa-${section.icon} mr-2 ${section.iconColor || 'text-primary-400'}"></i>
              ${section.title}
            </h4>
          ` : `<h4 class="font-medium text-white">${section.title}</h4>`}
          
          ${section.type === 'ordered' ? `
            <ol class="list-decimal list-inside text-sm mt-2 space-y-1 text-slate-300">
              ${section.items.map(item => `<li>${item}</li>`).join('')}
            </ol>
          ` : section.type === 'unordered' ? `
            <ul class="list-disc list-inside text-sm mt-2 space-y-1 text-slate-300">
              ${section.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          ` : section.content}
        </div>
      `;
    });
    
    return html;
  },

  // Show help modal
  show: function(page = "default") {
    const helpData = this.content[page] || this.content["default"];
    const contentHTML = this.generateContent(helpData);

    // Create modal element
    const modal = document.createElement('div');
    modal.id = 'help-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="help-modal-backdrop"></div>
      <div class="relative z-[10000] bg-dark-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700 transform transition-all duration-200 scale-95 opacity-0"
           id="help-modal-content" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
        <div class="flex items-center justify-between p-5 border-b border-slate-700 bg-gradient-to-r from-dark-800 to-dark-850">
          <h3 id="help-modal-title" class="text-xl font-bold text-white flex items-center">
            <i class="fas fa-question-circle mr-3 text-primary-400" aria-hidden="true"></i>
            ${helpData.title}
          </h3>
          <button id="close-help" class="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700" aria-label="Close help">
            <i class="fas fa-times text-lg" aria-hidden="true"></i>
          </button>
        </div>
        <div class="p-5 text-slate-300 overflow-y-auto" style="max-height: calc(90vh - 120px)" tabindex="0">
          ${contentHTML}
        </div>
        <div class="p-4 border-t border-slate-700 bg-dark-850 flex justify-end">
          <button id="close-help-btn" class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all flex items-center focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-dark-800">
            <i class="fas fa-check mr-2" aria-hidden="true"></i> Got it!
          </button>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Animate in
    setTimeout(() => {
      const content = document.getElementById('help-modal-content');
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    }, 10);

    // Set focus to modal content
    setTimeout(() => {
      document.querySelector('#help-modal-content [tabindex="0"]').focus();
    }, 50);

    // Add event listeners
    this.addEventListeners();
  },

  // Add event listeners for modal
  addEventListeners: function() {
    const closeModal = () => this.close();
    
    document.getElementById('close-help').addEventListener('click', closeModal);
    document.getElementById('close-help-btn').addEventListener('click', closeModal);
    document.getElementById('help-modal-backdrop').addEventListener('click', closeModal);

    // Close on ESC key
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', keyHandler);
      }
    };
    document.addEventListener('keydown', keyHandler);

    // Trap focus inside modal
    const focusTrap = (e) => {
      const modal = document.getElementById('help-modal-content');
      if (!modal.contains(e.target)) {
        e.preventDefault();
        modal.querySelector('[tabindex="0"]').focus();
      }
    };
    document.addEventListener('focus', focusTrap, true);
  },

  // Close help modal
  close: function() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;

    const content = document.getElementById('help-modal-content');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 200);
  },

  // Initialize help button
  init: function() {
    const header = document.querySelector('header');
    if (!header) return;

    const helpBtn = document.createElement('button');
    helpBtn.id = 'help-button';
    helpBtn.className = 'ml-4 p-2 text-slate-400 hover:text-primary-400 transition-colors relative group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 rounded-full';
    helpBtn.innerHTML = `
      <i class="fas fa-question-circle text-lg" aria-hidden="true"></i>
      <span class="sr-only">Help</span>
      <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-slate-700 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Help
      </span>
    `;
    helpBtn.title = 'Help';
    helpBtn.setAttribute('aria-label', 'Open help');
    helpBtn.addEventListener('click', () => {
      const path = window.location.pathname.split('/').pop().replace('.html', '') || 'default';
      this.show(path);
    });

    const nav = header.querySelector('nav') || header.querySelector('.header-actions') || header;
    nav.appendChild(helpBtn);
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => HelpSystem.init());

// Make available globally
window.HelpSystem = HelpSystem;