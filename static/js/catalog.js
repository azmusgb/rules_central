// static/js/catalog.js

class CatalogViewer {
    constructor() {
        this.debounceTimer = null;
        this.allCatalogs = [];
        this.filterState = {
            searchTerm: "",
            diagramTypes: new Set(["flow", "sequence", "state"]),
            expandedGroups: new Set(),
            expandedSubgroups: new Set(),
            activeCategory: "all"
        };
        this.uiElements = {};
        this.GROUP_PRIORITY = {
            Core: 10,
            Common: 8,
            Standard: 5,
            General: 3
        };
        this.animationDuration = 300;
    }

    async init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            await this.loadCatalog();
            this.setupIntersectionObserver();
            this.setupKeyboardShortcuts();
            this.toggleBackToTopButton();
        } catch (error) {
            console.error("Catalog initialization error:", error);
            this.showError("Failed to load catalog");
        }
    }

    cacheElements() {
        this.uiElements = {
            searchInput: document.getElementById("searchInput"),
            clearSearchBtn: document.getElementById("clearSearchBtn"),
            loadingIndicator: document.getElementById("loadingIndicator"),
            catalogContainer: document.getElementById("catalogContainer"),
            noResults: document.getElementById("noResults"),
            filterMenu: document.getElementById("filterMenu"),
            backToTop: document.getElementById("backToTop"),
            searchButton: document.getElementById("searchButton"),
            resetButton: document.getElementById("resetButton"),
            expandAllButton: document.getElementById("expandAllButton"),
            collapseAllButton: document.getElementById("collapseAllButton"),
            resetSearchButton: document.getElementById("resetSearchButton"),
            categoryNavContainer: document.getElementById("categoryNavContainer"),
            categoryNav: document.getElementById("categoryNav"),
            filterToggle: document.getElementById("filterToggle"),
            sortMenu: document.getElementById("sortMenu"),
            sortToggle: document.getElementById("sortToggle"),
            viewToggle: document.getElementById("viewToggle"),
            viewIcon: document.getElementById("viewIcon"),
            resultCount: document.getElementById("resultCount"),
            activeFilterCount: document.getElementById("activeFilterCount"),
            quickHelp: document.getElementById("quickHelpModal"),
            helpButton: document.getElementById("helpButton"),
            closeHelpModal: document.getElementById("closeHelpModal")
        };

        this.showLoading(true);
        this.uiElements.catalogContainer?.classList.add("hidden");
        this.uiElements.noResults?.classList.add("hidden");
    }

    setupEventListeners() {
        // Search
        this.uiElements.searchInput?.addEventListener("input", () => this.handleSearchInput());
        this.uiElements.clearSearchBtn?.addEventListener("click", () => this.clearSearch());
        this.uiElements.searchButton?.addEventListener("click", () => this.filterCatalog());
        this.uiElements.resetButton?.addEventListener("click", () => this.resetFilters());
        this.uiElements.resetSearchButton?.addEventListener("click", () => this.resetFilters());

        // Expand/collapse
        this.uiElements.expandAllButton?.addEventListener("click", () => this.expandAll());
        this.uiElements.collapseAllButton?.addEventListener("click", () => this.collapseAll());

        // Dropdown toggles
        this.uiElements.filterToggle?.addEventListener("click", (e) => this.toggleDropdown(e, 'filterMenu'));
        this.uiElements.sortToggle?.addEventListener("click", (e) => this.toggleDropdown(e, 'sortMenu'));

        // Help modal
        this.uiElements.helpButton?.addEventListener("click", () => this.toggleQuickHelp());
        this.uiElements.closeHelpModal?.addEventListener("click", () => this.toggleQuickHelp());
        this.uiElements.quickHelp?.addEventListener("click", (e) => {
            if (e.target === this.uiElements.quickHelp) this.toggleQuickHelp();
        });

        // Close dropdowns on outside click
        document.addEventListener("click", (e) => {
            if (this.uiElements.filterMenu && !this.uiElements.filterMenu.contains(e.target) &&
                e.target !== this.uiElements.filterToggle) {
                this.uiElements.filterMenu.classList.add("hidden");
            }
            if (this.uiElements.sortMenu && !this.uiElements.sortMenu.contains(e.target) &&
                e.target !== this.uiElements.sortToggle) {
                this.uiElements.sortMenu.classList.add("hidden");
            }
        });

        // Sort options
        document.querySelectorAll(".sort-option").forEach(option => {
            option.addEventListener("click", (e) => {
                // Implement sort logic here
                this.uiElements.sortMenu.classList.add("hidden");
            });
        });

        // View mode toggle
        this.uiElements.viewToggle?.addEventListener("click", () => this.toggleViewMode());

        // Back to top
        this.uiElements.backToTop?.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        // Scroll event for back to top
        window.addEventListener('scroll', () => this.toggleBackToTopButton());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Focus search on Ctrl/Cmd + K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.uiElements.searchInput?.focus();
            }
            // Close modals on Escape
            if (e.key === 'Escape') {
                this.uiElements.quickHelp?.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fadeIn');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.group-section, .subgroup-section').forEach(el => {
            observer.observe(el);
        });
    }

    toggleDropdown(e, menuId) {
        e.stopPropagation();
        this.uiElements[menuId]?.classList.toggle("hidden");
        // Close other dropdowns
        Object.keys(this.uiElements).forEach(key => {
            if (key !== menuId && key.endsWith('Menu')) {
                this.uiElements[key]?.classList.add("hidden");
            }
        });
    }

    toggleQuickHelp() {
        this.uiElements.quickHelp?.classList.toggle('hidden');
        document.body.style.overflow = this.uiElements.quickHelp?.classList.contains('hidden') ? '' : 'hidden';
    }

    async loadCatalog() {
        try {
            // Replace with your actual API endpoint or data source
            const response = await fetch('/api/diagram_catalogs');
            this.allCatalogs = await response.json();
            this.createCategoryNavigation();
            this.renderCatalog(this.allCatalogs);
            this.showLoading(false);
        } catch (error) {
            this.showError("Failed to load catalog data.");
        }
    }

    showLoading(show) {
        if (!this.uiElements.loadingIndicator || !this.uiElements.catalogContainer) return;
        this.uiElements.loadingIndicator.classList.toggle("hidden", !show);
        this.uiElements.catalogContainer.classList.toggle("hidden", show);
    }

    showError(message) {
        if (!this.uiElements.catalogContainer) return;
        this.uiElements.catalogContainer.innerHTML = `
            <div class="bg-dark-800 border-l-4 border-red-500 p-4 rounded-lg">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                    <span>${message}</span>
                </div>
                <button onclick="location.reload()" class="mt-2 text-primary-500 hover:text-primary-400 flex items-center">
                    <i class="fas fa-redo mr-2"></i> Reload
                </button>
            </div>`;
        this.uiElements.catalogContainer.classList.remove("hidden");
        this.showLoading(false);
    }

    createCategoryNavigation() {
        if (!this.allCatalogs?.length || !this.uiElements.categoryNavContainer) return;
        const categories = new Set();
        this.allCatalogs.forEach(cat => {
            if (cat?.category) {
                const { top } = this.parseCategory(cat.category);
                categories.add(top);
            }
        });
        this.uiElements.categoryNavContainer.innerHTML = '';
        // "All" button
        const allButton = this.createCategoryButton("all", "All", true);
        this.uiElements.categoryNavContainer.appendChild(allButton);
        // Category buttons
        Array.from(categories)
            .sort((a, b) => (this.GROUP_PRIORITY[b] || 0) - (this.GROUP_PRIORITY[a] || 0))
            .forEach(category => {
                const btn = this.createCategoryButton(category, category, false);
                this.uiElements.categoryNavContainer.appendChild(btn);
            });
    }

    createCategoryButton(value, text, isActive) {
        const button = document.createElement("button");
        button.className = `px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
            isActive
                ? "bg-gradient-to-r from-accent-purple to-primary-500 text-white shadow"
                : "bg-dark-800/60 text-slate-300 hover:bg-dark-700/80"
        }`;
        button.textContent = text;
        button.addEventListener("click", () => this.filterByCategory(value));
        return button;
    }

    filterByCategory(category) {
        this.filterState.activeCategory = category;
        // Update button states
        const buttons = this.uiElements.categoryNavContainer?.querySelectorAll("button");
        buttons?.forEach(btn => {
            const isActive = (category === "all" && btn.textContent === "All") ||
                (btn.textContent === category);
            btn.classList.toggle("bg-gradient-to-r", isActive);
            btn.classList.toggle("from-accent-purple", isActive);
            btn.classList.toggle("to-primary-500", isActive);
            btn.classList.toggle("text-white", isActive);
            btn.classList.toggle("shadow", isActive);
            btn.classList.toggle("bg-dark-800/60", !isActive);
            btn.classList.toggle("text-slate-300", !isActive);
        });
        if (category === "all") {
            this.renderCatalog(this.allCatalogs);
        } else {
            const filtered = this.allCatalogs.filter(cat => {
                const { top } = this.parseCategory(cat.category);
                return top === category;
            });
            this.renderCatalog(filtered);
        }
        this.uiElements.catalogContainer?.scrollIntoView({ behavior: 'smooth' });
    }

    renderCatalog(catalogs) {
        if (!this.uiElements.catalogContainer) return;
        this.uiElements.catalogContainer.innerHTML = "";
        this.uiElements.catalogContainer.classList.remove("hidden");
        if (!Array.isArray(catalogs) || !catalogs.length) {
            this.showNoResults();
            return;
        }
        const groupedCatalogs = this.groupCatalogs(catalogs);
        Object.entries(groupedCatalogs)
            .sort(([a], [b]) => (this.GROUP_PRIORITY[b] || 0) - (this.GROUP_PRIORITY[a] || 0))
            .forEach(([group, groupData]) => {
                const groupSection = this.createGroupSection(group, groupData);
                this.uiElements.catalogContainer.appendChild(groupSection);
            });
        // Update result count
        const totalItems = Object.values(groupedCatalogs).reduce((sum, group) =>
            sum + Object.values(group.subgroups).reduce((subSum, entries) => subSum + entries.length, 0), 0);
        if (this.uiElements.resultCount) {
            this.uiElements.resultCount.textContent = `(${totalItems} items)`;
            this.uiElements.resultCount.classList.remove('invisible');
        }
        this.uiElements.noResults?.classList.add("hidden");
        this.setupIntersectionObserver();
    }

    groupCatalogs(catalogs) {
        return catalogs.reduce((groups, cat) => {
            if (!cat?.category) return groups;
            const { top, subgroup } = this.parseCategory(cat.category);
            const normalizedTop = this.findSimilarGroup(Object.keys(groups), top) || top;
            if (!groups[normalizedTop]) {
                groups[normalizedTop] = { subgroups: {} };
            }
            if (!groups[normalizedTop].subgroups[subgroup]) {
                groups[normalizedTop].subgroups[subgroup] = [];
            }
            const items = cat.entries || [cat];
            items.forEach(item => {
                groups[normalizedTop].subgroups[subgroup].push(item);
            });
            return groups;
        }, {});
    }

    findSimilarGroup(existingGroups, newGroup) {
        return existingGroups.find(group =>
            group.toLowerCase().includes(newGroup.toLowerCase()) ||
            newGroup.toLowerCase().includes(group.toLowerCase())
        );
    }

    parseCategory(category) {
        if (!category) return { top: "Uncategorized", subgroup: "General" };
        const delimiter = category.includes('/') ? '/' : '_';
        const parts = category.split(delimiter).filter(Boolean);
        return {
            top: parts[0] || "Uncategorized",
            subgroup: parts.length > 1 ? parts[1] : "General"
        };
    }

    createGroupSection(group, groupData) {
        const groupSection = document.createElement("div");
        groupSection.className = "group-section mb-8 animate-fadeIn";
        groupSection.id = `group-${group.toLowerCase().replace(/\s+/g, "-")}`;
        const isGroupExpanded = this.filterState.expandedGroups.has(group);
        const groupHeader = document.createElement("div");
        groupHeader.className = "group-header flex items-center justify-between p-4 rounded-lg bg-dark-800 border border-dark-700 cursor-pointer transition-all hover:border-primary-500/30 hover:shadow-lg";
        groupHeader.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-folder${isGroupExpanded ? '-open' : ''} text-primary-400 mr-3"></i>
                <h3 class="text-xl font-semibold text-white">${group}</h3>
                <span class="ml-2 text-xs text-gray-400">${Object.values(groupData.subgroups).reduce((sum, arr) => sum + arr.length, 0)} items</span>
            </div>
            <i class="fas fa-chevron-down text-gray-400 transition-transform ${isGroupExpanded ? 'rotate-180' : ''}"></i>
        `;
        const subgroupsContainer = document.createElement("div");
        subgroupsContainer.className = `subgroups-container mt-3 pl-6 transition-all duration-300 ease-in-out overflow-hidden ${
            isGroupExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`;
        Object.entries(groupData.subgroups)
            .sort(([, a], [, b]) => b.length - a.length)
            .forEach(([subgroup, entries]) => {
                const subgroupCard = this.createSubgroupCard(group, subgroup, entries);
                subgroupsContainer.appendChild(subgroupCard);
            });
        groupHeader.addEventListener('click', () => {
            const currentlyExpanded = this.filterState.expandedGroups.has(group);
            if (currentlyExpanded) {
                this.filterState.expandedGroups.delete(group);
                subgroupsContainer.classList.remove('max-h-[5000px]', 'opacity-100');
                subgroupsContainer.classList.add('max-h-0', 'opacity-0');
            } else {
                this.filterState.expandedGroups.add(group);
                subgroupsContainer.classList.remove('max-h-0', 'opacity-0');
                subgroupsContainer.classList.add('max-h-[5000px]', 'opacity-100');
            }
            const icon = groupHeader.querySelector('.fa-chevron-down');
            if (icon) icon.classList.toggle('rotate-180');
            const folderIcon = groupHeader.querySelector('.fa-folder, .fa-folder-open');
            if (folderIcon) {
                folderIcon.className = `fas fa-folder${currentlyExpanded ? '' : '-open'} text-primary-400 mr-3`;
            }
        });
        groupSection.appendChild(groupHeader);
        groupSection.appendChild(subgroupsContainer);
        return groupSection;
    }

    createSubgroupCard(groupName, subgroup, entries) {
        const subgroupId = `${groupName}-${subgroup}`.toLowerCase().replace(/\s+/g, '-');
        const isSubgroupExpanded = this.filterState.expandedSubgroups.has(subgroupId);
        const subgroupSection = document.createElement('div');
        subgroupSection.className = 'subgroup-section mb-4 animate-fadeIn';
        const subgroupHeader = document.createElement('div');
        subgroupHeader.className = 'subgroup-header flex items-center justify-between p-3 rounded-lg bg-dark-800/50 border border-dark-700 cursor-pointer transition-all hover:border-primary-500/30 hover:shadow-md';
        subgroupHeader.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-folder text-primary-400 mr-3"></i>
                <h4 class="text-md font-medium text-white">${subgroup}</h4>
                <span class="ml-2 text-xs text-gray-400">${entries.length} items</span>
            </div>
            <i class="fas fa-chevron-down text-gray-400 text-sm transition-transform ${isSubgroupExpanded ? 'rotate-180' : ''}"></i>
        `;
        const entriesContainer = document.createElement('div');
        entriesContainer.className = `entries-container mt-2 pl-8 transition-all duration-300 ease-in-out overflow-hidden ${
            isSubgroupExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`;
        const entriesList = document.createElement('div');
        entriesList.className = 'space-y-2';
        entries
            .sort((a, b) => (a.root || '').localeCompare(b.root || ''))
            .forEach(entry => {
                const card = this.createEntryItem(entry);
                entriesList.appendChild(card);
            });
        subgroupHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentlyExpanded = this.filterState.expandedSubgroups.has(subgroupId);
            if (currentlyExpanded) {
                this.filterState.expandedSubgroups.delete(subgroupId);
                entriesContainer.classList.remove('max-h-[5000px]', 'opacity-100');
                entriesContainer.classList.add('max-h-0', 'opacity-0');
            } else {
                this.filterState.expandedSubgroups.add(subgroupId);
                entriesContainer.classList.remove('max-h-0', 'opacity-0');
                entriesContainer.classList.add('max-h-[5000px]', 'opacity-100');
            }
            const subIcon = subgroupHeader.querySelector('.fa-chevron-down');
            if (subIcon) subIcon.classList.toggle('rotate-180');
        });
        entriesContainer.appendChild(entriesList);
        subgroupSection.appendChild(subgroupHeader);
        subgroupSection.appendChild(entriesContainer);
        return subgroupSection;
    }

    createEntryItem(entry) {
        const card = document.createElement("div");
        card.className = "entry-item group relative bg-gradient-to-br from-gray-800/80 to-gray-900/90 rounded-xl overflow-hidden border border-gray-700/30 hover:border-purple-500/30 transition-all duration-300 hover:shadow-glow-sm flex flex-col h-full transform hover:-translate-y-1 animate-fadeIn";
        card.title = entry.description || "No description available";
        card.dataset.searchTerms = `${entry.root} ${entry.diagram} ${entry.hierarchy}`.toLowerCase();
        card.innerHTML = `
            <div class="p-4 flex-grow flex flex-col relative">
                <div class="absolute top-0 right-0 m-2 invisible opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-10">
                    <div class="tooltip inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm">${entry.description || "No description available"}</div>
                </div>
                <h3 class="font-medium text-white text-lg mb-1 line-clamp-1">${entry.root || "Untitled Diagram"}</h3>
                <p class="text-gray-400 text-sm mb-3 line-clamp-2">${entry.description || "No description available."}</p>
                <div class="flex flex-wrap gap-2 mt-auto pt-2">
                    ${(entry.tags || ['#process', '#flow', '#business']).map(tag =>
                        `<span class="bg-primary-500/10 text-primary-400 px-2 py-1 rounded text-xs">${tag}</span>`
                    ).join('')}
                </div>
                <div class="absolute bottom-0 right-0 p-3 z-20 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="preview-btn w-8 h-8 rounded-full bg-gray-900/80 text-white hover:bg-purple-600 flex items-center justify-center backdrop-blur-sm transition-colors" title="View Diagram">
                        <i class="fas fa-project-diagram w-4 h-4"></i>
                    </button>
                    <button class="hierarchy-btn w-8 h-8 rounded-full bg-gray-900/80 text-white hover:bg-blue-600 flex items-center justify-center backdrop-blur-sm transition-colors" title="View Hierarchy">
                        <i class="fas fa-sitemap w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="px-4 py-3 border-t border-gray-700/30 flex items-center justify-between bg-gray-800/30">
                <div class="flex items-center text-xs text-gray-400">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    </svg>
                    <span>${entry.updated || "Updated recently"}</span>
                </div>
                <button class="text-gray-400 hover:text-yellow-400 transition-colors focus:outline-none" title="Add to favorites">
                    <i class="fas fa-star w-4 h-4"></i>
                </button>
            </div>
        `;
        // Button actions
        card.querySelector(".preview-btn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            window.location.href = `/view_diagram?root_name=${encodeURIComponent(entry.root)}&diagram_name=${encodeURIComponent(entry.diagram)}`;
        });
        card.querySelector(".hierarchy-btn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            const icon = e.currentTarget.querySelector("i");
            if (icon) icon.className = "fas fa-spinner fa-spin";
            setTimeout(() => {
                window.location.href = `/view_hierarchy?root_name=${encodeURIComponent(entry.root)}&diagramName=${encodeURIComponent(entry.hierarchy || "")}`;
            }, 100);
        });
        return card;
    }

    handleSearchInput() {
        this.filterState.searchTerm = this.uiElements.searchInput.value.toLowerCase().trim();
        if (this.uiElements.clearSearchBtn) {
            const shouldShowClear = this.filterState.searchTerm.length > 0;
            this.uiElements.clearSearchBtn.classList.toggle("opacity-0", !shouldShowClear);
            this.uiElements.clearSearchBtn.classList.toggle("invisible", !shouldShowClear);
        }
        this.debouncedFilterCatalog();
    }

    debouncedFilterCatalog() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.filterCatalog(), 300);
    }

    filterCatalog() {
        const searchTerm = this.filterState.searchTerm.toLowerCase().trim();
        if (!searchTerm) {
            document.querySelectorAll('.group-section, .subgroup-section, .entry-item').forEach(el => {
                el.style.display = "";
            });
            this.uiElements.noResults?.classList.add("hidden");
            return;
        }
        let anyVisible = false;
        const groupSections = document.querySelectorAll('.group-section');
        groupSections.forEach(groupSection => {
            const groupHeader = groupSection.querySelector('h3');
            const groupName = groupHeader?.textContent.toLowerCase() || '';
            let groupMatches = groupName.includes(searchTerm);
            let subgroupMatches = false;
            const subgroups = groupSection.querySelectorAll('.subgroup-section');
            subgroups.forEach(subgroup => {
                const subgroupHeader = subgroup.querySelector('h4');
                const subgroupName = subgroupHeader?.textContent.toLowerCase() || '';
                let subgroupVisible = false;
                const entries = subgroup.querySelectorAll('.entry-item');
                entries.forEach(entry => {
                    const terms = entry.dataset.searchTerms || '';
                    const match = terms.includes(searchTerm) || subgroupName.includes(searchTerm);
                    entry.style.display = match ? "" : "none";
                    if (match) subgroupVisible = true;
                });
                subgroup.style.display = subgroupVisible ? "" : "none";
                if (subgroupVisible) subgroupMatches = true;
            });
            groupSection.style.display = (groupMatches || subgroupMatches) ? "" : "none";
            if (groupMatches || subgroupMatches) anyVisible = true;
        });
        this.uiElements.noResults?.classList.toggle("hidden", anyVisible);
        if (anyVisible) {
            const firstVisible = document.querySelector('.group-section[style=""]');
            firstVisible?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    clearSearch() {
        this.uiElements.searchInput.value = "";
        this.filterState.searchTerm = "";
        this.filterCatalog();
    }

    resetFilters() {
        this.uiElements.searchInput.value = "";
        this.uiElements.clearSearchBtn?.classList.add("opacity-0", "invisible");
        this.filterState.searchTerm = "";
        this.filterByCategory("all");
        this.renderCatalog(this.allCatalogs);
    }

    expandAll() {
        document.querySelectorAll('.group-section').forEach(group => {
            const groupId = group.id.replace('group-', '');
            this.filterState.expandedGroups.add(groupId);
            const subgroupsContainer = group.querySelector('.subgroups-container');
            if (subgroupsContainer) {
                subgroupsContainer.classList.remove('max-h-0', 'opacity-0');
                subgroupsContainer.classList.add('max-h-[5000px]', 'opacity-100');
            }
            const groupHeader = group.querySelector('.group-header');
            groupHeader.querySelector('i.fa-chevron-down')?.classList.add('rotate-180');
            const folderIcon = groupHeader.querySelector('i.fa-folder, i.fa-folder-open');
            if (folderIcon) {
                folderIcon.className = `fas fa-folder-open text-primary-400 mr-3`;
            }
            group.querySelectorAll('.subgroup-section').forEach(subgroup => {
                const subgroupId = subgroup.querySelector('h4')?.textContent.toLowerCase().replace(/\s+/g, '-');
                this.filterState.expandedSubgroups.add(subgroupId);
                const entriesContainer = subgroup.querySelector('.entries-container');
                if (entriesContainer) {
                    entriesContainer.classList.remove('max-h-0', 'opacity-0');
                    entriesContainer.classList.add('max-h-[5000px]', 'opacity-100');
                }
                subgroup.querySelector('.fa-chevron-down')?.classList.add('rotate-180');
            });
        });
    }

    collapseAll() {
        document.querySelectorAll('.group-section').forEach(group => {
            const groupId = group.id.replace('group-', '');
            this.filterState.expandedGroups.delete(groupId);
            const subgroupsContainer = group.querySelector('.subgroups-container');
            if (subgroupsContainer) {
                subgroupsContainer.classList.remove('max-h-[5000px]', 'opacity-100');
                subgroupsContainer.classList.add('max-h-0', 'opacity-0');
            }
            const groupHeader = group.querySelector('.group-header');
            groupHeader.querySelector('i.fa-chevron-down')?.classList.remove('rotate-180');
            const folderIcon = groupHeader.querySelector('i.fa-folder, i.fa-folder-open');
            if (folderIcon) {
                folderIcon.className = `fas fa-folder text-primary-400 mr-3`;
            }
            group.querySelectorAll('.subgroup-section').forEach(subgroup => {
                const subgroupId = subgroup.querySelector('h4')?.textContent.toLowerCase().replace(/\s+/g, '-');
                this.filterState.expandedSubgroups.delete(subgroupId);
                const entriesContainer = subgroup.querySelector('.entries-container');
                if (entriesContainer) {
                    entriesContainer.classList.remove('max-h-[5000px]', 'opacity-100');
                    entriesContainer.classList.add('max-h-0', 'opacity-0');
                }
                subgroup.querySelector('.fa-chevron-down')?.classList.remove('rotate-180');
            });
        });
    }

    showNoResults() {
        if (!this.uiElements.catalogContainer || !this.uiElements.noResults) return;
        this.uiElements.catalogContainer.classList.add("hidden");
        this.uiElements.noResults.classList.remove("hidden");
    }

    toggleBackToTopButton() {
        const btn = this.uiElements.backToTop;
        if (!btn) return;
        const show = window.scrollY > 300;
        btn.classList.toggle('opacity-0', !show);
        btn.classList.toggle('invisible', !show);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('catalogContainer')) {
        window.catalogViewer = new CatalogViewer();
        window.catalogViewer.init();
    }
});