/**
 * theme.js — Accessible Theme Toggle with Persistence
 * ---------------------------------------------------
 * Cycles between: Bear, Dark, Light, High Contrast, and System themes.
 * - Bear = refreshed light palette
 * - Dark = standard dark mode
 * - Light = classic light mode
 * - Contrast = high-contrast mode
 * - System = auto-detect based on OS setting
 *
 * Persists user choice in localStorage (`rc-theme`).
 * Defaults to "bear" when no choice is stored.
 *
 * Features:
 * ✅ Accessible aria-label updates
 * ✅ Automatic system theme reaction when set to "system"
 * ✅ Minimal flash of incorrect theme by applying ASAP
 */

const STORAGE_KEY = 'rc-theme';
const THEMES = ['bear', 'dark', 'light', 'contrast', 'system'];
const mediaQueryDark = window.matchMedia('(prefers-color-scheme: dark)');

/**
 * Resolves a theme into its *actual* applied theme
 * @param {string} theme - One of THEMES
 * @returns {string} - 'bear', 'dark', 'light', or 'contrast'
 */
function resolveTheme(theme) {
  return theme === 'system'
    ? (mediaQueryDark.matches ? 'dark' : 'light')
    : theme;
}

/**
 * Applies the theme by updating <html> attributes & classes
 * @param {string} theme - One of THEMES
 */
function applyTheme(theme) {
  const html = document.documentElement;
  const applied = resolveTheme(theme);

  // Set theme attribute for CSS selectors
  html.dataset.theme = applied;

  // Toggle known classes for backwards-compatible CSS
  html.classList.toggle('dark', applied === 'dark');
  html.classList.toggle('contrast', applied === 'contrast');
  html.classList.toggle('bear', applied === 'bear');
}

/**
 * Returns the currently stored theme or defaults to 'bear'
 */
function getStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return THEMES.includes(stored) ? stored : 'bear';
}

/**
 * Stores the theme in localStorage
 */
function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Updates the aria-label for accessibility
 */
function updateAriaLabel(button, theme) {
  const appliedTheme = theme === 'system' ? `${resolveTheme(theme)} (system)` : theme;
  button.setAttribute('aria-label', `Switch theme (current: ${appliedTheme})`);
}

/**
 * Cycles to the next theme in the THEMES array
 */
function getNextTheme(currentTheme) {
  const idx = THEMES.indexOf(currentTheme);
  return THEMES[(idx + 1) % THEMES.length];
}

/**
 * Initializes the theme toggle button
 * @param {string} btnSelector - CSS selector for the toggle button
 */
export function initThemeToggle(btnSelector = '#theme-toggle') {
  const btn = document.querySelector(btnSelector);
  if (!btn) return;

  // Apply initial theme
  const initialTheme = getStoredTheme();
  applyTheme(initialTheme);
  updateAriaLabel(btn, initialTheme);

  // Click -> cycle themes
  btn.addEventListener('click', () => {
    const currentTheme = getStoredTheme();
    const nextTheme = getNextTheme(currentTheme);
    saveTheme(nextTheme);
    applyTheme(nextTheme);
    updateAriaLabel(btn, nextTheme);
  });

  // Auto-respond to system theme changes if on "system"
  mediaQueryDark.addEventListener('change', (e) => {
    const storedTheme = getStoredTheme();
    if (storedTheme === 'system') {
      applyTheme('system');
      updateAriaLabel(btn, 'system');
    }
  });
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle('#theme-toggle');
});