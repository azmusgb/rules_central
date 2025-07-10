const sidebar = document.getElementById('sidebar');
document.querySelectorAll('[data-sidebar-toggle]').forEach(btn => {
  btn.addEventListener('click', () => sidebar.classList.toggle('hidden'));
});
