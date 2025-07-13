// Global script for layout and theme management
// Improved: ARIA, event cleanup, maintainability

const loadScript = (src, attrs = {}) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    Object.entries(attrs).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const lazyLoadScripts = () => {
  const body = document.body;
  const scripts = [
    { src: "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js" },
    { src: "https://cdn.jsdelivr.net/npm/fuse.js@6.6.2" },
    { src: body.dataset.appUtilsUrl },
    { src: body.dataset.appUrl },
  ];

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const { src, ...attrs } = entry.target.dataset;
            loadScript(src, attrs);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "200px" },
    );

    scripts.forEach((script) => {
      const placeholder = document.createElement("div");
      placeholder.dataset.src = script.src;
      Object.entries(script).forEach(([key, value]) => {
        if (key !== "src") placeholder.dataset[key] = value;
      });
      placeholder.style.display = "none";
      document.body.appendChild(placeholder);
      observer.observe(placeholder);
    });
  } else {
    scripts.forEach((script) => loadScript(script.src, script));
  }
};

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
    if (icon) {
      icon.className = `fas ${ICONS[theme]}`;
    }
    if (btn) {
      btn.setAttribute("aria-label", `Toggle theme (current ${theme})`);
    }
    if (html.__x && html.__x.$data) {
      html.__x.$data.theme = theme;
    }
    document.dispatchEvent(new CustomEvent("theme-change", { detail: { theme } }));
  };

  const storedTheme = localStorage.getItem("theme") || "bear";

  applyTheme(storedTheme);
  let index = THEMES.indexOf(storedTheme);
  if (index === -1) index = 0;

  let themeListener;
  if (btn) {
    btn.addEventListener(
      "click",
      (themeListener = () => {
        index = (index + 1) % THEMES.length;
        applyTheme(THEMES[index]);
      })
    );
  }

  const mqListener = (e) => {
    if (!localStorage.getItem("theme")) {
      const newTheme = e.matches ? "dark" : "light";
      applyTheme(newTheme);
    }
  };
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", mqListener);

  // Clean up listeners on unload
  window.addEventListener("unload", () => {
    if (btn && themeListener) btn.removeEventListener("click", themeListener);
    mq.removeEventListener("change", mqListener);
  });
};

let pageLoader;
const hideLoader = () => {
  pageLoader = document.getElementById("app-loader");
  if (pageLoader) {
    pageLoader.style.opacity = "0";
    setTimeout(() => (pageLoader.style.display = "none"), 300);
  }
};

const showLoader = () => {
  if (pageLoader) {
    pageLoader.style.display = "flex";
    requestAnimationFrame(() => {
      pageLoader.style.opacity = "1";
    });
  }
};

const setupPageTransitions = () => {
  document.querySelectorAll("a[href]").forEach((link) => {
    const url = new URL(link.href, window.location.origin);
    if (
      link.target ||
      url.origin !== window.location.origin ||
      url.hash
    ) {
      return;
    }
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      showLoader();
      setTimeout(() => {
        window.location.href = link.href;
      }, 200);
    });
  });
};

const registerServiceWorker = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(document.body.dataset.serviceWorkerUrl)
        .then((registration) => {
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope,
          );
        })
        .catch((err) => {
          console.log("ServiceWorker registration failed: ", err);
        });
    });
  }
};

const updateScrollProgress = () => {
  const progress = document.getElementById("scroll-progress");
  if (!progress) return;
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const docHeight =
    document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progress.style.width = `${percent}%`;
};

const disableAnimationsForReducedMotion = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".particle").forEach((el) => {
      el.style.animation = "none";
    });
  }
};

// Main initializer for base layout and theme
const initBase = () => {
  hideLoader();
  initTheme();
  setupPageTransitions();
  lazyLoadScripts();
  registerServiceWorker();
  updateScrollProgress();
  window.addEventListener("scroll", updateScrollProgress);
  disableAnimationsForReducedMotion();
};

document.addEventListener("DOMContentLoaded", initBase);

// End of base.js
