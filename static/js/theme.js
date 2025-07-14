/**
 * theme.js — accessible light/dark toggle with persistence
 * --------------------------------------------------------
 * Adds/removes `dark` class on <html>, syncs with system prefs,
 * and stores user choice in localStorage.
 */

const STORAGE_KEY = 'theme';
const systemDark  = window.matchMedia('(prefers-color-scheme: dark)');

function apply(theme) {
  const html = document.documentElement;
  theme === 'dark' ? html.classList.add('dark') : html.classList.remove('dark');
}

function current() {
  return localStorage.getItem(STORAGE_KEY) || (systemDark.matches ? 'dark' : 'light');
}

export function initThemeToggle(btnSelector) {
  apply(current());

  const btn = document.querySelector(btnSelector);
  if (!btn) return;

  btn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  });

  systemDark.addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) apply(e.matches ? 'dark' : 'light');
  });
}

/* Auto-init on DOM ready */
document.addEventListener('DOMContentLoaded', () => initThemeToggle('#theme-toggle'));
