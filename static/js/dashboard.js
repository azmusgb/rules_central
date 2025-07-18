"use strict";
// index.js - Optimized Core Initialization
document.addEventListener("DOMContentLoaded", function () {
  console.log("Rules Central Dashboard initialized");

  // ======================
  // 1. CORE FUNCTIONALITY
  // ======================

  // Initialize UI components
  initAnimations();
  setupBackToTop();
  setupStatsHoverEffects();
  setupSearchInputs();

  // Initialize page-specific components
  if (document.getElementById("uploadForm")) {
    initFileUpload();
  }

  if (document.getElementById("catalogContainer")) {
    window.catalogViewer = new CatalogViewer();
  }

  // Initialize dynamic content loading if the element exists
  const loadMoreBtn = document.getElementById("loadMore");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", handleLoadMore);
  }

  // ======================
  // 2. UI COMPONENTS
  // ======================

  function initAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      const delay = el.dataset.delay || 0;
      el.style.setProperty("--animation-delay", `${delay}ms`);
      observer.observe(el);
    });
  }

  function setupBackToTop() {
    const backToTopBtn = document.getElementById("backToTop");
    if (!backToTopBtn) return;

    let isScrolling;
    window.addEventListener("scroll", () => {
      window.clearTimeout(isScrolling);
      isScrolling = setTimeout(() => {
        backToTopBtn.classList.toggle("show", window.scrollY > 300);
      }, 50);
    });

    backToTopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      backToTopBtn.blur();
    });
  }

  function setupStatsHoverEffects() {
    document.querySelectorAll(".stats-card").forEach((card) => {
      const icon = card.querySelector(".stats-icon");
      if (!icon) return;

      card.addEventListener("mouseenter", handleHover);
      card.addEventListener("touchstart", handleHover, {
        passive: true,
      });
      card.addEventListener("mouseleave", handleHoverEnd);
      card.addEventListener("touchend", handleHoverEnd, {
        passive: true,
      });

      function handleHover() {
        icon.style.transform = "rotate(10deg) scale(1.1)";
      }

      function handleHoverEnd() {
        icon.style.transform = "";
      }
    });
  }

  function setupSearchInputs() {
    document.querySelectorAll(".search-container").forEach((container) => {
      const input = container.querySelector('input[type="search"]');
      const clearBtn = container.querySelector(".clear-search");

      if (input && clearBtn) {
        clearBtn.classList.toggle("hidden", !input.value);
        input.addEventListener("input", () => {
          clearBtn.classList.toggle("hidden", !input.value);
        });

        clearBtn.addEventListener("click", () => {
          input.value = "";
          clearBtn.classList.add("hidden");
          input.dispatchEvent(
            new Event("input", {
              bubbles: true,
            }),
          );
          input.focus();
        });
      }
    });
  }

  async function handleLoadMore() {
    const loadMoreBtn = this;
    const contentDiv = document.getElementById("dynamicContent");

    if (!contentDiv) {
      console.error("Target container for dynamic content not found");
      return;
    }

    const originalHtml = loadMoreBtn.innerHTML;
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

    try {
      const response = await fetch("/api/more-content");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();

      if (data && data.length) {
        data.forEach((item) => {
          const newItem = document.createElement("div");
          newItem.className = "item";
          newItem.innerHTML = `<h4>${item.title}</h4><p>${item.description}</p>`;
          contentDiv.appendChild(newItem);
        });
      } else {
        loadMoreBtn.textContent = "No more content";
        loadMoreBtn.style.opacity = "0.5";
        loadMoreBtn.removeEventListener("click", handleLoadMore);
        return; // Don't restore original HTML
      }
    } catch (error) {
      console.error("Error loading more content:", error);
      window.app.showToast("Failed to load more content", "error");
    } finally {
      if (loadMoreBtn.textContent !== "No more content") {
        loadMoreBtn.innerHTML = originalHtml;
      }
      loadMoreBtn.disabled = false;
    }
  }

  // ======================
  // 4. GLOBAL EXPORTS
  // ======================

  window.app = {
    initAnimations,
    setupBackToTop,
    setupSearchInputs,
  };
});
