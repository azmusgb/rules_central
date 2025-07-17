/**
 * theme.js — accessible theme toggle with persistence
 * ----------------------------------------------
 * Cycles between Bear, Dark and Light themes. Applies the
 * `dark` class for dark mode and stores user choice in
 * localStorage. Falls back to system preference when no
 * choice is stored.
 */

const STORAGE_KEY = 'theme';
const THEMES = ['bear', 'dark', 'light', 'contrast'];
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function apply(theme) {
  const html = document.documentElement;
  html.dataset.theme = theme;
  html.classList.toggle('dark', theme === 'dark');
  html.classList.toggle('contrast', theme === 'contrast');
}

function current() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  return 'bear';
}

export function initThemeToggle(btnSelector) {
  apply(current());

  const btn = document.querySelector(btnSelector);
  if (!btn) return;

  const updateLabel = (theme) => {
    btn.setAttribute('aria-label', `Switch theme (current ${theme})`);
  };

  updateLabel(current());

  btn.addEventListener('click', () => {
    const idx = THEMES.indexOf(current());
    const next = THEMES[(idx + 1) % THEMES.length];
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
    updateLabel(next);
  });

  systemDark.addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const next = e.matches ? 'dark' : 'light';
      apply(next);
      updateLabel(next);
    }
  });
}

/* Auto-init on DOM ready */
document.addEventListener('DOMContentLoaded', () => initThemeToggle('#theme-toggle'));
