'use strict';
/* ==========================================================================
   Hierarchy UI – glue layer around HierarchyViewer ▸ 2025-06-19 rev-FULL
   • real-time metric counters
   • interactive filters (vacant / contractor / remote)
   • dynamic re-indexing of search when filters change
   ========================================================================== */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* convenient truthy helpers ------------------------------------------------ */
const yes = v => ['yes', 'y', 'true', '1', true].includes(
  (typeof v === 'string') ? v.toLowerCase() : v
);

/* resolve node flags once – avoids hammering DOM / data -------------------- */
function nodeFlags (node) {
  const d = node.data;
  return {
    vacant:     yes(d.Vacant     ?? d.IsVacant     ?? d.RoleStatus   === 'Vacant'),
    contractor: yes(d.Contractor ?? d.IsContractor ?? d.EmployeeType === 'Contractor'),
    remote:     yes(d.Remote     ?? d.IsRemote     ?? d.WorkMode     === 'Remote')
  };
}

document.addEventListener('hv-ready', ({ detail: { viewer } }) => {
  /* bind filter check-boxes ---------------------------------------------- */
  const cbVacant     = $('#filter-vacant');
  const cbContract   = $('#filter-contract');
  const cbRemoteOnly = $('#filter-remote');
  const btnReset     = $('#filter-reset');

  const applyFilters = () => {
    const wantVacant   = cbVacant.checked;
    const wantContract = cbContract.checked;
    const wantRemote   = cbRemoteOnly.checked;

    viewer.flat.forEach(rec => {
      const flags  = rec._flags ||= nodeFlags(rec);   // memoise
      const show =
        (!wantVacant   || flags.vacant) &&
        (!wantContract || flags.contractor) &&
        (!wantRemote   || flags.remote);

      rec.el.style.display = show ? '' : 'none';
    });

    /* re-index visible records for search */
    const visible = viewer.flat.filter(r => r.el.offsetParent !== null);
    viewer.search.build(visible);

    updateMetrics();
  };

  const updateMetrics = () => {
    const visible = viewer.flat.filter(r => r.el.offsetParent !== null);
    $('#metric-nodes').textContent = visible.length;
    $('#metric-levels').textContent =
      Math.max(...visible.map(n => n.path.split('>').length - 1)) + 1;
    $('#metric-divisions').textContent =
      [...new Set(visible.map(n => n.data?.Division || '—'))]
        .filter(x => x !== '—').length;
    $('#node-count').textContent = `${visible.length} nodes`;
  };

  /* wire up listeners ----------------------------------------------------- */
  [cbVacant, cbContract, cbRemoteOnly].forEach(cb =>
    cb?.addEventListener('change', applyFilters));
  btnReset?.addEventListener('click', () => {
    cbVacant.checked = cbRemoteOnly.checked = false;
    cbContract.checked = true;
    applyFilters();
  });

  /* live metric update when a node is selected (descendant counts, etc.) -- */
  window.addEventListener('hv-node-selected', updateMetrics);

  /* initialise ------------------------------------------------------------ */
  applyFilters();
  $('#last-updated').textContent = 'just now';
});