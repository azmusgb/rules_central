"use strict";

/**
 * base.js — Global layout & theme management
 * ------------------------------------------
 * ✅ Lazy-loads heavy scripts
 * ✅ Manages theme with ARIA + custom event dispatch
 * ✅ Page transitions with loader
 * ✅ Scroll progress bar & reduced-motion support
 * ✅ Registers Service Worker safely
 */

// ================================
// Utility: Script Loader
// ================================
const loadScript = (src, attrs = {}) =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;

    for (const [k, v] of Object.entries(attrs)) {
      script.setAttribute(k, v);
    }

    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

// ================================
// Lazy Loading for Optional Scripts
// ================================
const lazyLoadScripts = () => {
  const { dataset } = document.body;

  const scriptQueue = [
    { src: "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js" },
    { src: "https://cdn.jsdelivr.net/npm/fuse.js@6.6.2" },
    dataset.appUtilsUrl ? { src: dataset.appUtilsUrl } : null,
    dataset.appUrl ? { src: dataset.appUrl } : null
  ].filter(Boolean);

  // IntersectionObserver-based lazy load
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;

        const { src, ...attrs } = target.dataset;
        loadScript(src, attrs).catch(console.error);
        obs.unobserve(target);
      });
    }, { rootMargin: "200px" });

    scriptQueue.forEach((script) => {
      const placeholder = document.createElement("div");
      placeholder.dataset.src = script.src;
      for (const [k, v] of Object.entries(script)) {
        if (k !== "src") placeholder.dataset[k] = v;
      }
      placeholder.style.display = "none";
      document.body.appendChild(placeholder);
      observer.observe(placeholder);
    });
  } else {
    // Fallback: load immediately
    scriptQueue.forEach(({ src, ...attrs }) => loadScript(src, attrs));
  }
};

// ================================
// Theme Management
// ================================
const initTheme = () => {
  const html = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  const icon = btn?.querySelector("i");

  const THEMES = ["light", "dark", "bear"];
  const ICONS = {
    light: "fa-moon",
    dark: "fa-sun",
    bear: "fa-paw"
  };

  const applyTheme = (theme) => {
    html.setAttribute("data-theme", theme);
    html.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);

    if (icon) icon.className = `fas ${ICONS[theme]}`;
    if (btn) btn.setAttribute("aria-label", `Toggle theme (current: ${theme})`);

    // Alpine.js / Livewire compatibility
    if (html.__x?.$data) html.__x.$data.theme = theme;

    document.dispatchEvent(new CustomEvent("theme-change", { detail: { theme } }));
  };

  // Initial theme detection
  let storedTheme = localStorage.getItem("theme");
  if (!storedTheme) storedTheme = "bear";
  applyTheme(storedTheme);

  let themeIndex = THEMES.indexOf(storedTheme);
  if (themeIndex === -1) themeIndex = 0;

  // Toggle theme cycle on button click
  const themeClickHandler = () => {
    themeIndex = (themeIndex + 1) % THEMES.length;
    applyTheme(THEMES[themeIndex]);
  };

  btn?.addEventListener("click", themeClickHandler);

  // Sync with system changes only if no explicit user theme
  const systemMedia = window.matchMedia("(prefers-color-scheme: dark)");
  const systemChangeHandler = (e) => {
    if (!localStorage.getItem("theme")) {
      applyTheme(e.matches ? "dark" : "light");
    }
  };
  systemMedia.addEventListener("change", systemChangeHandler);

  // Cleanup listeners on unload
  window.addEventListener("unload", () => {
    btn?.removeEventListener("click", themeClickHandler);
    systemMedia.removeEventListener("change", systemChangeHandler);
  });
};

// ================================
// Page Loader (Smooth transitions)
// ================================
let pageLoader = null;

const hideLoader = () => {
  pageLoader = pageLoader || document.getElementById("app-loader");
  if (!pageLoader) return;
  pageLoader.style.opacity = "0";
  setTimeout(() => (pageLoader.style.display = "none"), 300);
};

const showLoader = () => {
  pageLoader = pageLoader || document.getElementById("app-loader");
  if (!pageLoader) return;
  pageLoader.style.display = "flex";
  requestAnimationFrame(() => (pageLoader.style.opacity = "1"));
};

// ================================
// Smooth Page Transitions
// ================================
const setupPageTransitions = () => {
  document.querySelectorAll("a[href]").forEach((link) => {
    const url = new URL(link.href, window.location.origin);

    // Skip external links, hash jumps, and new tab links
    if (link.target || url.origin !== window.location.origin || url.hash) return;

    link.addEventListener("click", (e) => {
      // Skip modifier key clicks (open in new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      showLoader();
      setTimeout(() => (window.location.href = link.href), 200);
    });
  });
};

// ================================
// Service Worker Registration
// ================================
const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator)) return;

  const swUrl = document.body.dataset.serviceWorkerUrl;
  if (!swUrl) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl)
      .then((reg) => console.log("✅ ServiceWorker registered:", reg.scope))
      .catch((err) => console.warn("❌ ServiceWorker failed:", err));
  });
};

// ================================
// Scroll Progress Bar
// ================================
const updateScrollProgress = () => {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  bar.style.width = `${percent}%`;
};

// ================================
// Reduced Motion Support
// ================================
const disableAnimationsForReducedMotion = () => {
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".particle, .animated").forEach((el) => {
    el.style.animation = "none";
    el.style.transition = "none";
  });
};

// ================================
// Main Initializer
// ================================
const initBase = () => {
  hideLoader();
  initTheme();
  setupPageTransitions();
  lazyLoadScripts();
  registerServiceWorker();
  updateScrollProgress();
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  disableAnimationsForReducedMotion();
};

// Init when DOM is ready
document.addEventListener("DOMContentLoaded", initBase);

// End of base.js