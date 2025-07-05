"use strict";
document.addEventListener("DOMContentLoaded", () => {
  console.log("search.js loaded");

  const elements = {
    searchInput: document.getElementById("search-input"),
    clearInput: document.getElementById("clear-input"),
    searchButton: document.getElementById("search-button"),
    clearButton: document.getElementById("clear-button"),
    catalogFilter: document.getElementById("catalog-filter"),
    resultsContainer: document.getElementById("results-container"),
    resultsSummary: document.getElementById("results-summary"),
    resultsCount: document.getElementById("results-count"),
    queryDisplay: document.getElementById("query-display"),
    noResults: document.getElementById("no-results"),
    clearFilters: document.getElementById("clear-filters"),
    results: document.getElementById("results"),
    pagination: document.getElementById("pagination"),
    spinner: document.getElementById("spinner"),
    toast: document.getElementById("toast"),
  };

  // Check if all elements are found
  for (const [key, element] of Object.entries(elements)) {
    if (!element) {
      console.error(`Element not found: ${key}`);
    } else {
      console.debug(`Element found: ${key}`, element);
    }
  }

  const state = {
    currentPage: 1,
    itemsPerPage: 9,
    totalResults: 0,
    allCatalogs: [],
    debounceTimer: null,
  };

  // Utility functions
  function formatFilename(filename) {
    return filename
      ? filename.replace(/\.mmd$/, "").replace(/_/g, " ")
      : "Untitled";
  }

  function formatCatalogName(catalog) {
    return catalog
      ? catalog.replace(/^Documents_/, "").replace(/_/g, " ")
      : "Unknown Catalog";
  }

  function formatDate(dateValue) {
    if (!dateValue) return "Unknown";
    const date = new Date(dateValue * 1000 || dateValue);
    return isNaN(date)
      ? "Unknown"
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  }

  function formatFileSize(bytes) {
    if (bytes == null) return "N/A";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function extractGuidFromSnippet(snippet) {
    if (!snippet) return null;
    const guidRegex =
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
    const match = snippet.match(guidRegex);
    return match ? match[0] : null;
  }

  function extractRuleNameFromSnippet(snippet) {
    if (!snippet) return null;
    const nameRegex = /(?:rule\s*:\s*|rule\s*name\s*:\s*|")([^"\n<]+)/i;
    const match = snippet.match(nameRegex);
    return match ? match[1].trim() : null;
  }

  function extractFunctionFromSnippet(snippet) {
    if (!snippet) return null;
    const funcRegex = /function:\s*([^\s<"\)]+)/i;
    const match = snippet.match(funcRegex);
    return match ? match[1].trim() : null;
  }

  function highlightQuery(text, query) {
    if (!query || !text) return text;
    try {
      const regex = new RegExp(
        `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
      );
      return text.replace(regex, "<mark>$1</mark>");
    } catch (e) {
      console.error("Highlight error:", e);
      return text;
    }
  }

  function formatSnippetContent(snippet, query) {
    if (!snippet) return "";
    let cleanContent = snippet
      .replace(/\{[^}]*\}/g, "")
      .replace(/\\"/g, '"')
      .replace(/\\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (query && query.trim() !== "") {
      cleanContent = highlightQuery(cleanContent, query);
    }

    return cleanContent;
  }

  function showSpinner(show = true) {
    if (elements.spinner) {
      elements.spinner.classList.toggle("hidden", !show);
      console.debug("Spinner toggled:", show);
    }
  }

  function createRuleDetails(item, query) {
    const ruleData = item.rule_data || {};
    const ruleName =
      ruleData.RuleName ||
      extractRuleNameFromSnippet(item.match_snippet) ||
      formatFilename(item.filename);
    const ruleGuid =
      ruleData.RuleGUID || extractGuidFromSnippet(item.match_snippet);
    const functionName =
      ruleData.FunctionName || extractFunctionFromSnippet(item.match_snippet);
    const snippetText = item.match_snippet || "";

    let detailsHTML = `
          <div class="detail-row">
            <span class="detail-label">Rule Name:</span>
            <span class="detail-value">${ruleName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">File:</span>
            <span class="detail-value">${formatFilename(item.filename)}</span>
          </div>`;

    if (ruleGuid) {
      detailsHTML += `
            <div class="detail-row">
              <span class="detail-label">GUID:</span>
              <span class="detail-value">${ruleGuid}</span>
            </div>`;
    }

    if (functionName) {
      detailsHTML += `
            <div class="detail-row">
              <span class="detail-label">Function:</span>
              <span class="detail-value">${functionName}</span>
            </div>`;
    }

    if (snippetText) {
      detailsHTML += `
            <div class="detail-row">
              <span class="detail-label">Snippet:</span>
              <span class="detail-value">${formatSnippetContent(snippetText, query)}</span>
            </div>`;
    }

    if (ruleData.Container) {
      detailsHTML += `
            <div class="detail-row">
              <span class="detail-label">Container:</span>
              <span class="detail-value">${ruleData.Container}</span>
            </div>`;
    }

    if (ruleData.Attributes && Object.keys(ruleData.Attributes).length > 0) {
      detailsHTML += `
            <div class="detail-row">
              <span class="detail-label">Attributes:</span>
              <div class="detail-value">`;
      for (const [key, value] of Object.entries(ruleData.Attributes)) {
        detailsHTML += `<div><b>${key}:</b> ${value}</div>`;
      }
      detailsHTML += `</div></div>`;
    }

    return detailsHTML;
  }

  function toggleRuleDetails(card, item, query) {
    const detailsDiv = card.querySelector(".rule-details");
    const toggleBtn = card.querySelector(".toggle-details-btn");

    if (detailsDiv.classList.contains("visible")) {
      detailsDiv.classList.remove("visible");
      detailsDiv.innerHTML = "";
      toggleBtn.textContent = "Show Details";
      console.debug("Rule details hidden");
    } else {
      if (!detailsDiv.innerHTML.trim()) {
        detailsDiv.innerHTML = createRuleDetails(item, query);
      }
      detailsDiv.classList.add("visible");
      toggleBtn.textContent = "Hide Details";
      console.debug("Rule details shown");
    }
  }

  async function performSearch() {
    const query = elements.searchInput.value.trim();
    const catalog = elements.catalogFilter.value;
    state.currentPage = 1;

    console.debug("Performing search", {
      query,
      catalog,
      page: state.currentPage,
    });

    showSpinner(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (catalog) params.append("catalog", catalog);

      params.append("page", state.currentPage);
      params.append("per_page", state.itemsPerPage);

      const response = await fetch(`/api/search_diagrams?${params.toString()}`);
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);

      const data = await response.json();
      state.totalResults = data.total || 0;
      console.log("Search results:", data);
      displayResults(data.results || [], query, catalog);
      updatePagination(data.total, data.page, data.per_page);

      if (data.results && data.results.length > 0) {
        window.app.showToast(`Found ${data.total} results`, "success");
      }
    } catch (error) {
      console.error("Search error:", error);
      window.app.showToast(error.message || "Search failed", "error");
      resetResults();
    } finally {
      showSpinner(false);
    }
  }

  function displayResults(items, query, catalog) {
    elements.results.innerHTML = "";

    if (!items || items.length === 0) {
      elements.noResults.classList.remove("hidden");
      elements.resultsContainer.classList.add("hidden");
      console.debug("No results to display");
      return;
    }

    elements.noResults.classList.add("hidden");
    elements.resultsContainer.classList.remove("hidden");

    if (
      elements.resultsSummary &&
      elements.resultsCount &&
      elements.queryDisplay
    ) {
      elements.resultsSummary.classList.remove("hidden");
      elements.resultsCount.textContent = state.totalResults;
      let queryText = query || "all diagrams";
      if (catalog) queryText += ` in ${formatCatalogName(catalog)}`;
      elements.queryDisplay.textContent = queryText;
    }

    items.forEach((item) => {
      try {
        const card = document.createElement("div");
        card.className = "result-card";

        card.innerHTML = `
                    <div class="result-header">
                        <span class="result-title">${formatFilename(item.filename)}</span>
                        <button class="toggle-details-btn">Show Details</button>
                    </div>
                    <div class="result-meta">
                        <span class="result-catalog">${formatCatalogName(item.catalog)}</span>
                        <span class="result-date">${formatDate(item.created)}</span>
                        <span class="result-size">${formatFileSize(item.size)}</span>
                    </div>
                    <div class="rule-details"></div>
                `;

        card
          .querySelector(".toggle-details-btn")
          .addEventListener("click", () => {
            toggleRuleDetails(card, item, query);
          });

        elements.results.appendChild(card);
        console.debug("Result card rendered:", item);
      } catch (error) {
        console.error("Error rendering result:", error, item);
      }
    });
  }

  function updatePagination(total, page, perPage) {
    if (!elements.pagination || total <= perPage) {
      if (elements.pagination) elements.pagination.classList.add("hidden");
      return;
    }

    elements.pagination.classList.remove("hidden");
    elements.pagination.innerHTML = "";

    const totalPages = Math.ceil(total / perPage);
    const maxVisiblePages = 5;
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
      const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;
      if (page <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (page + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        startPage = page - maxPagesBeforeCurrent;
        endPage = page + maxPagesAfterCurrent;
      }
    }

    if (page > 1) {
      const prevButton = document.createElement("button");
      prevButton.className = "pagination-btn";
      prevButton.textContent = "Previous";
      prevButton.addEventListener("click", () => {
        state.currentPage = page - 1;
        performSearch();
      });
      elements.pagination.appendChild(prevButton);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement("button");
      pageButton.className = `pagination-btn ${i === page ? "active" : ""}`;
      pageButton.textContent = i;
      if (i !== page) {
        pageButton.addEventListener("click", () => {
          state.currentPage = i;
          performSearch();
        });
      }
      elements.pagination.appendChild(pageButton);
    }

    if (page < totalPages) {
      const nextButton = document.createElement("button");
      nextButton.className = "pagination-btn";
      nextButton.textContent = "Next";
      nextButton.addEventListener("click", () => {
        state.currentPage = page + 1;
        performSearch();
      });
      elements.pagination.appendChild(nextButton);
    }
    console.debug("Pagination updated:", { total, page, perPage, totalPages });
  }

  function resetSearch() {
    elements.searchInput.value = "";
    if (elements.clearInput) elements.clearInput.classList.add("hidden");
    if (elements.catalogFilter) elements.catalogFilter.value = "";
    resetResults();
    console.debug("Search reset");
  }

  function resetResults() {
    elements.results.innerHTML = "";
    if (elements.resultsContainer)
      elements.resultsContainer.classList.add("hidden");
    if (elements.noResults) elements.noResults.classList.add("hidden");
    if (elements.resultsSummary)
      elements.resultsSummary.classList.add("hidden");
    if (elements.pagination) elements.pagination.classList.add("hidden");
    console.debug("Results reset");
  }

  function debouncedSearch() {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(performSearch, 300);
    console.debug("Debounced search triggered");
  }

  function init() {
    setupEventListeners();
    loadCatalogs();
    console.log("Search page initialized");
  }

  function setupEventListeners() {
    if (elements.searchInput) {
      elements.searchInput.addEventListener("input", () => {
        if (elements.clearInput) {
          elements.clearInput.classList.toggle(
            "hidden",
            elements.searchInput.value === "",
          );
        }
        debouncedSearch();
      });
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") performSearch();
      });
    }

    if (elements.clearInput) {
      elements.clearInput.addEventListener("click", () => {
        elements.searchInput.value = "";
        if (elements.clearInput) elements.clearInput.classList.add("hidden");
        elements.searchInput.focus();
        debouncedSearch();
      });
    }

    if (elements.searchButton) {
      elements.searchButton.addEventListener("click", performSearch);
    }

    if (elements.clearButton) {
      elements.clearButton.addEventListener("click", resetSearch);
    }

    if (elements.clearFilters) {
      elements.clearFilters.addEventListener("click", resetSearch);
    }

    if (elements.catalogFilter) {
      elements.catalogFilter.addEventListener("change", debouncedSearch);
    }
    console.debug("Event listeners set up");
  }

  async function loadCatalogs() {
    try {
      showSpinner(true);
      const response = await fetch("/api/catalog_names");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid catalog data format");
      state.allCatalogs = data;
      populateCatalogFilter(data);
      console.log("Catalogs loaded:", data);
    } catch (error) {
      console.error("Catalog load error:", error);
      window.app.showToast("Failed to load catalogs", "error");
      if (elements.catalogFilter) {
        elements.catalogFilter.innerHTML =
          '<option value="">All Catalogs</option>';
      }
    } finally {
      showSpinner(false);
    }
  }

  function populateCatalogFilter(catalogs) {
    if (elements.catalogFilter) {
      elements.catalogFilter.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "All Catalogs";
      elements.catalogFilter.appendChild(defaultOption);

      if (Array.isArray(catalogs)) {
        catalogs.forEach((catalog) => {
          const option = document.createElement("option");
          option.value = catalog;
          option.textContent = formatCatalogName(catalog);
          elements.catalogFilter.appendChild(option);
        });
      }
      console.debug("Catalog filter populated");
    }
  }

  // Initialize
  init();
});
