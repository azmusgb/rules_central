"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const tocLinks = document.querySelectorAll(".toc-link");
  if (!tocLinks.length) return;
  window.addEventListener("scroll", () => {
    let found = false;
    tocLinks.forEach((link) => {
      const section = document.querySelector(link.getAttribute("href"));
      if (section && !found && section.getBoundingClientRect().top < 120) {
        tocLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        found = true;
      }
    });
  });
});
