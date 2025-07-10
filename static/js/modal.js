const modal = document.getElementById('modal');
document.querySelectorAll('[data-modal]').forEach(btn => {
  btn.addEventListener('click', () => {
    fetch(btn.dataset.modal).then(r => r.text()).then(html => {
      document.getElementById('modal-content').innerHTML = html;
      modal.classList.remove('hidden');
    });
  });
});
document.getElementById('modal-close')?.addEventListener('click', () => {
  modal.classList.add('hidden');
});
