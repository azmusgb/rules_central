"use strict";
/**
 * Core application initialization and theme management
 * Features:
 * - Accessible theme switching with localStorage persistence
 * - Mobile menu handling with ARIA attributes
 * - Component initialization system
 * - Scroll progress tracking
 * - Memory-safe event listeners
 */

(function () {
  // --- Constants ---
  const THEME_KEY = 'theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';
  
  // --- Theme Management ---
  const ThemeManager = {
    /**
     * Initialize theme based on user preference or system setting
     */
    init: function() {
      const savedTheme = localStorage.getItem(THEME_KEY);
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme || (systemDark ? DARK_THEME : LIGHT_THEME);
      
      this.applyTheme(initialTheme);
      this.setupThemeListeners();
    },
    
    /**
     * Apply theme to document
     * @param {string} theme - Theme to apply (dark/light)
     */
    applyTheme: function(theme) {
      document.documentElement.classList.toggle(DARK_THEME, theme === DARK_THEME);
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('aria-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
    },
    
    /**
     * Toggle between dark/light themes
     */
    toggle: function() {
      const currentTheme = document.documentElement.classList.contains(DARK_THEME) 
        ? DARK_THEME 
        : LIGHT_THEME;
      const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
      this.applyTheme(newTheme);
    },
    
    /**
     * Set up theme-related event listeners
     */
    setupThemeListeners: function() {
      // System theme change listener
      const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemThemeHandler = (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
          this.applyTheme(e.matches ? DARK_THEME : LIGHT_THEME);
        }
      };
      colorSchemeQuery.addEventListener('change', systemThemeHandler);
      
      // Cleanup reference
      window._themeCleanup = () => {
        colorSchemeQuery.removeEventListener('change', systemThemeHandler);
      };
    }
  };

  // --- Mobile Menu ---
  const MobileMenu = {
    /**
     * Initialize mobile menu functionality
     */
    init: function() {
      const menuBtn = document.getElementById('mobile-menu-btn');
      const menu = document.getElementById('mobile-menu');
      
      if (!menuBtn || !menu) return;
      
      const toggleMenu = () => {
        const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
        menuBtn.setAttribute('aria-expanded', !expanded);
        menu.classList.toggle('hidden');
        
        // Lock body scroll when menu is open
        document.body.style.overflow = expanded ? '' : 'hidden';
      };
      
      menuBtn.addEventListener('click', toggleMenu);
      
      // Close menu when clicking outside or on links
      const closeOnClickOutside = (e) => {
        if (!menu.contains(e.target) {
          menuBtn.setAttribute('aria-expanded', 'false');
          menu.classList.add('hidden');
          document.body.style.overflow = '';
        }
      };
      
      document.addEventListener('click', closeOnClickOutside);
      
      // Cleanup reference
      window._menuCleanup = () => {
        menuBtn.removeEventListener('click', toggleMenu);
        document.removeEventListener('click', closeOnClickOutside);
      };
    }
  };

  // --- Scroll Progress ---
  const ScrollProgress = {
    /**
     * Initialize scroll progress tracking
     */
    init: function() {
      const progress = document.getElementById('scroll-progress');
      if (!progress) return;
      
      const updateProgress = () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const docHeight = document.documentElement.scrollHeight - 
                         document.documentElement.clientHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progress.style.width = `${percent}%`;
      };
      
      updateProgress();
      window.addEventListener('scroll', updateProgress);
      
      // Cleanup reference
      window._scrollCleanup = () => {
        window.removeEventListener('scroll', updateProgress);
      };
    }
  };

  // --- Component Initializer ---
  const ComponentManager = {
    /**
     * Initialize all registered components
     */
    init: function() {
      // Check and initialize components if they exist
      const components = [
        'initAnimations',
        'setupBackToTop',
        'setupSearchInputs',
        'setupCopyButtons',
        'setupHotkeys',
        'setupPageTransitions'
      ];
      
      components.forEach(component => {
        if (window.AppUtils && typeof window.AppUtils[component] === 'function') {
          window.AppUtils[component]();
        }
      });
    }
  };

  // --- Main Initialization ---
  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    MobileMenu.init();
    ScrollProgress.init();
    ComponentManager.init();
  });

  // --- Cleanup ---
  window.addEventListener('beforeunload', () => {
    // Cleanup all event listeners
    if (typeof window._themeCleanup === 'function') window._themeCleanup();
    if (typeof window._menuCleanup === 'function') window._menuCleanup();
    if (typeof window._scrollCleanup === 'function') window._scrollCleanup();
  });

  // --- Public API ---
  window.AppUtils = window.AppUtils || {};
  window.AppUtils.ThemeManager = ThemeManager;
  window.AppUtils.MobileMenu = MobileMenu;
  
  // Legacy support
  window.app = window.AppUtils;
})();