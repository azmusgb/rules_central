'use strict';
// diagram.js - Complete Mermaid Diagram Editor Implementation

// Global variables
let panZoomInstance = null;
let isLightMode = false;
let configData = {};
let editor;
let mermaidInitialized = false;

// ======================
// Theme Management
// ======================

function initializeTheme() {
  if (localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    isLightMode = false;
  } else {
    isLightMode = true;
  }
}

function setupThemeToggle() {
  const maxAttempts = 5;
  let attempts = 0;

  const trySetup = () => {
    const toggleThemeButton = document.getElementById('theme-toggle');
    if (toggleThemeButton) {
      toggleThemeButton.addEventListener('click', function() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');

        html.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        isLightMode = !isDark;

        if (editor) {
          editor.setTheme(isLightMode ? "ace/theme/monokai" : "ace/theme/dracula");
        }

        const icon = toggleThemeButton.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-moon', !isDark);
          icon.classList.toggle('fa-sun', isDark);
        }

        initializeMermaid();
        if (editor) {
          renderMermaidDiagram(editor.getValue().trim());
        }
      });
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(trySetup, 300);
    }
  };

  trySetup();
}

// ======================
// Quick Actions Menu
// ======================

function setupQuickActions() {
  const quickActionsBtn = document.getElementById('quick-actions-button');
  const quickActionsMenu = document.getElementById('quick-actions-menu');

  // Gracefully handle missing elements
  if (!quickActionsBtn || !quickActionsMenu) {
    console.warn('Quick actions elements not found - feature disabled');
    return;
  }

  quickActionsBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    quickActionsMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', function(event) {
    if (!quickActionsBtn.contains(event.target) && !quickActionsMenu.contains(event.target)) {
      quickActionsMenu.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      quickActionsMenu.classList.add('hidden');
    }
  });
}

// ======================
// Export Modal
// ======================

function setupExportModal() {
  const exportModal = document.getElementById('export-modal');
  const exportModalContent = document.getElementById('export-modal-content');
  const exportButton = document.getElementById('export-diagram-button');
  const closeButton = document.getElementById('close-export-modal');

  if (!exportModal || !exportModalContent || !exportButton || !closeButton) {
    console.error('Export modal elements not found!');
    return;
  }

  exportButton.addEventListener('click', () => {
    exportModal.classList.remove('hidden');
    setTimeout(() => {
      exportModalContent.classList.remove('scale-95', 'opacity-0');
      exportModalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
  });

  closeButton.addEventListener('click', () => {
    exportModalContent.classList.remove('scale-100', 'opacity-100');
    exportModalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      exportModal.classList.add('hidden');
    }, 300);
  });

  setupExportOptions();
}

function setupExportOptions() {
  const exportOptions = document.querySelectorAll('.export-option');
  let selectedFormat = 'png';

  if (!exportOptions.length) {
    console.error('Export options not found!');
    return;
  }

  exportOptions.forEach(option => {
    option.addEventListener('click', function() {
      exportOptions.forEach(opt => {
        opt.classList.remove('border-primary-500', 'dark:border-primary-400', 'bg-primary-50', 'dark:bg-primary-900');
      });
      this.classList.add('border-primary-500', 'dark:border-primary-400', 'bg-primary-50', 'dark:bg-primary-900');
      selectedFormat = this.dataset.format;
    });
  });

  if (exportOptions.length > 0) {
    exportOptions[0].classList.add('border-primary-500', 'dark:border-primary-400', 'bg-primary-50', 'dark:bg-primary-900');
  }
}

// ======================
// Editor Functions
// ======================

function setupEditorToggle() {
  const toggleEditorButton = document.getElementById('toggle-editor-button');
  const editorColumn = document.getElementById('editor-column');
  const diagramColumn = document.getElementById('diagram-column');

  if (!toggleEditorButton || !editorColumn || !diagramColumn) {
    console.error('Editor toggle elements not found!');
    return;
  }

  // Initial state
  editorColumn.classList.add('hidden');
  diagramColumn.classList.add('lg:col-span-12');
  diagramColumn.classList.remove('lg:col-span-8');
  toggleEditorButton.innerHTML = '<i class="fas fa-code mr-2"></i> Show Editor';

  // Toggle handler
  toggleEditorButton.addEventListener('click', function() {
    editorColumn.classList.toggle('hidden');
    diagramColumn.classList.toggle('lg:col-span-8');
    diagramColumn.classList.toggle('lg:col-span-12');

    toggleEditorButton.innerHTML = editorColumn.classList.contains('hidden')
      ? '<i class="fas fa-code mr-2"></i> Show Editor'
      : '<i class="fas fa-eye-slash mr-2"></i> Hide Editor';

    if (!editorColumn.classList.contains('hidden') && editor) {
      editor.focus();
    }

    if (panZoomInstance) {
      setTimeout(() => {
        panZoomInstance.resize();
        panZoomInstance.fit();
        panZoomInstance.center();
      }, 100);
    }
  });
}

function initializeEditor() {
  try {
    const aceEditor = ace.edit("editor", {
      mode: "ace/mode/markdown",
      theme: isLightMode ? "ace/theme/monokai" : "ace/theme/dracula",
      fontSize: "12px",
      wrap: true,
      showPrintMargin: false,
      fontFamily: "'Fira Code', monospace",
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true
    });

    aceEditor.session.on('change', function() {
      const lineCount = aceEditor.session.getLength();
      const charCount = aceEditor.getValue().length;

      // Update line and character counts
      const lineCountEl = document.getElementById('line-count');
      const charCountEl = document.getElementById('char-count');
      if (lineCountEl) lineCountEl.textContent = lineCount;
      if (charCountEl) charCountEl.textContent = charCount;

      // Debounced diagram rendering
      clearTimeout(aceEditor.renderTimeout);
      aceEditor.renderTimeout = setTimeout(() => {
        renderMermaidDiagram(aceEditor.getValue().trim());
      }, 1000);
    });

    return aceEditor;
  } catch (error) {
    console.error("Failed to initialize editor:", error);
    showError("Failed to initialize code editor");
    return null;
  }
}
// ======================
// Enhanced Search Functions
// ======================

let currentMatchIndex = 0;
let totalMatches = 0;
let searchTerm = '';
let matchedElements = [];

function setupSearch() {
  const clearSearchButton = document.getElementById('clear-search');
  const searchInput = document.getElementById('search-svg-input');
  const prevMatchButton = document.getElementById('prev-match');
  const nextMatchButton = document.getElementById('next-match');
  const searchResultsCount = document.getElementById('search-results-count');

  // Clear search handler
  if (clearSearchButton) {
    clearSearchButton.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        clearSearchHighlights();
        resetSearchState();
      }
    });
  }

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      if (searchTerm) {
        performSearch(searchTerm);
      } else {
        clearSearchHighlights();
        resetSearchState();
      }
    });

    // Add keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        navigateToMatch(currentMatchIndex + 1);
      } else if (e.key === 'Escape') {
        clearSearchHighlights();
        resetSearchState();
        searchInput.value = '';
      }
    });
  }

  // Navigation buttons
  if (prevMatchButton) {
    prevMatchButton.addEventListener('click', () => navigateToMatch(currentMatchIndex - 1));
  }

  if (nextMatchButton) {
    nextMatchButton.addEventListener('click', () => navigateToMatch(currentMatchIndex + 1));
  }
}

function performSearch(term) {
  const diagramPreview = document.getElementById('diagram-preview');
  if (!diagramPreview) return;

  // Clear previous highlights
  clearSearchHighlights();
  matchedElements = [];

  // Find all text elements in the SVG
  const textElements = diagramPreview.querySelectorAll('text, foreignObject div');
  const lowerTerm = term.toLowerCase();

  textElements.forEach(element => {
    const textContent = element.textContent || element.innerText;
    if (textContent.toLowerCase().includes(lowerTerm)) {
      matchedElements.push(element);
    }
  });

  totalMatches = matchedElements.length;
  currentMatchIndex = totalMatches > 0 ? 0 : -1;

  updateSearchResultsDisplay();

  if (totalMatches > 0) {
    highlightMatches();
    navigateToMatch(0); // Jump to first match
  }
}

function highlightMatches() {
  matchedElements.forEach((element, index) => {
    // Create highlight effect
    const highlight = document.createElement('div');
    highlight.className = 'search-highlight';
    highlight.style.backgroundColor = 'rgba(234, 179, 8, 0.3)';
    highlight.style.borderRadius = '4px';
    highlight.style.padding = '0 2px';
    highlight.style.margin = '0 -2px';
    highlight.style.display = 'inline-block';

    // For foreignObject divs
    if (element.tagName.toLowerCase() === 'div') {
      const textNodes = findTextNodes(element);
      textNodes.forEach(node => {
        const span = document.createElement('span');
        span.className = 'search-highlight';
        span.style.backgroundColor = index === currentMatchIndex
          ? 'rgba(234, 179, 8, 0.6)'
          : 'rgba(234, 179, 8, 0.3)';
        span.style.borderRadius = '4px';
        span.style.padding = '0 2px';
        span.style.margin = '0 -2px';

        const range = document.createRange();
        range.selectNode(node);

        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      });
    } else { // For SVG text elements
      element.style.fill = index === currentMatchIndex ? '#f59e0b' : '#fbbf24';
      element.style.fontWeight = index === currentMatchIndex ? 'bold' : 'normal';
    }
  });
}

function findTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    if (node.nodeValue.trim() !== '') {
      textNodes.push(node);
    }
  }

  return textNodes;
}

function navigateToMatch(index) {
  if (totalMatches === 0) return;

  // Wrap around if needed
  if (index >= totalMatches) index = 0;
  if (index < 0) index = totalMatches - 1;

  // Update current index
  currentMatchIndex = index;
  updateSearchResultsDisplay();

  // Highlight the current match
  clearSearchHighlights();
  highlightMatches();

  // Scroll to the current match
  const currentElement = matchedElements[currentMatchIndex];
  if (currentElement) {
    currentElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });

    // For SVG elements, we may need to pan/zoom
    if (panZoomInstance && currentElement.getBBox) {
      const bbox = currentElement.getBBox();
      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;

      panZoomInstance.pan({
        x: -centerX + document.getElementById('diagram-preview').clientWidth / panZoomInstance.getZoom() / 2,
        y: -centerY + document.getElementById('diagram-preview').clientHeight / panZoomInstance.getZoom() / 2
      });
    }
  }
}

function updateSearchResultsDisplay() {
  const searchResultsCount = document.getElementById('search-results-count');
  if (searchResultsCount) {
    if (totalMatches > 0) {
      searchResultsCount.textContent = `${currentMatchIndex + 1}/${totalMatches}`;
      searchResultsCount.classList.remove('hidden');
    } else {
      searchResultsCount.classList.add('hidden');
    }
  }
}

function clearSearchHighlights() {
  const diagramPreview = document.getElementById('diagram-preview');
  if (!diagramPreview) return;

  // Remove all highlight spans
  diagramPreview.querySelectorAll('.search-highlight').forEach(highlight => {
    const parent = highlight.parentNode;
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight);
    }
    parent.removeChild(highlight);
  });

  // Reset SVG text styles
  diagramPreview.querySelectorAll('text').forEach(text => {
    text.style.fill = '';
    text.style.fontWeight = '';
  });
}

function resetSearchState() {
  currentMatchIndex = 0;
  totalMatches = 0;
  matchedElements = [];
  updateSearchResultsDisplay();
}
// ======================
// Context Menu
// ======================

function setupContextMenu() {
  const diagramContextMenu = document.getElementById('diagram-context-menu');
  const diagramPreview = document.getElementById('diagram-preview');

  // Gracefully handle missing elements
  if (!diagramContextMenu || !diagramPreview) {
    console.warn('Context menu elements not found - feature disabled');
    return;
  }

  diagramPreview.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    diagramContextMenu.style.top = `${e.pageY}px`;
    diagramContextMenu.style.left = `${e.pageX}px`;
    diagramContextMenu.classList.remove('hidden');
  });

  document.addEventListener('click', function() {
    diagramContextMenu.classList.add('hidden');
  });
}

// ======================
// Toast Notifications
// ======================

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');

  if (!toast || !toastMessage) {
    console.error('Toast elements not found!');
    return;
  }

  toastMessage.textContent = message;
  toast.className = 'toast';
  toast.classList.add('toast-' + type);

  setTimeout(() => {
    toast.classList.add('visible');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3000);
}

// ======================
// Mermaid Functions
// ======================

async function initializeMermaid() {
  try {
    if (!window.mermaid) {
      const mermaidModule = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
      window.mermaid = mermaidModule.default;
    }

    const themeName = isLightMode ? "light" : "dark";
    const themeConfig = configData.themes ? (configData.themes[themeName] || {}) : {};
    const themeVariables = themeConfig.themeVariables || {};

    let themeCSS = '';
    if (themeConfig.classDefs) {
      themeCSS = themeConfig.classDefs.split('\n').map(line => {
        const match = line.match(/^classDef\s+(\w+)\s+(.*)$/);
        return match ? `.${match[1]} rect, .${match[1]} polygon, .${match[1]} path { ${match[2].replace(/,/g, ';')} }` : '';
      }).join('\n');
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: "loose",
      htmlLabels: true,
      maxTextSize: 500000000,
      maxEdges: 1000000,
      themeVariables,
      themeCSS,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis"
      }
    });

    mermaidInitialized = true;
  } catch (error) {
    console.error("Mermaid initialization failed:", error);
    showToast("Failed to initialize diagram engine", "error");
  }
}

// ======================
// Diagram Rendering
// ======================

async function renderMermaidDiagram(code) {
  const diagramPreview = document.getElementById('diagram-preview');
  const spinnerOverlay = document.getElementById('spinner-overlay');

  if (!diagramPreview || !spinnerOverlay) {
    console.error('Diagram preview elements not found!');
    return;
  }

  // Clear existing pan/zoom
  if (panZoomInstance) {
    try {
      panZoomInstance.destroy();
    } catch (e) {
      console.warn("Error destroying panZoom instance:", e);
    }
    panZoomInstance = null;
  }

  // Clear minimap if exists
  const minimapContainer = document.querySelector('.minimap-container');
  if (minimapContainer) {
    minimapContainer.innerHTML = '<div id="minimap-viewport" class="absolute border-2 border-primary-500 dark:border-primary-400 opacity-50"></div>';
  }

  if (!code.trim()) {
    diagramPreview.innerHTML = `<p class="text-red-500">Diagram content is empty.</p>`;
    spinnerOverlay.classList.add('hidden');
    return;
  }

  // Show loading state
  spinnerOverlay.classList.remove('hidden');
  diagramPreview.innerHTML = "";

  try {
    if (!mermaidInitialized) {
      await initializeMermaid();
    }

    const { svg } = await mermaid.render('diagram', code);
    diagramPreview.innerHTML = svg;
    const svgElement = diagramPreview.querySelector('svg');

    if (!svgElement) {
      throw new Error("SVG element not found in rendered diagram");
    }

    // Style the SVG
    svgElement.style.width = '100%';
    svgElement.style.height = '100%';
    svgElement.style.display = 'block';

    // Set viewBox if not already set
    if (!svgElement.getAttribute('viewBox')) {
      try {
        const bbox = svgElement.getBBox();
        svgElement.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      } catch (e) {
        console.error("Couldn't set viewBox:", e);
      }
    }

    // Initialize pan/zoom
    initializePanZoom(svgElement);

    // Initialize minimap if elements exist
    if (document.getElementById('diagram-minimap')) {
      setTimeout(() => {
        initializeMinimap(svgElement);
      }, 300);
    }

  } catch (error) {
    console.error("Diagram rendering error:", error);
    diagramPreview.innerHTML = `
      <div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
        <p class="font-bold">Error rendering diagram</p>
        <p>${error.message}</p>
      </div>
    `;
  } finally {
    spinnerOverlay.classList.add('hidden');
  }
}

// ======================
// Pan/Zoom Functions
// ======================

function initializePanZoom(svgElement) {
  if (!svgElement) return;

  // Destroy existing instance
  if (panZoomInstance) {
    panZoomInstance.destroy();
  }

  panZoomInstance = svgPanZoom(svgElement, {
    zoomEnabled: true,
    controlIconsEnabled: false,
    fit: true,
    center: true,
    minZoom: 0.1,
    maxZoom: 10,
    zoomScaleSensitivity: 0.4,
    dblClickZoomEnabled: false
  });

  // Update zoom level display
  updateZoomLevel();

  // Ensure proper sizing after initialization
  setTimeout(() => {
    if (panZoomInstance) {
      panZoomInstance.resize();
      panZoomInstance.fit();
      panZoomInstance.center();
    }
  }, 300);
}

function updateZoomLevel() {
  if (!panZoomInstance) return;
  const zoomLevel = document.getElementById('zoom-level');
  if (zoomLevel) {
    zoomLevel.textContent = `${Math.round(panZoomInstance.getZoom() * 100)}%`;
  }
}

// ======================
// Minimap Functions
// ======================

function initializeMinimap(svgElement) {
  const minimap = document.getElementById('diagram-minimap');
  if (!minimap || !svgElement) {
    console.warn('Minimap elements not found - feature disabled');
    return;
  }

  const minimapContainer = minimap.querySelector('.minimap-container');
  const viewportIndicator = minimap.querySelector('#minimap-viewport');

  if (!minimapContainer || !viewportIndicator) {
    console.warn('Minimap container elements not found');
    return;
  }

  // Clear existing content
  minimapContainer.innerHTML = '';

  // Get dimensions
  const bbox = svgElement.getBBox();
  const svgWidth = bbox.width;
  const svgHeight = bbox.height;
  const containerWidth = minimapContainer.clientWidth;
  const containerHeight = minimapContainer.clientHeight;

  // Calculate scale
  const scale = Math.min(
    containerWidth / svgWidth * 0.9,
    containerHeight / svgHeight * 0.9
  );

  // Create minimap SVG
  const minimapSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  minimapSvg.setAttribute('width', '100%');
  minimapSvg.setAttribute('height', '100%');
  minimapSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  minimapSvg.style.transform = `scale(${scale})`;
  minimapSvg.style.transformOrigin = '0 0';

  // Clone the diagram SVG
  const svgClone = svgElement.cloneNode(true);
  svgClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  minimapSvg.appendChild(svgClone);
  minimapContainer.appendChild(minimapSvg);

  // Update viewport indicator
  function updateViewport() {
    if (!panZoomInstance) return;

    const zoom = panZoomInstance.getZoom();
    const pan = panZoomInstance.getPan();
    const container = document.getElementById('diagram-preview');

    if (!container) return;

    const viewportWidth = container.clientWidth / zoom;
    const viewportHeight = container.clientHeight / zoom;

    const x = (-pan.x / svgWidth) * containerWidth;
    const y = (-pan.y / svgHeight) * containerHeight;
    const width = (viewportWidth / svgWidth) * containerWidth;
    const height = (viewportHeight / svgHeight) * containerHeight;

    viewportIndicator.style.width = `${width}px`;
    viewportIndicator.style.height = `${height}px`;
    viewportIndicator.style.left = `${x}px`;
    viewportIndicator.style.top = `${y}px`;
  }

  // Click to navigate
  minimapContainer.addEventListener('click', (e) => {
    if (!panZoomInstance) return;

    const rect = minimapContainer.getBoundingClientRect();
    const x = (e.clientX - rect.left) / containerWidth * svgWidth;
    const y = (e.clientY - rect.top) / containerHeight * svgHeight;

    const container = document.getElementById('diagram-preview');
    if (!container) return;

    panZoomInstance.pan({
      x: -x + container.clientWidth / panZoomInstance.getZoom() / 2,
      y: -y + container.clientHeight / panZoomInstance.getZoom() / 2
    });
  });

  // Update on changes
  panZoomInstance.setOnPan(updateViewport);
  panZoomInstance.setOnZoom(() => {
    updateViewport();
    updateZoomLevel();
  });

  updateViewport();
}

// ======================
// Zoom Controls
// ======================

function setupZoomControls() {
  const zoomInButton = document.getElementById('zoom-in-button');
  const zoomOutButton = document.getElementById('zoom-out-button');
  const fitViewButton = document.getElementById('reset-zoom-button');

  if (zoomInButton) {
    zoomInButton.addEventListener('click', () => {
      if (panZoomInstance) {
        panZoomInstance.zoomIn();
        updateZoomLevel();
      }
    });
  }

  if (zoomOutButton) {
    zoomOutButton.addEventListener('click', () => {
      if (panZoomInstance) {
        panZoomInstance.zoomOut();
        updateZoomLevel();
      }
    });
  }

  if (fitViewButton) {
    fitViewButton.addEventListener('click', () => {
      if (panZoomInstance) {
        panZoomInstance.fit();
        panZoomInstance.center();
        updateZoomLevel();
      }
    });
  }
}

// ======================
// URL Parameters & Diagram Loading
// ======================

async function loadDiagramFromURL() {
  const params = new URLSearchParams(window.location.search);
  const rootName = params.get('root_name') || document.body.getAttribute("data-root-name");
  const diagramName = params.get('diagramName') || params.get('diagram_name') || document.body.getAttribute("data-diagram-name");

  if (!rootName || !diagramName) {
    showError("Missing diagram parameters in URL");
    return;
  }

  try {
    const response = await fetch(`/diagrams/${encodeURIComponent(rootName)}/${encodeURIComponent(diagramName)}`);

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const diagramText = await response.text();

    if (!editor) {
      throw new Error("Editor not initialized");
    }

    editor.setValue(diagramText, -1);
    renderMermaidDiagram(diagramText);
  } catch (err) {
    console.error("Diagram load error:", err);
    showError(`Failed to load diagram: ${err.message}`);
  }
}

function showError(message) {
  const diagramPreview = document.getElementById('diagram-preview');

  if (!diagramPreview) {
    console.error('Diagram preview element not found!');
    return;
  }

  diagramPreview.innerHTML = `
    <div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
      <p class="font-bold">Error</p>
      <p>${message}</p>
      <p>Path: ${window.location.pathname}${window.location.search}</p>
    </div>
  `;
}

// ======================
// Animation Functions
// ======================

function setupAnimations() {
  const animatedElements = document.querySelectorAll('[data-animate]');
  animatedElements.forEach(el => {
    const delay = el.dataset.animate * 100;
    el.style.animationDelay = `${delay}ms`;
  });
}

// ======================
// Window Resize Handling
// ======================

function setupResizeListener() {
  window.addEventListener('resize', debounce(() => {
    if (panZoomInstance) {
      panZoomInstance.resize();
      panZoomInstance.fit();
      panZoomInstance.center();
      updateZoomLevel();
    }
  }, 250));
}

// ======================
// Fullscreen Functions
// ======================

function setupFullscreenButton() {
  const fullscreenButton = document.getElementById('fullscreen-button');
  if (!fullscreenButton) return;

  fullscreenButton.addEventListener('click', toggleFullscreen);
}

function toggleFullscreen() {
  const diagramPreview = document.getElementById('diagram-preview');
  if (!diagramPreview) return;

  if (!document.fullscreenElement) {
    diagramPreview.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

// ======================
// Utility Functions
// ======================

function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// ======================
// Main Initialization
// ======================

async function initializeApp() {
  try {
    // Load configuration
    try {
      const res = await fetch('/config/config.json');
      if (res.ok) {
        configData = await res.json();
        console.log("✅ Config loaded:", configData);
      }
    } catch (err) {
      console.error("Error loading config.json:", err);
      configData = {};
    }

    // Initialize theme and UI components
    initializeTheme();
    setupThemeToggle();
    setupQuickActions();
    setupExportModal();
    setupEditorToggle();
    setupSearch();
    setupContextMenu();
    setupAnimations();
    setupZoomControls();
    setupFullscreenButton();
    setupResizeListener();

    // Initialize editor and Mermaid
    editor = initializeEditor();
    await initializeMermaid();

    // Load initial content
    if (window.location.search) {
      await loadDiagramFromURL();
    } else if (editor) {
      const defaultContent = `graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Action]\n    B -->|No| D[Alternative]`;
      editor.setValue(defaultContent, -1);
      renderMermaidDiagram(defaultContent);
    }

    // Show ready message
    setTimeout(() => {
      showToast('Diagram editor ready!');
    }, 1500);

  } catch (error) {
    console.error("Initialization error:", error);
    showError("Failed to initialize application. Please refresh the page.");
  }
}

// ======================
// Start the Application
// ======================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}