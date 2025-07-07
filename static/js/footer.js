// Footer behaviour
// Refactored for ARIA, accessibility, and maintainability

// Set current year in footer
const yearEl = document.getElementById("current-year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Alpine.js help system dropdown
if (window.Alpine) {
  document.addEventListener("alpine:init", () => {
    Alpine.data("helpSystem", () => ({
      open: false,
      toggle() {
        this.open = !this.open;
      },
    }));
  });
}

// Ensure newsletter feedback uses aria-live for accessibility
const newsletterForm = document.querySelector('form[action*="newsletter"]');
if (newsletterForm) {
  let feedback = newsletterForm.querySelector('.form-feedback');
  if (feedback) feedback.setAttribute('aria-live', 'polite');
}
