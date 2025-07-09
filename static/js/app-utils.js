"use strict";
(function (global) {
  const AppUtils = {};

  // Toast notification system
  AppUtils.showToast = function (message, type = "info") {
    const normalized =
      {
        red: "error",
        danger: "error",
        green: "success",
        success: "success",
        info: "info",
      }[type] || type;

    const icons = {
      error: "fa-exclamation-circle",
      success: "fa-check-circle",
      info: "fa-info-circle",
    };

    const existing = document.querySelectorAll(".toast");
    if (existing.length >= 3) existing[0].remove();

    const toast = document.createElement("div");
    toast.className = `toast ${normalized}`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = `
      <i class="fas ${icons[normalized] || icons.info}"></i>
      <span>${message}</span>
      <button class="toast-close" aria-label="Close notification"><i class="fas fa-times"></i></button>
    `;

    document.body.appendChild(toast);
    toast.offsetHeight;
    toast.classList.add("show");

    const remove = () => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    };

    const timer = setTimeout(remove, 4000);
    toast.querySelector(".toast-close").addEventListener("click", () => {
      clearTimeout(timer);
      remove();
    });
  };

  // Animation system
  AppUtils.initAnimations = function () {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el);
    });
  };

  // Back to top button
  AppUtils.setupBackToTop = function () {
    const backToTopBtn = document.getElementById("backToTop");
    if (!backToTopBtn) return;

    window.addEventListener("scroll", () => {
      backToTopBtn.classList.toggle("show", window.scrollY > 300);
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  // Search input clear buttons
  AppUtils.setupSearchInputs = function () {
    document.querySelectorAll(".search-container").forEach((container) => {
      const input = container.querySelector('input[type="search"]');
      const clearBtn = container.querySelector(".clear-search");

      if (input && clearBtn) {
        input.addEventListener("input", () => {
          clearBtn.classList.toggle("hidden", !input.value);
        });

        clearBtn.addEventListener("click", () => {
          input.value = "";
          clearBtn.classList.add("hidden");
          input.dispatchEvent(new Event("input"));
        });
      }
    });
  };

  // Copy buttons for code blocks
  AppUtils.setupCopyButtons = function () {
    document.querySelectorAll("pre").forEach((pre) => {
      if (pre.dataset.copyAttached || pre.parentElement.querySelector(".copy-btn")) return;
      const wrapper = pre.parentElement;
      if (wrapper) {
        wrapper.style.position = wrapper.style.position || "relative";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "copy-btn";
        btn.innerHTML = '<i class="fas fa-copy"></i>';
        btn.addEventListener("click", () => {
          navigator.clipboard.writeText(pre.innerText.trim());
          if (window.app && window.app.showToast) {
            window.app.showToast("Copied to clipboard", "success");
          }
        });
        wrapper.appendChild(btn);
        pre.dataset.copyAttached = "true";
      }
    });
  };

  // Global keyboard shortcuts
  AppUtils.setupKeyboardShortcuts = function () {
    document.addEventListener("keydown", (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      )
        return;

      if (e.key === "t") {
        if (AppUtils.toggleTheme) AppUtils.toggleTheme();
      } else if (e.key === "/") {
        const search = document.querySelector('[data-hotkey="/"]');
        if (search) {
          e.preventDefault();
          search.focus();
        }
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        const helpBtn = document.getElementById("help-button");
        if (helpBtn) {
          e.preventDefault();
          helpBtn.click();
        }
      }
    });
  };

  global.AppUtils = AppUtils;
  if (!global.app) {
    global.app = AppUtils; // backward compatibility
  }
})(window);
