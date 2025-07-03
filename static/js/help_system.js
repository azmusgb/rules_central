'use strict';
// Lightweight help panel system
document.addEventListener('DOMContentLoaded', () => {
    const helpButton = document.getElementById('help-button');
    const helpPanel = document.getElementById('help-panel');
    const closeHelp = document.getElementById('close-help');
    const helpContentDiv = document.getElementById('help-content');

    if (!helpButton || !helpPanel) {
        console.error('Help system elements not found.');
        return;
    }

    let isHelpOpen = false;

    const toggleHelpPanel = (e) => {
        if (e) e.stopPropagation();
        isHelpOpen = !isHelpOpen;
        helpButton.setAttribute('aria-expanded', isHelpOpen.toString());
        if (isHelpOpen) {
            helpPanel.classList.remove('hidden');
            helpPanel.classList.add('show');
            loadHelpContent();
            helpPanel.focus();
        } else {
            helpPanel.classList.remove('show');
            setTimeout(() => helpPanel.classList.add('hidden'), 300);
        }
    };

    const loadHelpContent = () => {
        const page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        const content = window.helpContent[page] || window.helpContent['default'];
        if (content && helpContentDiv) {
            helpContentDiv.innerHTML = content.content;
        }
    };

    const closeHelpPanel = (e) => {
        if (e) e.stopPropagation();
        if (isHelpOpen) {
            toggleHelpPanel();
        }
    };

    // Event listeners
    helpButton.addEventListener('click', toggleHelpPanel);
    if (closeHelp) {
        closeHelp.addEventListener('click', closeHelpPanel);
    }

    // Close when clicking outside the panel
    document.addEventListener('click', (e) => {
        if (isHelpOpen && !helpPanel.contains(e.target)) {
            closeHelpPanel(e);
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isHelpOpen) {
            closeHelpPanel(e);
        }
    });

    // Prevent clicks inside the panel from closing it
    helpPanel.addEventListener('click', (e) => e.stopPropagation());
});