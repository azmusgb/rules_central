// Header interactions

document.addEventListener("alpine:init", () => {
  Alpine.data("dropdown", () => ({
    open: false,
    toggle() {
      this.open = !this.open;
    },
  }));
});

const mobileMenuBtn = document.getElementById("mobile-menu-btn");
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", function () {
    const menu = document.getElementById("mobile-menu");
    const isExpanded = this.getAttribute("aria-expanded") === "true";
    this.setAttribute("aria-expanded", !isExpanded);
    menu.classList.toggle("hidden");
    const icon = this.querySelector("i");
    if (icon) {
      if (isExpanded) {
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
      } else {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-times");
      }
    }
  });
}

const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  });
}

document.querySelectorAll(".nav-link, .mobile-nav-link").forEach((link) => {
  if (link.getAttribute("href") === window.location.pathname) {
    link.classList.add(
      "text-primary-600",
      "dark:text-primary-400",
      "font-medium",
    );
    link.setAttribute("aria-current", "page");
    const underline = link.querySelector("span:last-child");
    if (underline) underline.classList.add("w-4/5", "left-[10%]");
  }
});
