// Additional behaviour for API test utility page
// Improved: focus trap, ARIA, keyboard, event cleanup for modal

document.addEventListener("DOMContentLoaded", function () {
  const helpButton = document.getElementById("helpButton");
  const helpModal = document.getElementById("quickHelpModal");
  const closeHelpModal = document.getElementById("closeHelpModal");
  let lastFocused = null;

  function openModal(modal) {
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    lastFocused = document.activeElement;
    setTimeout(() => {
      const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length) focusable[0].focus();
    }, 10);
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }
  function trapFocus(e) {
    if (!helpModal || helpModal.classList.contains("hidden")) return;
    const focusable = helpModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length-1];
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  }
  if (helpButton && helpModal && closeHelpModal) {
    helpButton.addEventListener("click", () => openModal(helpModal));
    closeHelpModal.addEventListener("click", () => closeModal(helpModal));
    helpModal.addEventListener("click", (e) => {
      if (e.target === helpModal) closeModal(helpModal);
    });
    document.addEventListener("keydown", function (e) {
      if (!helpModal.classList.contains("hidden")) {
        if (e.key === "Escape") closeModal(helpModal);
        trapFocus(e);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const endpointInput = document.getElementById("endpoint");
        if (endpointInput) endpointInput.focus();
      }
      // Close all open modals on Escape
      if (e.key === "Escape") {
        document.querySelectorAll('[id$="Modal"]:not(.hidden)').forEach((modal) => {
          closeModal(modal);
        });
      }
    });
  }
  window.addEventListener('unload', () => {
    if (helpButton) helpButton.onclick = null;
    if (closeHelpModal) closeHelpModal.onclick = null;
    if (helpModal) helpModal.onclick = null;
    document.removeEventListener("keydown", trapFocus);
  });
});
