/**
 * theme.js — accessible theme toggle with persistence
 * ----------------------------------------------
 * Cycles between Bear, Dark, Light, High Contrast and System themes.
 * The Bear option uses refreshed light colors.
 * Applies the `dark` class for dark mode and stores user choice in
 * localStorage. Defaults to Bear when no choice is stored.
*/

const STORAGE_KEY = 'rc-theme';
const THEMES = ['bear', 'dark', 'light', 'contrast', 'system'];
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function resolve(theme) {
  return theme === 'system' ? (systemDark.matches ? 'dark' : 'light') : theme;
}

function apply(theme) {
  const html = document.documentElement;
  const active = resolve(theme);
  html.dataset.theme = active;
  html.classList.toggle('dark', active === 'dark');
  html.classList.toggle('contrast', active === 'contrast');
}

function current() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && THEMES.includes(stored)) return stored;
  return 'bear';
}

export function initThemeToggle(btnSelector) {
  apply(current());

  const btn = document.querySelector(btnSelector);
  if (!btn) return;

  const updateLabel = (theme) => {
    const labelTheme = theme === 'system' ? `${resolve(theme)} system` : theme;
    btn.setAttribute('aria-label', `Switch theme (current ${labelTheme})`);
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
    if (localStorage.getItem(STORAGE_KEY) === 'system') {
      const next = e.matches ? 'dark' : 'light';
      apply(next);
      updateLabel('system');
    }
  });
}

/* Auto-init on DOM ready */
document.addEventListener('DOMContentLoaded', () => initThemeToggle('#theme-toggle'));
