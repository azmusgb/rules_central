// Footer behaviour

document.getElementById('current-year').textContent = new Date().getFullYear();

document.addEventListener('alpine:init', () => {
  Alpine.data('helpSystem', () => ({
    open: false,
    toggle() {
      this.open = !this.open;
    }
  }));
});
