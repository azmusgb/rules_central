// Lightweight tab switcher
// Improved: ARIA and keyboard accessibility for tab panels

document.addEventListener("click", (e) => {
  if (!e.target.closest(".tab-btn")) return;
  const btn = e.target.closest(".tab-btn");
  btn.parentElement
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.toggle("is-active", b === btn));
  document
    .querySelectorAll(".tab-panel")
    .forEach((p) =>
      p.classList.toggle("is-active", p.id === btn.dataset.target.slice(1)),
    );
  // ARIA updates
  btn.parentElement.querySelectorAll(".tab-btn").forEach((b) => {
    b.setAttribute("aria-selected", b === btn ? "true" : "false");
    b.setAttribute("tabindex", b === btn ? "0" : "-1");
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.setAttribute("aria-hidden", !p.classList.contains("is-active"));
  });
});

document.addEventListener("keydown", (e) => {
  if (!e.target.classList.contains("tab-btn")) return;
  const tabs = Array.from(e.target.parentElement.querySelectorAll(".tab-btn"));
  let idx = tabs.indexOf(e.target);
  if (e.key === "ArrowRight") {
    e.preventDefault();
    tabs[(idx + 1) % tabs.length].focus();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    tabs[(idx - 1 + tabs.length) % tabs.length].focus();
  }
});
