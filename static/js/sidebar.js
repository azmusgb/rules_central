// Sidebar/drawer navigation logic (robust, accessible, maintainable)
(function() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const closeBtn = sidebar ? sidebar.querySelector('.sidebar-close') : null;
  const backdrop = document.getElementById('sidebar-backdrop');
  const navList = document.getElementById('sidebar-nav-list');
  let lastFocused = null;

  // Open sidebar and manage ARIA/focus
  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.style.display = 'block';
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    if (closeBtn) closeBtn.setAttribute('aria-expanded', 'true');
    lastFocused = document.activeElement;
    setTimeout(() => { if (sidebar) sidebar.focus(); }, 10);
    document.body.style.overflow = 'hidden';
  }
  // Close sidebar and restore ARIA/focus
  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.style.display = 'none';
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    if (closeBtn) closeBtn.setAttribute('aria-expanded', 'false');
    if (lastFocused) lastFocused.focus();
    document.body.style.overflow = '';
  }
  if (toggleBtn) toggleBtn.onclick = openSidebar;
  if (closeBtn) closeBtn.onclick = closeSidebar;
  if (backdrop) backdrop.onclick = closeSidebar;

  // Focus trap for accessibility
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
    if (sidebar && sidebar.classList.contains('open')) {
      const focusable = sidebar.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length-1];
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    }
  });
  // Close sidebar on link click
  if (navList) navList.addEventListener('click', e => {
    if (e.target.tagName === 'A') closeSidebar();
  });
  // Load navigation.json and render links (with ARIA)
  fetch('/static/navigation.json')
    .then(res => res.json())
    .then(nav => {
      if (!navList) return;
      navList.innerHTML = nav.map((item, i) =>
        `<li style="animation-delay:${i*0.04}s"><a href="${item.url}"${window.location.pathname===item.url?' aria-current="page"':''}><i class="fas ${item.icon}"></i>${item.label}</a></li>`
      ).join('');
    });
  // Cleanup: remove event listeners on unload
  window.addEventListener('unload', () => {
    if (toggleBtn) toggleBtn.onclick = null;
    if (closeBtn) closeBtn.onclick = null;
    if (backdrop) backdrop.onclick = null;
    if (navList) navList.onclick = null;
  });
})();
