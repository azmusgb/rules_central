"use strict";
// Small utility helpers shared across pages
(function (global) {
  const Helpers = {};

  Helpers.showLoadingSpinner = () => {
    const loadingSpinner = document.getElementById("loadingSpinner");
    if (loadingSpinner) {
      loadingSpinner.classList.add("show");
      loadingSpinner.setAttribute("aria-busy", "true");
    }
  };

  Helpers.hideLoadingSpinner = () => {
    const loadingSpinner = document.getElementById("loadingSpinner");
    if (loadingSpinner) {
      loadingSpinner.classList.remove("show");
      loadingSpinner.removeAttribute("aria-busy");
    }
  };

  /**
   * Display a toast notification if the global app util is available
   * Falls back to alert() when not present
   * @param {string} message - Message to display
   * @param {string} [type="info"] - success|error|info
   */
  Helpers.showToast = (message, type = "info") => {
    if (global.app && typeof global.app.showToast === "function") {
      global.app.showToast(message, type);
    } else {
      alert(`${type.toUpperCase()}: ${message}`);
    }
  };

  Helpers.waitForSvg = (container) =>
    new Promise((resolve, reject) => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            const svgElement = container.querySelector("svg");
            if (svgElement) {
              observer.disconnect();
              resolve(svgElement);
              return;
            }
          }
        }
      });
      observer.observe(container, { childList: true, subtree: true });
      setTimeout(() => reject(new Error("SVG load timeout")), 5000);
    });

  // Export helpers globally
  global.Helpers = Helpers;
})(window);
