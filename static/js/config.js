
-----------------

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------
    // Configuration and DOM Cache
    // ---------------------------
    let config = {
        themes: {},
        currentTheme: null,
        pickrInstances: {},
        edgeSettings: {
            color: '#f66',
            width: 2
        }
    };

    const elements = {
        themeSelect: document.getElementById('themeSelect'),
        themeList: document.getElementById('themeList'),
        themeSearch: document.getElementById('themeSearch'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        resetSearchView: document.getElementById('resetSearchView'),
        resultsCount: document.getElementById('resultsCount'),
        noThemesMessage: document.getElementById('noThemesMessage'),
        noSearchResults: document.getElementById('noSearchResults'),
        currentThemeTitle: document.getElementById('currentThemeTitle'),
        saveBtn: document.getElementById('saveBtn'),
        exportBtn: document.getElementById('exportBtn'),
        importBtn: document.getElementById('importBtn'),
        importFile: document.getElementById('importFile'),
        newThemeBtn: document.getElementById('newThemeBtn'),
        duplicateThemeBtn: document.getElementById('duplicateThemeBtn'),
        resetThemeBtn: document.getElementById('resetThemeBtn'),
        deleteThemeBtn: document.getElementById('deleteThemeBtn'),
        diagramContainer: document.getElementById('diagramContainer'),
        toast: document.getElementById('toast'),
        toastMessage: document.getElementById('toastMessage'),
        newThemeModal: document.getElementById('newThemeModal'),
        newThemeName: document.getElementById('newThemeName'),
        baseThemeSelect: document.getElementById('baseThemeSelect'),
        cancelNewTheme: document.getElementById('cancelNewTheme'),
        confirmNewTheme: document.getElementById('confirmNewTheme'),
        confirmDeleteModal: document.getElementById('confirmDeleteModal'),
        themeToDelete: document.getElementById('themeToDelete'),
        cancelDelete: document.getElementById('cancelDelete'),
        confirmDelete: document.getElementById('confirmDelete'),
        classDefsEditor: document.getElementById('classDefsEditor'),
        applyClassDefs: document.getElementById('applyClassDefs'),
        previewLayout: document.getElementById('previewLayout'),
        refreshPreview: document.getElementById('refreshPreview'),
        edgeWidth: document.querySelector('[data-target="edgeWidth"]'),
        edgeWidthValue: document.getElementById('edgeWidthValue'),
        nodePreviews: {
            disabled: document.getElementById('disabledPreview'),
            diamond: document.getElementById('diamondPreview'),
            set: document.getElementById('setPreview'),
            plug: document.getElementById('plugPreview'),
            rect: document.getElementById('rectPreview')
        },
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabContents: {
            colors: document.getElementById('colorsTab'),
            advanced: document.getElementById('advancedTab'),
            preview: document.getElementById('previewTab')
        }
    };

    // ---------------------------
    // Navigation Protection
    // ---------------------------
    function isNavigationLink(target) {
        // Check if the clicked element or any of its parents is a nav link
        const navLink = target.closest('a.nav-link');
        return navLink !== null;
    }

    // ---------------------------
    // Initialization
    // ---------------------------
    async function init() {
        await loadConfig();
        setupEventListeners();
        renderThemeList();
        setupColorPickers();
        setupTabNavigation();
        setupThemeGroupToggle();
    }

    // ---------------------------
    // Configuration Loading/Saving
    // ---------------------------
    async function loadConfig() {
        try {
            const response = await fetch('/config/config.json');
            if (!response.ok) throw new Error('Failed to load config');
            const data = await response.json();
            config.themes = data.themes || {};

            // Set a default theme if none selected
            if (!config.currentTheme && Object.keys(config.themes).length > 0) {
                config.currentTheme = Object.keys(config.themes)[0];
            }
            updateUI();
        } catch (error) {
            console.error('Error loading config:', error);
            showToast('Failed to load configuration', 'error');
        }
    }

    async function saveConfig() {
        try {
            elements.saveBtn.disabled = true;
            elements.saveBtn.innerHTML = '<span class="material-icons mr-2 animate-spin">autorenew</span> Saving...';

            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    themes: config.themes,
                    edgeSettings: config.edgeSettings
                })
            });

            if (!response.ok) throw new Error('Server error');
            showToast('Theme saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            showToast('Failed to save theme', 'error');
            return false;
        } finally {
            elements.saveBtn.disabled = false;
            elements.saveBtn.innerHTML = '<span class="material-icons mr-2">save</span> Save Changes';
        }
    }

    // ---------------------------
    // UI Update Functions
    // ---------------------------
    function updateUI() {
        renderThemeList();

        if (config.currentTheme) {
            const theme = config.themes[config.currentTheme];
            elements.currentThemeTitle.textContent = `Editing: ${config.currentTheme}`;
            updateNodePreviews(theme);
            elements.classDefsEditor.value = theme.classDefs || '';

            if (theme.edgeSettings) {
                config.edgeSettings = theme.edgeSettings;
            }
            elements.edgeWidth.value = config.edgeSettings.width;
            elements.edgeWidthValue.textContent = config.edgeSettings.width;
            renderDiagram();

            document.body.style.backgroundColor = theme.defaults?.background || '#ffffff';
            document.body.style.color = theme.defaults?.textColor || '#000000';
        } else {
            elements.currentThemeTitle.textContent = 'No theme selected';
            elements.classDefsEditor.value = '';
        }
    }

    function renderThemeList() {
        elements.themeList.innerHTML = '';
        const searchTerm = elements.themeSearch.value.toLowerCase();
        const filteredThemes = Object.entries(config.themes)
            .filter(([name]) => name.toLowerCase().includes(searchTerm));

        if (elements.resultsCount) {
            elements.resultsCount.textContent = filteredThemes.length;
        }

        if (filteredThemes.length === 0) {
            elements.themeList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          No themes found${searchTerm ? ' matching your search' : ''}
        </div>
      `;
            if (elements.noSearchResults) {
                elements.noSearchResults.classList.remove('hidden');
            }
            return;
        } else {
            if (elements.noSearchResults) {
                elements.noSearchResults.classList.add('hidden');
            }
        }

        filteredThemes.forEach(([name, theme]) => {
            const card = document.createElement('div');
            card.className = `theme-card p-4 border rounded-lg cursor-pointer transition-colors ${
        name === config.currentTheme ? 'active' : 'border-gray-200 hover:border-blue-300'
      }`;
            card.innerHTML = `
        <div class="flex justify-between items-start">
          <h3 class="font-medium">${name}</h3>
          <div class="theme-actions flex">
            <button class="p-1 text-gray-400 hover:text-blue-600" data-action="duplicate" data-theme="${name}" title="Duplicate theme">
              <span class="material-icons text-sm">content_copy</span>
            </button>
            <button class="p-1 text-gray-400 hover:text-red-600 ml-1" data-action="delete" data-theme="${name}" title="Delete theme">
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>
        <div class="mt-3 flex justify-between">
          <div class="flex gap-1">
            <span class="color-swatch" style="background-color: ${theme.defaults?.classDisabled || '#707070'}" title="Disabled"></span>
            <span class="color-swatch" style="background-color: ${theme.defaults?.classDiamond || '#906F38'}" title="Diamond"></span>
            <span class="color-swatch" style="background-color: ${theme.defaults?.classSet || '#2C5E3E'}" title="Set"></span>
            <span class="color-swatch" style="background-color: ${theme.defaults?.classPlug || '#384674'}" title="Plug"></span>
          </div>
          <span class="text-xs text-gray-500">${new Date().toLocaleDateString()}</span>
        </div>
      `;

            card.addEventListener('click', (e) => {
                // Skip if this is a navigation click
                if (isNavigationLink(e.target)) return;

                if (!e.target.closest('[data-action]')) {
                    config.currentTheme = name;
                    updateUI();
                }
            });

            card.querySelector('[data-action="duplicate"]')?.addEventListener('click', (e) => {
                if (isNavigationLink(e.target)) return;
                e.stopPropagation();
                duplicateTheme(name);
            });

            card.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
                if (isNavigationLink(e.target)) return;
                e.stopPropagation();
                showDeleteModal(name);
            });

            if (searchTerm) {
                const titleEl = card.querySelector('h3');
                titleEl.innerHTML = titleEl.textContent.replace(
                    new RegExp(searchTerm, 'gi'),
                    match => `<span class="highlight">${match}</span>`
                );
            }

            elements.themeList.appendChild(card);
        });
    }


    function updateNodePreviews(theme) {
        const classDefs = parseClassDefs(theme.classDefs);
        Object.keys(elements.nodePreviews).forEach(type => {
            const className = `class${type.charAt(0).toUpperCase() + type.slice(1)}`;
            const style = classDefs[className] || {};
            const node = elements.nodePreviews[type];
            node.style.backgroundColor = style.fill || '#ffffff';
            node.style.borderColor = style.stroke || '#000000';
            node.style.color = style.color || '#000000';

            if (config.pickrInstances[className]) {
                config.pickrInstances[className].setColor(style.fill || '#ffffff');
            }
        });
    }

    // ---------------------------
    // Color Pickers (with merged options)
    // ---------------------------
    function setupColorPickers() {
        document.querySelectorAll('.color-picker').forEach(pickerEl => {
            const target = pickerEl.dataset.target;
            if (config.pickrInstances[target]) {
                config.pickrInstances[target].destroy();
            }

            // Determine default color from theme if available
            let defaultColor = '#ffffff';
            if (config.currentTheme && config.themes[config.currentTheme]) {
                const classDefs = parseClassDefs(config.themes[config.currentTheme].classDefs);
                if (classDefs[target]) {
                    defaultColor = classDefs[target].fill || defaultColor;
                }
            }

            const pickr = Pickr.create({
                el: pickerEl,
                container: pickerEl.closest('.style-control-group'),
                theme: 'nano',
                default: defaultColor,
                swatches: [
                    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
                    '#0ea5e9', '#84cc16', '#f97316', '#d946ef', '#a855f7'
                ],
                components: {
                    preview: true,
                    opacity: true,
                    hue: true,
                    interaction: {
                        hex: true,
                        rgba: true,
                        hsla: true,
                        input: true,
                        save: true
                    }
                },
                appClass: 'custom-pickr',
                useAsButton: false,
                position: 'bottom-middle'
            });

            pickr.on('show', () => {
                const pickrRoot = pickr.getRoot();
                const triggerBtn = pickr.getButton();
                const rect = triggerBtn.getBoundingClientRect();
                pickrRoot.style.position = 'absolute';
                pickrRoot.style.top = `${rect.bottom + window.scrollY + 5}px`;
                pickrRoot.style.left = `${rect.left + window.scrollX}px`;
            });

            pickr.on('save', (color) => {
                if (!color || !config.currentTheme) return;
                const hexColor = color.toHEXA().toString();
                updateClassDef(config.currentTheme, target, 'fill', hexColor);
                updateNodePreviews(config.themes[config.currentTheme]);
                renderDiagram();
            });

            config.pickrInstances[target] = pickr;
        });
    }

    // ---------------------------
    // Tab Navigation (uses elements.tabBtns and tabContents)
    // ---------------------------
    function setupTabNavigation() {
        elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.tabBtns.forEach(b => b.classList.remove('active', 'border-blue-500'));
                btn.classList.add('active', 'border-blue-500');

                const tabName = btn.dataset.tab;
                Object.values(elements.tabContents).forEach(content => {
                    content.classList.remove('active');
                });
                elements.tabContents[tabName].classList.add('active');
            });
        });
    }

    // ---------------------------
    // Helper Functions for Class Definitions
    // ---------------------------
    function updateClassDef(themeName, className, property, value) {
        if (!config.themes[themeName]) return;
        const classDefs = parseClassDefs(config.themes[themeName].classDefs);
        if (!classDefs[className]) {
            classDefs[className] = {};
        }
        classDefs[className][property] = value;
        config.themes[themeName].classDefs = generateClassDefs(classDefs);
        elements.classDefsEditor.value = config.themes[themeName].classDefs;
    }

    function parseClassDefs(classDefs) {
        const result = {};
        (classDefs || '').split('\n').forEach(line => {
            const match = line.match(/classDef\s+(\w+)\s+(.*)/);
            if (match) {
                const [, className, props] = match;
                result[className] = {};
                props.split(',').forEach(prop => {
                    const [key, value] = prop.split(':').map(s => s.trim());
                    if (key && value) {
                        result[className][key] = value;
                    }
                });
            }
        });
        return result;
    }

    function generateClassDefs(classDefs) {
        return Object.entries(classDefs)
            .map(([className, props]) => {
                const propString = Object.entries(props)
                    .map(([key, value]) => `${key}:${value}`)
                    .join(',');
                return `classDef ${className} ${propString}`;
            })
            .join('\n');
    }

    // ---------------------------
    // Diagram Rendering using Mermaid
    // ---------------------------
    function renderDiagram() {
        if (!config.currentTheme) return;
        const theme = config.themes[config.currentTheme];
        const classDefs = theme.classDefs || '';
        const layout = elements.previewLayout.value || 'TD';
        const graph = `
      flowchart ${layout}
        A[Disabled]:::classDisabled
        B{Diamond}:::classDiamond
        C([Set]):::classSet
        D[/Plug/]:::classPlug
        E[Rectangle]:::classRect
        A --> B --> C --> D --> E
        linkStyle default stroke:${config.edgeSettings.color},stroke-width:${config.edgeSettings.width}px

        ${classDefs}
    `;
        mermaid.render('preview-diagram', graph)
            .then(({
                svg
            }) => {
                elements.diagramContainer.innerHTML = svg;
            })
            .catch(err => {
                console.error('Mermaid rendering error:', err);
                elements.diagramContainer.innerHTML = `<div class="text-red-500 p-4">Diagram error: ${err.message}</div>`;
            });
    }

    // ---------------------------
    // Theme Management Functions
    // ---------------------------
    function createNewTheme(name, baseTheme = null) {
        if (!name || config.themes[name]) {
            showToast('Theme name already exists or is invalid', 'error');
            return false;
        }
        const newTheme = baseTheme ?
            JSON.parse(JSON.stringify(config.themes[baseTheme])) : {
                defaults: {
                    classDisabled: '#707070',
                    classDiamond: '#906F38',
                    classSet: '#2C5E3E',
                    classPlug: '#384674',
                    classRect: '#153A60'
                },
                custom: {},
                classDefs: `
          classDef classDisabled fill:#707070,stroke:#222,color:#000
          classDef classDiamond fill:#906F38,stroke:#222,color:#000
          classDef classSet fill:#2C5E3E,stroke:#222,color:#000
          classDef classPlug fill:#384674,stroke:#222,color:#000
          classDef classRect fill:#153A60,stroke:#222,color:#000
        `.trim(),
                edgeSettings: {
                    color: '#f66',
                    width: 2
                }
            };

        config.themes[name] = newTheme;
        config.currentTheme = name;
        updateUI();
        showToast(`Created new theme: ${name}`);
        return true;
    }

    function duplicateTheme(themeName) {
        if (!themeName || !config.themes[themeName]) return;
        let newName = `${themeName} Copy`;
        let counter = 1;
        while (config.themes[newName]) {
            newName = `${themeName} Copy ${counter++}`;
        }
        createNewTheme(newName, themeName);
    }

    function resetTheme() {
        if (!config.currentTheme) return;
        const theme = config.themes[config.currentTheme];
        if (!theme.defaults) return;
        const classDefs = parseClassDefs(theme.classDefs);
        Object.keys(theme.defaults).forEach(key => {
            if (classDefs[key] && theme.defaults[key]) {
                classDefs[key].fill = theme.defaults[key];
            }
        });
        theme.classDefs = generateClassDefs(classDefs);
        updateUI();
        showToast(`Reset ${config.currentTheme} to defaults`);
    }

    function showDeleteModal(themeName) {
        elements.themeToDelete.textContent = themeName;
        elements.confirmDeleteModal.classList.remove('hidden');

        const confirmHandler = () => {
            deleteTheme(themeName);
            elements.confirmDeleteModal.classList.add('hidden');
            elements.confirmDelete.removeEventListener('click', confirmHandler);
        };

        const cancelHandler = () => {
            elements.confirmDeleteModal.classList.add('hidden');
            elements.confirmDelete.removeEventListener('click', confirmHandler);
            elements.cancelDelete.removeEventListener('click', cancelHandler);
        };

        elements.confirmDelete.addEventListener('click', confirmHandler);
        elements.cancelDelete.addEventListener('click', cancelHandler);
    }

    function deleteTheme(themeName) {
        if (!themeName || !config.themes[themeName] || Object.keys(config.themes).length <= 1) {
            showToast('Cannot delete the only theme', 'error');
            return;
        }
        delete config.themes[themeName];
        if (config.currentTheme === themeName) {
            config.currentTheme = Object.keys(config.themes)[0];
        }
        updateUI();
        showToast(`Theme "${themeName}" deleted`);
    }

    function exportThemes() {
        const data = JSON.stringify({
            themes: config.themes,
            edgeSettings: config.edgeSettings
        }, null, 2);
        const blob = new Blob([data], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mermaid-themes-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Themes exported');
    }

    function importThemes(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!imported.themes) {
                    throw new Error('Invalid theme file format');
                }
                Object.keys(imported.themes).forEach(name => {
                    let themeName = name;
                    let counter = 1;
                    while (config.themes[themeName]) {
                        themeName = `${name} (${counter++})`;
                    }
                    config.themes[themeName] = imported.themes[name];
                });
                if (imported.edgeSettings) {
                    config.edgeSettings = imported.edgeSettings;
                }
                updateUI();
                showToast('Themes imported successfully');
            } catch (error) {
                console.error('Error importing themes:', error);
                showToast('Invalid theme file', 'error');
            }
        };
        reader.readAsText(file);
    }

    // ---------------------------
    // Toast Notification (Merged Implementation)
    // ---------------------------
    function showToast(message, type = 'success') {
        elements.toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 flex items-center ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white`;
        elements.toastMessage.textContent = message;
        elements.toast.classList.remove('hidden', 'opacity-0', 'translate-y-4');
        elements.toast.classList.add('opacity-100', 'translate-y-0');

        setTimeout(() => {
            elements.toast.classList.add('opacity-0', 'translate-y-4');
            setTimeout(() => {
                elements.toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }

    // ---------------------------
    // Open Color Picker for Editing Additional Properties
    // ---------------------------
    function openColorPickerForProperty(className, property) {
        if (!config.currentTheme) return;
        const theme = config.themes[config.currentTheme];
        const classDefs = parseClassDefs(theme.classDefs);
        const currentColor = classDefs[className]?.[property] || '#000000';
        const triggerBtn = document.querySelector(`[data-target="${className}"][data-action="edit-${property === 'color' ? 'text' : 'border'}-color"]`);

        const pickr = Pickr.create({
            el: document.createElement('div'),
            container: triggerBtn.closest('.style-control-group'),
            theme: 'nano',
            default: currentColor,
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    input: true,
                    save: true
                }
            },
            appClass: 'custom-pickr',
            useAsButton: false,
            position: 'bottom-middle'
        });

        pickr.on('show', () => {
            const pickrRoot = pickr.getRoot();
            const rect = triggerBtn.getBoundingClientRect();
            pickrRoot.style.position = 'absolute';
            pickrRoot.style.top = `${rect.bottom + window.scrollY + 5}px`;
            pickrRoot.style.left = `${rect.left + window.scrollX}px`;
        });

        pickr.on('save', (color) => {
            if (!color) return;
            const hexColor = color.toHEXA().toString();
            updateClassDef(config.currentTheme, className, property, hexColor);
            updateNodePreviews(theme);
            renderDiagram();
            pickr.destroy();
        });

        pickr.on('hide', () => {
            pickr.destroy();
        });

        pickr.show();
    }

    // ---------------------------
    // Setup Extra Event Listeners (Merging first snippet’s UI behaviors)
    // ---------------------------
    function setupEventListeners() {
        // Global click handler to protect navigation
        document.addEventListener('click', (e) => {
            if (isNavigationLink(e.target)) {
                return; // Allow default navigation behavior
            }
        });

        // Theme search functionality
        elements.themeSearch.addEventListener('input', () => {
            renderThemeList();
        });

        if (elements.clearSearchBtn) {
            elements.clearSearchBtn.addEventListener('click', () => {
                elements.themeSearch.value = '';
                renderThemeList();
            });
        }

        if (elements.resetSearchView) {
            elements.resetSearchView.addEventListener('click', () => {
                elements.themeSearch.value = '';
                renderThemeList();
            });
        }

        // Theme management buttons
        elements.saveBtn?.addEventListener('click', saveConfig);
        elements.exportBtn?.addEventListener('click', exportThemes);
        elements.importBtn?.addEventListener('click', () => {
            elements.importFile.click();
        });

        elements.importFile?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importThemes(e.target.files[0]);
                e.target.value = '';
            }
        });

        elements.newThemeBtn?.addEventListener('click', () => {
            elements.newThemeName.value = '';
            elements.baseThemeSelect.innerHTML = '<option value="">-- Create from scratch --</option>';
            Object.keys(config.themes).forEach(theme => {
                const option = document.createElement('option');
                option.value = theme;
                option.textContent = theme;
                elements.baseThemeSelect.appendChild(option);
            });
            elements.newThemeModal.classList.remove('hidden');
        });

        elements.cancelNewTheme?.addEventListener('click', () => {
            elements.newThemeModal.classList.add('hidden');
        });

        elements.confirmNewTheme?.addEventListener('click', () => {
            const name = elements.newThemeName.value.trim();
            const baseTheme = elements.baseThemeSelect.value;
            if (name && createNewTheme(name, baseTheme)) {
                elements.newThemeModal.classList.add('hidden');
            }
        });

        elements.duplicateThemeBtn?.addEventListener('click', () => {
            if (config.currentTheme) {
                duplicateTheme(config.currentTheme);
            }
        });

        elements.resetThemeBtn?.addEventListener('click', resetTheme);
        elements.deleteThemeBtn?.addEventListener('click', () => {
            if (config.currentTheme) {
                showDeleteModal(config.currentTheme);
            }
        });

        // Diagram controls
        elements.applyClassDefs?.addEventListener('click', () => {
            if (!config.currentTheme) return;
            config.themes[config.currentTheme].classDefs = elements.classDefsEditor.value;
            updateNodePreviews(config.themes[config.currentTheme]);
            renderDiagram();
            showToast('Class definitions applied');
        });

        elements.edgeWidth?.addEventListener('input', (e) => {
            const width = parseInt(e.target.value);
            config.edgeSettings.width = width;
            elements.edgeWidthValue.textContent = width;
            renderDiagram();
        });

        elements.previewLayout?.addEventListener('change', renderDiagram);
        elements.refreshPreview?.addEventListener('click', renderDiagram);

        // Node preview click handlers
        Object.values(elements.nodePreviews).forEach(node => {
            node?.addEventListener('click', () => {
                const nodeType = node.dataset.nodeType;
                const tabBtns = Array.from(elements.tabBtns);
                const advancedTabBtn = tabBtns.find(btn => btn.dataset.tab === 'advanced');
                if (advancedTabBtn) {
                    tabBtns.forEach(btn => btn.classList.remove('active', 'border-blue-500'));
                    advancedTabBtn.classList.add('active', 'border-blue-500');
                    Object.values(elements.tabContents).forEach(content => {
                        content.classList.remove('active');
                    });
                    elements.tabContents.advanced.classList.add('active');

                    const editor = elements.classDefsEditor;
                    const classDefText = `classDef ${nodeType}`;
                    const startPos = editor.value.indexOf(classDefText);
                    if (startPos >= 0) {
                        editor.focus();
                        editor.setSelectionRange(startPos, startPos + classDefText.length);
                    }
                }
            });
        });

        // Color picker controls
        document.querySelectorAll('[data-action="edit-text-color"]').forEach(btn => {
            btn?.addEventListener('click', (e) => {
                if (isNavigationLink(e.target)) return;
                const target = e.target.closest('[data-target]').dataset.target;
                openColorPickerForProperty(target, 'color');
            });
        });

        document.querySelectorAll('[data-action="edit-border-color"]').forEach(btn => {
            btn?.addEventListener('click', (e) => {
                if (isNavigationLink(e.target)) return;
                const target = e.target.closest('[data-target]').dataset.target;
                openColorPickerForProperty(target, 'stroke');
            });
        });

        // Modal close handlers
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!elements.newThemeModal.classList.contains('hidden')) {
                    elements.newThemeModal.classList.add('hidden');
                }
                if (!elements.confirmDeleteModal.classList.contains('hidden')) {
                    elements.confirmDeleteModal.classList.add('hidden');
                }
            }
        });

        // Click outside modals to close
        document.addEventListener('click', (e) => {
            if (!elements.newThemeModal.classList.contains('hidden') &&
                !e.target.closest('.modal-content')) {
                elements.newThemeModal.classList.add('hidden');
            }
            if (!elements.confirmDeleteModal.classList.contains('hidden') &&
                !e.target.closest('.modal-content')) {
                elements.confirmDeleteModal.classList.add('hidden');
            }
        });
    }

    // ---------------------------
    // Theme Group Expand/Collapse (from first snippet)
    // ---------------------------
    function setupThemeGroupToggle() {
        // For each theme-group header (if present)
        document.querySelectorAll('.theme-group > div').forEach(header => {
            header.addEventListener('click', function() {
                const group = this.parentElement;
                const content = group.querySelector('.theme-group-content');
                group.classList.toggle('expanded');
                if (content) content.classList.toggle('hidden');
                const icon = this.querySelector('i.fa-chevron-down');
                if (icon) {
                    icon.classList.toggle('rotate-180');
                }
            });
        });
        // Expand/Collapse All buttons
        document.getElementById('expandAllBtn')?.addEventListener('click', function() {
            document.querySelectorAll('.theme-group').forEach(group => {
                group.classList.add('expanded');
                const content = group.querySelector('.theme-group-content');
                if (content) content.classList.remove('hidden');
            });
        });
        document.getElementById('collapseAllBtn')?.addEventListener('click', function() {
            document.querySelectorAll('.theme-group').forEach(group => {
                group.classList.remove('expanded');
                const content = group.querySelector('.theme-group-content');
                if (content) content.classList.add('hidden');
            });
        });
    }

    // ---------------------------
    // Final Initialization Call
    // ---------------------------
    setupEventListeners();
    init();
});
