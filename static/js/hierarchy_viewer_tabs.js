// Lightweight tab switcher

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
});
