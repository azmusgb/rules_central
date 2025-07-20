/**
 * navigation.js — handles main nav, mobile drawer & user menu
 * -----------------------------------------------------------
 * Features:
 * ✅ Toggles mobile nav drawer
 * ✅ Updates aria-expanded attributes for accessibility
 * ✅ Manages user dropdown menu
 * ✅ Handles scroll progress bar (#scroll-progress)
 */

export function initNavigation() {
  const html = document.documentElement;
  const body = document.body;

  /* --------------------------
     MOBILE NAV DRAWER
  --------------------------- */
  const navToggle = document.getElementById('rc-nav-mobile-toggle');
  const navDrawer = document.getElementById('rc-nav-mobile-drawer');

  if (navToggle && navDrawer) {
    navToggle.addEventListener('click', () => {
      const isOpen = navDrawer.hasAttribute('data-open');
      navDrawer.toggleAttribute('hidden', isOpen);
      navDrawer.toggleAttribute('data-open', !isOpen);
      navToggle.setAttribute('aria-expanded', !isOpen);
      navToggle.classList.toggle('active', !isOpen);

      // Prevent background scroll when open
      body.classList.toggle('overflow-hidden', !isOpen);
    });
  }

  /* --------------------------
     USER MENU DROPDOWN
  --------------------------- */
  const userBtn = document.querySelector('[data-user-menu] .rc-user-btn');
  const userMenu = document.querySelector('[data-user-menu] .rc-user-menu');

  if (userBtn && userMenu) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !userMenu.hidden;
      userMenu.hidden = isOpen;
      userBtn.setAttribute('aria-expanded', !isOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!userMenu.hidden && !userBtn.contains(e.target) && !userMenu.contains(e.target)) {
        userMenu.hidden = true;
        userBtn.setAttribute('aria-expanded', false);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !userMenu.hidden) {
        userMenu.hidden = true;
        userBtn.setAttribute('aria-expanded', false);
      }
    });
  }

  /* --------------------------
     SCROLL PROGRESS BAR
  --------------------------- */
  const scrollBar = document.getElementById('scroll-progress');
  if (scrollBar) {
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (scrollTop / docHeight) * 100;
      scrollBar.style.width = `${scrolled}%`;
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress(); // initial render
  }

  /* --------------------------
     ACCESSIBLE FOCUS STATE
  --------------------------- */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      html.classList.add('keyboard-nav');
    }
  });

  window.addEventListener('mousedown', () => {
    html.classList.remove('keyboard-nav');
  });
}

/* Auto-init when DOM ready */
document.addEventListener('DOMContentLoaded', () => initNavigation());