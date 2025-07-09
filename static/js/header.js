// Header interactions
// Refactored for DRY theme logic, ARIA, debouncing, and maintainability

// Alpine.js dropdown for header
if (window.Alpine) {
  document.addEventListener("alpine:init", () => {
    Alpine.data("dropdown", () => ({
      open: false,
      toggle() {
        this.open = !this.open;
      },
    }));
  });
}

// Mobile menu toggle with debouncing and ARIA
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
if (mobileMenuBtn) {
  let debounce = false;
  mobileMenuBtn.addEventListener("click", function () {
    if (debounce) return;
    debounce = true;
    setTimeout(() => (debounce = false), 300);
    const menu = document.getElementById("mobile-menu");
    const isExpanded = this.getAttribute("aria-expanded") === "true";
    this.setAttribute("aria-expanded", !isExpanded);
    menu.classList.toggle("hidden");
    const icon = this.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", isExpanded);
      icon.classList.toggle("fa-times", !isExpanded);
    }
  });
}

// Theme toggle (delegates to AppUtils.toggleTheme for DRYness)
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle && window.AppUtils && window.AppUtils.toggleTheme) {
  themeToggle.addEventListener("click", window.AppUtils.toggleTheme);
}

// Highlight current navigation link and set aria-current
function highlightCurrentNav() {
  document
    .querySelectorAll(".nav-link, .mobile-nav-link, .sidebar-link")
    .forEach((link) => {
      if (link.getAttribute("href") === window.location.pathname) {
        link.classList.add(
          "text-primary-600",
          "dark:text-primary-400",
          "font-medium",
          "active"
        );
        link.setAttribute("aria-current", "page");
        const underline = link.querySelector("span:last-child");
        if (underline) underline.classList.add("w-4/5", "left-[10%]");
      }
    });
}
document.addEventListener("DOMContentLoaded", highlightCurrentNav);
