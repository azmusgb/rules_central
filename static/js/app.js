'use strict';
// Core app initialization and theme management

document.addEventListener('DOMContentLoaded', () => {
  // Dark mode toggle shared across templates
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem(
        'theme',
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      );
    });
  }

  // Set initial theme
  if (localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Initialize shared UI components
  window.AppUtils.initAnimations();
  window.AppUtils.setupBackToTop();
  window.AppUtils.setupSearchInputs();
});

// Expose AppUtils under previous namespace for legacy scripts
window.app = window.AppUtils;
