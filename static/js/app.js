"use strict";
// Core app initialization and theme management
// Refactored for accessibility, ARIA, event cleanup, and DRY theme logic

(function () {
  // --- Theme Management (DRY, accessible) ---
  function setInitialTheme() {
    const theme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.documentElement.setAttribute("aria-theme", isDark ? "dark" : "light");
  }
  // Expose for other scripts
  window.AppUtils = window.AppUtils || {};
  window.AppUtils.toggleTheme = toggleTheme;
  window.AppUtils.setInitialTheme = setInitialTheme;

  document.addEventListener("DOMContentLoaded", () => {
    setInitialTheme();
    // Theme toggle button (shared across templates)
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener("click", () => {
        const expanded = mobileMenuBtn.getAttribute("aria-expanded") === "true";
        mobileMenuBtn.setAttribute("aria-expanded", !expanded);
        mobileMenu.classList.toggle("hidden");
      });
    }

    // Initialize shared UI components
    if (window.AppUtils.initAnimations) window.AppUtils.initAnimations();
    if (window.AppUtils.setupBackToTop) window.AppUtils.setupBackToTop();
    if (window.AppUtils.setupSearchInputs) window.AppUtils.setupSearchInputs();
    if (window.AppUtils.setupCopyButtons) window.AppUtils.setupCopyButtons();
    if (window.AppUtils.setupHotkeys) window.AppUtils.setupHotkeys();
    if (window.AppUtils.setupPageTransitions)
      window.AppUtils.setupPageTransitions();
    const updateProgress = () => {
      const progress = document.getElementById("scroll-progress");
      if (progress) {
        const scrollTop =
          document.documentElement.scrollTop || document.body.scrollTop;
        const docHeight =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progress.style.width = `${percent}%`;
      }
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress);
  });

  // Expose AppUtils under previous namespace for legacy scripts
  window.app = window.AppUtils;
})();
