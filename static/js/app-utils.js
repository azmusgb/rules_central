"use strict";
(function (global) {
  const AppUtils = {
    config: {
      toast: {
        maxVisible: 3,
        defaultDuration: 4000,
        animationDuration: 300
      },
      animations: {
        intersectionThreshold: 0.1
      },
      transitions: {
        pageFadeDuration: 200
      }
    }
  };

  // Toast notification system
  AppUtils.toast = {
    show: function (message, type = "info", duration = AppUtils.config.toast.defaultDuration) {
      const types = {
        error: { icon: "fa-circle-exclamation", class: "error" },
        success: { icon: "fa-circle-check", class: "success" },
        info: { icon: "fa-circle-info", class: "info" },
        warning: { icon: "fa-triangle-exclamation", class: "warning" }
      };

      const toastType = types[type] || types.info;
      const toasts = document.querySelectorAll(".toast");

      // Remove oldest toast if max visible reached
      if (toasts.length >= AppUtils.config.toast.maxVisible) {
        const oldestToast = toasts[0];
        oldestToast.classList.remove("show");
        setTimeout(() => oldestToast.remove(), AppUtils.config.toast.animationDuration);
      }

      // Create new toast
      const toast = document.createElement("div");
      toast.className = `toast ${toastType.class}`;
      toast.setAttribute("role", "alert");
      toast.setAttribute("aria-live", "assertive");
      toast.setAttribute("aria-atomic", "true");
      toast.innerHTML = `
        <i class="fas ${toastType.icon}" aria-hidden="true"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close notification">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      `;

      document.body.appendChild(toast);
      // Force reflow to enable CSS transition
      void toast.offsetHeight;
      toast.classList.add("show");

      const removeToast = () => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), AppUtils.config.toast.animationDuration);
      };

      const timer = setTimeout(removeToast, duration);
      
      // Close on click or keyboard
      const closeBtn = toast.querySelector(".toast-close");
      closeBtn.addEventListener("click", () => {
        clearTimeout(timer);
        removeToast();
      });
      
      // Auto-remove when obscured
      const observer = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) {
          clearTimeout(timer);
          removeToast();
          observer.disconnect();
        }
      }, { threshold: 0 });
      observer.observe(toast);

      return {
        dismiss: () => {
          clearTimeout(timer);
          removeToast();
        }
      };
    }
  };

  // Animation system
  AppUtils.animate = {
    init: function () {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("animate-in");
              this.observer.unobserve(entry.target);
            }
          });
        },
        { threshold: AppUtils.config.animations.intersectionThreshold }
      );

      document.querySelectorAll("[data-animate]").forEach((el) => {
        this.observer.observe(el);
      });
    },

    animateElement: function (element, animationClass) {
      element.classList.add(animationClass);
      return new Promise((resolve) => {
        const handler = () => {
          element.removeEventListener("animationend", handler);
          resolve();
        };
        element.addEventListener("animationend", handler);
      });
    }
  };

  // Scroll management
  AppUtils.scroll = {
    setupBackToTop: function () {
      const backToTopBtn = document.getElementById("backToTop");
      if (!backToTopBtn) return;

      const toggleVisibility = () => {
        backToTopBtn.classList.toggle("show", window.scrollY > 300);
        backToTopBtn.setAttribute("aria-hidden", window.scrollY <= 300);
      };

      window.addEventListener("scroll", toggleVisibility);
      toggleVisibility(); // Initialize state

      backToTopBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
        backToTopBtn.blur();
      });
    },

    trackProgress: function () {
      const progressBar = document.getElementById("scroll-progress");
      if (!progressBar) return;

      const updateProgress = () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPosition = window.scrollY;
        const progress = (scrollPosition / scrollHeight) * 100;
        progressBar.style.width = `${progress}%`;
      };

      window.addEventListener("scroll", updateProgress);
      updateProgress(); // Initialize
    }
  };

  // Form utilities
  AppUtils.forms = {
    setupSearchInputs: function () {
      document.querySelectorAll(".search-container").forEach((container) => {
        const input = container.querySelector('input[type="search"]');
        const clearBtn = container.querySelector(".clear-search");

        if (!input || !clearBtn) return;

        const updateClearButton = () => {
          const hasValue = input.value.trim().length > 0;
          clearBtn.classList.toggle("hidden", !hasValue);
          clearBtn.setAttribute("aria-hidden", !hasValue);
        };

        input.addEventListener("input", updateClearButton);
        input.addEventListener("focus", updateClearButton);
        input.addEventListener("blur", () => {
          if (!input.value.trim()) {
            clearBtn.classList.add("hidden");
            clearBtn.setAttribute("aria-hidden", true);
          }
        });

        clearBtn.addEventListener("click", (e) => {
          e.preventDefault();
          input.value = "";
          input.focus();
          updateClearButton();
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });
      });
    }
  };

  // Code utilities
  AppUtils.code = {
    setupCopyButtons: function () {
      document.querySelectorAll("pre > code").forEach((code) => {
        const pre = code.parentElement;
        if (pre.querySelector(".copy-btn")) return;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "copy-btn";
        btn.setAttribute("aria-label", "Copy code to clipboard");
        btn.innerHTML = '<i class="fas fa-copy" aria-hidden="true"></i>';
        
        btn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(code.textContent || "");
            this.showCopyFeedback(btn, "Copied!");
          } catch (err) {
            this.showCopyFeedback(btn, "Failed to copy");
            console.error("Failed to copy text: ", err);
          }
        });

        const wrapper = document.createElement("div");
        wrapper.className = "code-block-wrapper";
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
        pre.appendChild(btn);
      });
    },

    showCopyFeedback: function (button, message) {
      const originalHTML = button.innerHTML;
      button.innerHTML = `<i class="fas fa-check" aria-hidden="true"></i> ${message}`;
      button.disabled = true;
      
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.disabled = false;
      }, 2000);
    }
  };

  // Keyboard shortcuts
  AppUtils.keyboard = {
    init: function () {
      document.addEventListener("keydown", this.handleHotkeys.bind(this));
    },

    handleHotkeys: function (e) {
      // Skip if typing in an input/textarea or with modifier keys
      if (e.target.matches("input, textarea, [contenteditable]") || 
          e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const searchInput = document.getElementById("search-input");
      const themeToggle = document.getElementById("theme-toggle");
      const helpButton = document.getElementById("help-button");

      switch (e.key) {
        case "/":
          if (searchInput && !e.shiftKey) {
            e.preventDefault();
            searchInput.focus();
          }
          break;
        case "t":
        case "T":
          if (themeToggle) {
            e.preventDefault();
            themeToggle.click();
          }
          break;
        case "?":
          if (helpButton && e.shiftKey) {
            e.preventDefault();
            helpButton.click();
          }
          break;
        case "Escape":
          // Close any open modals or dropdowns
          document.activeElement.blur();
          break;
      }
    }
  };

  // Page transitions
  AppUtils.transitions = {
    init: function () {
      if (!document.body) return;

      document.body.classList.add("page-transition");
      requestAnimationFrame(() => {
        document.body.classList.add("page-transition-active");
      });

      this.setupLinkTransitions();
    },

    setupLinkTransitions: function () {
      document.querySelectorAll("a[href]").forEach((link) => {
        const url = new URL(link.href, location.href);
        if (url.origin !== location.origin || url.hash) return;

        link.addEventListener("click", (e) => {
          if (this.shouldIgnoreClick(e, link)) return;
          
          e.preventDefault();
          this.fadeOutPage(link.href);
        });
      });
    },

    shouldIgnoreClick: function (event, link) {
      return (
        event.defaultPrevented ||
        link.target === "_blank" ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      );
    },

    fadeOutPage: function (destination) {
      document.body.classList.remove("page-transition-active");
      setTimeout(() => {
        location.href = destination;
      }, AppUtils.config.transitions.pageFadeDuration);
    }
  };

  // Initialize everything
  AppUtils.init = function () {
    this.animate.init();
    this.scroll.setupBackToTop();
    this.scroll.trackProgress();
    this.forms.setupSearchInputs();
    this.code.setupCopyButtons();
    this.keyboard.init();
    this.transitions.init();

    // Handle flashed messages
    const flashedMessages = document.body.dataset.flashedMessages;
    if (flashedMessages) {
      try {
        const messages = JSON.parse(flashedMessages);
        messages.forEach(([type, message]) => {
          this.toast.show(message, type);
        });
      } catch (e) {
        console.error("Error parsing flashed messages:", e);
      }
    }
  };

  // Export to global scope
  global.AppUtils = AppUtils;
  
  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", () => AppUtils.init());
  
  // For backward compatibility
  if (!global.app) {
    global.app = {
      showToast: AppUtils.toast.show,
      init: AppUtils.init
    };
  }
})(window);