"use strict";
/**
 * index.js — Optimized Core Initialization for Rules Central Dashboard
 * -------------------------------------------------------------------
 * - Initializes UI components only when needed
 * - Adds smooth scroll & animation triggers
 * - Handles dynamic content loading gracefully
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("%c✔ Rules Central Dashboard initialized", "color:#22c55e;font-weight:bold;");

  // ======================
  // 1. CORE INITIALIZATION
  // ======================
  initAnimations();
  setupBackToTop();
  setupStatsHoverEffects();
  setupSearchInputs();

  // Initialize only if relevant elements exist
  if (document.getElementById("uploadForm")) {
    initFileUpload?.();
  }

  if (document.getElementById("catalogContainer")) {
    window.catalogViewer = new CatalogViewer();
  }

  const loadMoreBtn = document.getElementById("loadMore");
  if (loadMoreBtn) loadMoreBtn.addEventListener("click", handleLoadMore);

  // ======================
  // 2. UI ENHANCEMENTS
  // ======================

  /**
   * Animates elements when they come into view
   */
  function initAnimations() {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("animate-in");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      const delay = parseInt(el.dataset.delay, 10) || 0;
      el.style.setProperty("--animation-delay", `${delay}ms`);
      observer.observe(el);
    });
  }

  /**
   * Back-to-top button visibility + smooth scroll
   */
  function setupBackToTop() {
    const btn = document.getElementById("backToTop");
    if (!btn) return;

    let scrollTimeout;
    window.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        btn.classList.toggle("show", window.scrollY > 300);
      }, 60); // slightly throttled for performance
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      btn.blur();
    });
  }

  /**
   * Adds subtle hover/touch effects for stats cards
   */
  function setupStatsHoverEffects() {
    document.querySelectorAll(".stats-card").forEach((card) => {
      const icon = card.querySelector(".stats-icon");
      if (!icon) return;

      const activate = () => (icon.style.transform = "rotate(10deg) scale(1.1)");
      const reset = () => (icon.style.transform = "");

      card.addEventListener("mouseenter", activate);
      card.addEventListener("mouseleave", reset);
      card.addEventListener("touchstart", activate, { passive: true });
      card.addEventListener("touchend", reset, { passive: true });
    });
  }

  /**
   * Search input with clear button support
   */
  function setupSearchInputs() {
    document.querySelectorAll(".search-container").forEach((container) => {
      const input = container.querySelector('input[type="search"]');
      const clearBtn = container.querySelector(".clear-search");
      if (!input || !clearBtn) return;

      const toggleClear = () => clearBtn.classList.toggle("hidden", !input.value);
      toggleClear();

      input.addEventListener("input", toggleClear);

      clearBtn.addEventListener("click", () => {
        input.value = "";
        toggleClear();
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
      });
    });
  }

  // ======================
  // 3. DYNAMIC CONTENT LOADING
  // ======================

  async function handleLoadMore() {
    const btn = this;
    const contentContainer = document.getElementById("dynamicContent");
    if (!contentContainer) {
      console.warn("⚠️ No dynamic content container found");
      return;
    }

    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;

    try {
      const res = await fetch("/api/more-content");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data?.length) {
        btn.textContent = "No more content";
        btn.style.opacity = "0.6";
        btn.removeEventListener("click", handleLoadMore);
        return; // Stop here, don’t revert button
      }

      data.forEach(({ title, description }) => {
        const item = document.createElement("div");
        item.className = "item animate-on-scroll";
        item.innerHTML = `<h4>${title}</h4><p>${description}</p>`;
        contentContainer.appendChild(item);
      });

      // Re-initialize animations for new elements
      initAnimations();
    } catch (err) {
      console.error("❌ Error loading more content:", err);
      window.app.showToast?.("Failed to load more content", "error");
    } finally {
      if (btn.textContent !== "No more content") btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }

  // ======================
  // 4. GLOBAL EXPORTS
  // ======================
  window.app = {
    initAnimations,
    setupBackToTop,
    setupSearchInputs,
    handleLoadMore,
  };
});