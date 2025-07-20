"use strict";
/**
 * core.js — Core application initialization
 * ----------------------------------------
 * ✅ Accessible theme switching w/ persistence
 * ✅ Mobile menu toggle w/ ARIA + scroll lock
 * ✅ Scroll progress tracking
 * ✅ Memory-safe listener cleanup
 * ✅ Component auto-initializer for optional UI features
 */

(function () {
  // ================================
  // 1. THEME MANAGEMENT
  // ================================
  const THEME_KEY = "theme";
  const THEMES = ["light", "dark"];
  const DARK = "dark";
  const LIGHT = "light";

  const ThemeManager = {
    init() {
      const saved = localStorage.getItem(THEME_KEY);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = saved || (prefersDark ? DARK : LIGHT);
      this.apply(initialTheme);
      this._bindSystemThemeListener();
    },

    apply(theme) {
      const html = document.documentElement;
      html.setAttribute("data-theme", theme);
      html.setAttribute("aria-theme", theme);

      html.classList.toggle(DARK, theme === DARK);
      localStorage.setItem(THEME_KEY, theme);

      // Dispatch a custom event so other components can react
      document.dispatchEvent(new CustomEvent("theme-change", { detail: { theme } }));
    },

    toggle() {
      const current = document.documentElement.classList.contains(DARK) ? DARK : LIGHT;
      const next = current === DARK ? LIGHT : DARK;
      this.apply(next);
    },

    _bindSystemThemeListener() {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemChange = (e) => {
        // Only update if the user hasn't explicitly set a theme
        if (!localStorage.getItem(THEME_KEY)) {
          this.apply(e.matches ? DARK : LIGHT);
        }
      };
      mq.addEventListener("change", handleSystemChange);

      // Store cleanup handler
      window._themeCleanup = () => mq.removeEventListener("change", handleSystemChange);
    }
  };

  // ================================
  // 2. MOBILE MENU HANDLER
  // ================================
  const MobileMenu = {
    init() {
      const btn = document.getElementById("mobile-menu-btn");
      const menu = document.getElementById("mobile-menu");
      if (!btn || !menu) return;

      const toggleMenu = () => {
        const isOpen = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", !isOpen);
        menu.classList.toggle("hidden", isOpen);

        // Lock/unlock body scroll
        document.body.style.overflow = isOpen ? "" : "hidden";
      };

      const clickOutsideHandler = (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
          btn.setAttribute("aria-expanded", "false");
          menu.classList.add("hidden");
          document.body.style.overflow = "";
        }
      };

      btn.addEventListener("click", toggleMenu);
      document.addEventListener("click", clickOutsideHandler);

      // Cleanup references
      window._menuCleanup = () => {
        btn.removeEventListener("click", toggleMenu);
        document.removeEventListener("click", clickOutsideHandler);
      };
    }
  };

  // ================================
  // 3. SCROLL PROGRESS BAR
  // ================================
  const ScrollProgress = {
    init() {
      const bar = document.getElementById("scroll-progress");
      if (!bar) return;

      const updateProgress = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = `${percent}%`;
      };

      // Initialize immediately
      updateProgress();
      window.addEventListener("scroll", updateProgress, { passive: true });

      window._scrollCleanup = () => window.removeEventListener("scroll", updateProgress);
    }
  };

  // ================================
  // 4. COMPONENT AUTO-INITIALIZER
  // ================================
  const ComponentManager = {
    init() {
      const components = [
        "initAnimations",
        "setupBackToTop",
        "setupSearchInputs",
        "setupCopyButtons",
        "setupHotkeys",
        "setupPageTransitions"
      ];

      components.forEach((fnName) => {
        if (window.AppUtils && typeof window.AppUtils[fnName] === "function") {
          try {
            window.AppUtils[fnName]();
          } catch (err) {
            console.warn(`Component ${fnName} failed:`, err);
          }
        }
      });
    }
  };

  // ================================
  // 5. MAIN INITIALIZATION
  // ================================
  document.addEventListener("DOMContentLoaded", () => {
    ThemeManager.init();
    MobileMenu.init();
    ScrollProgress.init();
    ComponentManager.init();
  });

  // ================================
  // 6. CLEANUP ON NAVIGATION
  // ================================
  window.addEventListener("beforeunload", () => {
    window._themeCleanup?.();
    window._menuCleanup?.();
    window._scrollCleanup?.();
  });

  // ================================
  // 7. GLOBAL API EXPORT
  // ================================
  window.AppUtils = window.AppUtils || {};
  window.AppUtils.ThemeManager = ThemeManager;
  window.AppUtils.MobileMenu = MobileMenu;
  window.AppUtils.ScrollProgress = ScrollProgress;

  // Legacy alias for backwards compatibility
  window.app = window.AppUtils;
})();