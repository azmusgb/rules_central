/* =============================================================
 * Quantum Hierarchy Viewer Pro – FULL PRODUCTION BUILD  v2.3
 * -------------------------------------------------------------
 * Author : William Rahe & AI Assistant • 2 Jul 2025
 * Purpose: Interactive, filterable, searchable rule hierarchy
 *          with Glass-Indigo UI.  Works with:
 *            ① Local sample JSON  – `/static/js/sample_data/example.json`
 *            ② Live API endpoint –  `/api/hierarchy/:root_name/:diagramName`
 *
 * External deps (load in <head>):
 *   • Fuse.js ≥ 6.6       (fuzzy search)
 *   • html2canvas ≥ 1.4   (PNG export)
 *   • jspdf ≥ 2.5         (PDF export)
 *   • Shoelace ≥ 2.0      (<sl-alert>)
 * ===========================================================*/

/* eslint-env browser, es2022 */

import {
  loadProfile,
  updateProfile,
  addSearchQuery,
  getEffectiveTheme,
  PROFILE_UPDATED_EVENT
} from "./profile.js";

/* --------------------------------------------------------------------- *
 * Utility helpers
 * -------------------------------------------------------------------- */
const $$  = (sel, ctx = document) => ctx.querySelector(sel);
const $$$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const create  = (tag, cls = "") => { const el = document.createElement(tag); if (cls) el.className = cls; return el; };
const debounce = (fn, d = 250) => { let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn.apply(this,a),d); }; };

/* lightweight, collision-free toast using a fresh <sl-alert> each time */
const toast = (msg, variant = "primary") => {
  const { toastDuration = 3000 } = loadProfile?.() || {};

  // Prefer Shoelace if it’s loaded; otherwise fall back to a plain div.
  if (window.customElements?.get("sl-alert")) {
    const alert = Object.assign(document.createElement("sl-alert"), {
      variant,
      duration: toastDuration,
      closable: true,
      innerHTML: `<sl-icon slot="icon" name="info-circle"></sl-icon>${msg}`
    });
    document.body.append(alert);
    alert.toast();
  } else {
    const div = create(
      "div",
      "fixed bottom-6 right-6 z-50 bg-gray-900/90 text-white rounded px-4 py-2 shadow-lg"
    );
    div.textContent = msg;
    document.body.append(div);
    setTimeout(() => div.remove(), toastDuration);
  }
};

const spinner = {
  show() { $$("#spinner")?.classList.remove("hidden"); },
  hide() { $$("#spinner")?.classList.add("hidden"); }
};

/* --------------------------------------------------------------------- *
 * HierarchyViewer  –  main class
 * -------------------------------------------------------------------- */
export class HierarchyViewer {
  /** @typedef {Object} ViewerOptions */
  constructor(opts = {}) {
    this.opts = Object.assign({
      dataUrl:             "/static/js/sample_data/example.json",
      outlineSel:          "#diagram-outline",
      searchInputSel:      "#hierarchy-search",
      searchSuggestionSel: "#search-suggestions",
      maxSuggestions:      8
    }, opts);

    /* API mode detected via query-params or body data-attrs */
    const qs = new URLSearchParams(location.search);
    this.apiRoot    = qs.get("root_name")     || document.body.getAttribute("data-root-name");
    this.apiDiagram = qs.get("diagramName")   ||
                      qs.get("diagram_name")  ||
                      document.body.getAttribute("data-diagram-name");

    /* State */
    this.rawData       = [];
    this.fuse          = null;
    this.keyboardIdx   = -1;
    this.filteredData  = null;
    this.currentHits   = [];
    this.currentHitIdx = -1;

    /* DOM refs */
    this.outline     = $$(this.opts.outlineSel);
    this.searchInput = $$(this.opts.searchInputSel);
    this.suggestList = $$(this.opts.searchSuggestionSel);
    if (!this.outline || !this.searchInput || !this.suggestList)
      throw new Error("HierarchyViewer: required elements missing");

    this.bindEvents();
    this.init();
  }

  /* ----------------------------------------------------------------- *
   *  Lifecycle
   * ----------------------------------------------------------------- */
  async init() {
    try {
      spinner.show();

      if (this.apiRoot && this.apiDiagram) {
        await this.loadHierarchyFromAPI(this.apiRoot, this.apiDiagram);
      } else {
        await this.loadData(this.opts.dataUrl);
        this.buildFuseIndex();
        this.renderTree();
      }

      toast("Hierarchy ready ✔️");
    } catch (err) {
      console.error(err);
      toast(err.message || "Hierarchy failed ❌", "danger");
    } finally {
      spinner.hide();
    }
  }

  /* ------------------------------------------------------ *
   *  Data loaders
   * ------------------------------------------------------ */
  async loadData(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${url}`);
    this.rawData = await res.json();
  }

  async loadHierarchyFromAPI(rootName, diagramName) {
    const url = `/api/hierarchy/${encodeURIComponent(rootName)}/${encodeURIComponent(diagramName)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);

    const payload = await res.json();
    let rules = [];
    if (Array.isArray(payload)) {
      rules = payload[0]?.rules ?? payload;
    } else if (payload && Array.isArray(payload.rules)) {
      rules = payload.rules;
    }
    if (!rules.length) throw new Error("No rules returned by API");

    this.rawData = this.buildHierarchyGraph(rules);
    this.buildFuseIndex();
    this.renderTree();

    const cnt = $$("#node-count");
    if (cnt) cnt.textContent = `${rules.length} nodes`;
  }

  /* Convert flat rule array (with ParentGUID & Actions) to nested tree */
    /* ------------------------------------------------------------------
   *  Convert flat rule list into a *cycle-safe* nested graph.
   *  – Guarantees no duplicate child insertion
   *  – Breaks potential loops (visited-set)
   * ----------------------------------------------------------------- */
  buildHierarchyGraph(rules) {
    const map   = Object.create(null);   // GUID → node
    const roots = [];

    /* prime map with shallow copies so we can safely mutate .children */
    rules.forEach(r => (map[r.RuleGUID] = { ...r, children: [] }));

    /* regular parent → child links */
    rules.forEach(r => {
      if (r.ParentGUID && map[r.ParentGUID]) {
        map[r.ParentGUID].children.push(map[r.RuleGUID]);
      } else if (!r.ParentGUID ||
                 r.ParentGUID === "" ||
                 r.ParentGUID === "00000000-0000-0000-0000-000000000000") {
        roots.push(map[r.RuleGUID]);
      }
    });

    /* one-time walk to attach Action.ChildRules without duplicates / loops */
    const visited = new Set();

    const attachActionChildren = node => {
      if (!node || visited.has(node.RuleGUID)) return;
      visited.add(node.RuleGUID);

      if (Array.isArray(node.Actions)) {
        node.Actions.forEach(action => {
          if (Array.isArray(action.ChildRules)) {
            action.ChildRules.forEach(cr => {
              const target = map[cr.RuleGUID] ?? (map[cr.RuleGUID] = { ...cr, children: [] });
              /* avoid duplicate push */
              if (!node.children.includes(target)) node.children.push(target);
              attachActionChildren(target);
            });
          }
        });
      }

      node.children.forEach(attachActionChildren);
    };

    roots.forEach(attachActionChildren);
    return roots;
  }
  /* ------------------------------------------------------ *
   *  Search index
   * ------------------------------------------------------ */
  buildFuseIndex() {
    const flat = [];
    const dfs = (node, path = []) => {
      const p = [...path, node.label ?? node.RuleName ?? node.name ?? "Unnamed"];
      flat.push({ ...node, _path: p.join(" → ") });
      (node.children || []).forEach(c => dfs(c, p));
    };
    this.rawData.forEach(n => dfs(n));

    this.fuse = new Fuse(flat, {
      keys: ["label", "RuleName", "name", "_path", "FunctionName", "RuleGUID", "Container"],
      includeScore: true,
      threshold: 0.35
    });
  }

  /* ------------------------------------------------------ *
   *  Rendering
   * ------------------------------------------------------ */
  renderTree(data = null) {
    this.outline.innerHTML = "";
    this.currentHits = []; this.currentHitIdx = -1;

    const dataset = data || this.rawData;
    const ulRoot  = create("ul", "list-none space-y-1");
    this.outline.appendChild(ulRoot);
    dataset.forEach(n => ulRoot.appendChild(this.renderNode(n, 0)));

    const cnt = $$("#node-count");
    if (cnt) cnt.textContent = `${dataset.length} root node${dataset.length === 1 ? "" : "s"}`;
  }

  renderNode(node, depth) {
    const li = create("li");
    const wrap = create("div", `tree-node pl-${depth * 4}`);
    wrap.dataset.nodeId = node.RuleGUID ?? node.id ?? crypto.randomUUID();

    wrap.innerHTML = `
      <i class="fas fa-${node.Actions ? "bolt" : (node.children?.length ? "folder" : "file-alt")} text-slate-400 w-4"></i>
      <span class="flex-1">${node.label ?? node.RuleName ?? node.name ?? "<em>Unnamed</em>"}</span>
      ${node.children?.length ? '<i class="fas fa-chevron-down text-xs"></i>' : ''}
    `;
    wrap.addEventListener("click", e => this.onNodeClick(e, node, li));
    li.appendChild(wrap);

if (node.children?.length) {
  const ul = create("ul", "ml-4 space-y-1");
  // ul.hidden = true;   // show children by default
  node.children.forEach(c => ul.appendChild(this.renderNode(c, depth + 1)));
  li.appendChild(ul);
}
    return li;
  }

  onNodeClick(e, node, li) {
    e.stopPropagation();
    const ul = li.querySelector(":scope > ul");
    if (ul) {
      ul.hidden = !ul.hidden;
      const ic = li.querySelector("i.fa-chevron-down, i.fa-chevron-right");
      ic?.classList.toggle("fa-chevron-down", !ul.hidden);
      ic?.classList.toggle("fa-chevron-right",  ul.hidden);
    }
    toast(this.getNodePath(li).join(" → "));
    updateProfile({ lastVisitedNodeId: node.RuleGUID ?? node.id });
  }

  getNodePath(li) {
    const trail = [];
    let cur = li;
    while (cur && cur !== this.outline) {
      const lbl = cur.querySelector(":scope > div > span")?.textContent.trim();
      if (lbl) trail.unshift(lbl);
      cur = cur.parentElement.closest("li");
    }
    return trail;
  }
/* ------------------------------------------------------ *
 *  Details-panel rendering
 * ------------------------------------------------------ */
renderDetails(node) {
  if (!node) return;

  /* helpers */
  const escape = (s) => String(s ?? "").replace(/[&<>'"]/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const setHTML = (sel, html) => { const el = $$(sel); if (el) { el.innerHTML = html; } };

  /* ATTRIBUTES */
  const attribRows = Object.entries(node)
    .filter(([k]) => !["children","Actions"].includes(k))
    .map(([k,v]) => `<tr><td class="px-4 py-1">${escape(k)}</td><td class="px-4 py-1">${escape(v)}</td></tr>`)
    .join("");
  setHTML("#attributes-table-body", attribRows || `<tr><td colspan="2" class="px-4 py-2 text-slate-500">—</td></tr>`);

  /* ACTIONS */
  const actions = Array.isArray(node.Actions) ? node.Actions : [];
  const actionRows = actions
    .map(a => `<tr><td class="px-4 py-1">${escape(a.ActionName || a.name)}</td><td class="px-4 py-1">${escape(JSON.stringify(a.Details || a, null, 0))}</td></tr>`)
    .join("");
  setHTML("#actions-table-body", actionRows || `<tr><td colspan="2" class="px-4 py-2 text-slate-500">—</td></tr>`);

  /* RAW JSON */
  const jsonBlock = $$("#raw-json-block");
  if (jsonBlock) {
    jsonBlock.textContent = JSON.stringify(node, null, 2);
    jsonBlock.classList.remove("hidden");
    $$("#json-skeleton")?.classList.add("hidden");
  }

  /* RELATIONS (simple parent / child listing) */
  const relations = [
    ...(node.ParentGUID ? [["Parent", node.ParentGUID]] : []),
    ...((node.children||[]).map(c => ["Child", c.RuleGUID]))
  ];
  const relRows = relations
    .map(([type,id]) => `<tr><td class="px-4 py-1">${type}</td><td class="px-4 py-1">${id}</td></tr>`)
    .join("");
  setHTML("#relations-table-body", relRows || `<tr><td colspan="2" class="px-4 py-2 text-slate-500">—</td></tr>`);
}
  /* ----------------------------------------------------------------- *
   *  Event wiring
   * ----------------------------------------------------------------- */
  bindEvents() {
    /* search box */
    this.searchInput.addEventListener("input", debounce(()=>this.onSearchInput(), 200));
    this.searchInput.addEventListener("keydown", e => this.onSearchKey(e));

    /* click outside suggestions */
    document.addEventListener("click", e => {
      if (!this.suggestList.contains(e.target) && e.target !== this.searchInput) this.hideSuggestions();
    });

    /* keyboard '/' or Ctrl+F focus */
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault(); this.searchInput.focus();
      }
    });

    /* quick-filter chips */
    $$$(".btn[data-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        const rule = JSON.parse(btn.dataset.filter);
        this.applyQuickFilter(rule);
        $$$("[data-filter].btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
    $$("#filter-reset")?.addEventListener("click", () => {
      this.filteredData = null; 
      this.guidMap = Object.create(null);   // fast lookup for details panel
      this.renderTree();
      $$$("[data-filter].btn").forEach(b => b.classList.remove("active"));
    });

    /* prev / next / clear */
    $$("#prev-match")?.addEventListener("click", () => this.jumpHit(-1));
    $$("#next-match")?.addEventListener("click", () => this.jumpHit(1));
    $$("#clear-search")?.addEventListener("click", () => {
      this.searchInput.value = ""; this.hideSuggestions(); this.clearHighlights();
    });

    /* tabbed panel */
    $$$("[data-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        const t = btn.dataset.tab;
        $$$("[role='tabpanel']").forEach(p => p.classList.add("hidden"));
        $$$("[data-tab]").forEach(b => b.setAttribute("aria-selected", "false"));
        $$(`#${t}-tab`)?.classList.remove("hidden");      
      btn.setAttribute("aria-selected", "true");
      });

    });

    /* copy buttons */
    const copy = txt => navigator.clipboard.writeText(txt).then(()=>toast("Copied 📋"));
    $$("#copy-attributes")?.addEventListener("click", ()=>copy($$("#attributes-tab")?.innerText || ""));
    $$("#copy-actions")   ?.addEventListener("click", ()=>copy($$("#actions-tab")   ?.innerText || ""));
    $$("#copy-json")      ?.addEventListener("click", ()=>copy($$("#raw-json-block")?.innerText || ""));
    $$("#copy-relations") ?.addEventListener("click", ()=>copy($$("#relations-tab") ?.innerText || ""));

    /* mobile sidebar */
    const mobBtn = $$("#mobile-search-toggle");
    mobBtn?.addEventListener("click", () => {
      const side = $$("#search-sidebar");
      const hidden = side?.classList.toggle("hidden");
      mobBtn.setAttribute("aria-expanded", (!hidden).toString());
    });

    /* export modal */
    $$("#export-btn")        ?.addEventListener("click", ()=> $$("#export-modal")?.classList.remove("hidden"));
    $$("#close-export-modal")?.addEventListener("click", () => $$("#export-modal")?.classList.add("hidden"));

    /* context-menu + theme updates */
    this.outline.addEventListener("contextmenu", e => this.onContextMenu(e));
    document.addEventListener("click", () => this.hideContextMenu());

    window.addEventListener(PROFILE_UPDATED_EVENT,
      () => document.documentElement.setAttribute("data-theme", getEffectiveTheme()));
    document.documentElement.setAttribute("data-theme", getEffectiveTheme());
  }

  /* ------------------------------------------------------ *
   *  Quick-filter helper
   * ------------------------------------------------------ */
  applyQuickFilter(rule) {
    const matches = node => {
      if (rule.nodeType   && (rule.nodeType === "action") !== !!node.Actions) return false;
      if (rule.level      && (node._depth ?? 0) < +rule.level)               return false;
      if (rule.attribute  && !node[rule.attribute])                           return false;
      return true;
    };
    const walk = (nodes, d = 0) =>
      nodes
        .map(n => ({ ...n, _depth: d, children: n.children ? walk(n.children, d + 1) : [] }))
        .filter(matches);
    this.filteredData = walk(this.rawData);
    this.renderTree(this.filteredData);
  }

  /* ------------------------------------------------------ *
   *  Search handling
   * ------------------------------------------------------ */
  onSearchInput() {
    const q = this.searchInput.value.trim();
    if (q.length < 2) { this.hideSuggestions(); this.clearHighlights(); return; }

    const hits = this.fuse.search(q, { limit: this.opts.maxSuggestions }).map(r => r.item);
    this.renderSuggestions(hits);

    /* highlight nodes */
    this.clearHighlights();
    this.currentHits = $$$("span", this.outline)
      .filter(s => s.textContent.toLowerCase().includes(q.toLowerCase()))
      .map(s => s.closest("li"));
    this.currentHits.forEach(li => li.querySelector(":scope > div")
      ?.classList.add("bg-indigo-600/20"));
    if (this.currentHits.length) {
      this.currentHitIdx = 0;
      this.currentHits[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    this.updateMatchHud();
  }

  renderSuggestions(items) {
    this.suggestList.innerHTML = "";
    if (!items.length) return this.hideSuggestions();

    items.forEach((it, i) => {
      const li = create("li", "px-3 py-1 hover:bg-indigo-700/30 cursor-pointer");
      li.dataset.idx = i;
      li.textContent = it._path;
      li.addEventListener("click", () => this.selectSuggestion(it));
      this.suggestList.appendChild(li);
    });
    this.keyboardIdx = -1;
    this.suggestList.classList.remove("hidden");
  }
  hideSuggestions() { this.suggestList.classList.add("hidden"); this.keyboardIdx = -1; }

  selectSuggestion(item) {
    this.searchInput.value = item.label ?? item.RuleName ?? item.name;
    this.hideSuggestions();

    const li = this.findLiByPath(item._path);
    if (!li) return;
    this.expandToNode(li);
    li.querySelector(":scope > div")?.classList.add("bg-indigo-600/20");
    li.scrollIntoView({ behavior: "smooth", block: "center" });
    addSearchQuery(item._path);
  }

  onSearchKey(e) {
    const items = $$$("li", this.suggestList);
    if (this.suggestList.classList.contains("hidden")) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.keyboardIdx = (this.keyboardIdx + 1) % items.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.keyboardIdx = (this.keyboardIdx - 1 + items.length) % items.length;
    } else if (e.key === "Enter") {
      e.preventDefault();
      (this.keyboardIdx >= 0 ? items[this.keyboardIdx] : items[0])?.click();
    } else if (e.key === "Escape") {
      this.hideSuggestions();
      return;
    }
    items.forEach((el, i) =>
      el.classList.toggle("bg-indigo-700/30", i === this.keyboardIdx));
  }

  clearHighlights() {
    this.currentHits.forEach(li => li.querySelector(":scope > div")
      ?.classList.remove("bg-indigo-600/20"));
    this.currentHits = [];
    this.currentHitIdx = -1;
    this.updateMatchHud();
  }
  updateMatchHud() {
    const hud = $$("#match-index");
    if (!hud) return;
    if (this.currentHits.length) {
      hud.textContent = `${this.currentHitIdx + 1}/${this.currentHits.length}`;
      hud.classList.remove("hidden");
    } else hud.classList.add("hidden");
    const prev = $$("#prev-match"), next = $$("#next-match");
    if (prev) prev.disabled = next.disabled = !this.currentHits.length;
  }
  jumpHit(d) {
    if (!this.currentHits.length) return;
    this.currentHitIdx = (this.currentHitIdx + d + this.currentHits.length) % this.currentHits.length;
    this.currentHits[this.currentHitIdx]
      .scrollIntoView({ behavior: "smooth", block: "center" });
    this.updateMatchHud();
  }

  findLiByPath(path) {
    const labels = path.split(" → ");
    let container = this.outline;
    let li = null;
    for (const lbl of labels) {
      li = $$$("li", container).find(l =>
        l.querySelector(":scope > div > span")?.textContent.trim() === lbl);
      if (!li) return null;
      container = li.querySelector(":scope > ul");
    }
    return li;
  }
  expandToNode(li) {
    let cur = li.parentElement.closest("li");
    while (cur) {
      const ul = cur.querySelector(":scope > ul");
      if (ul?.hidden) cur.querySelector(":scope > div")?.click();
      cur = cur.parentElement.closest("li");
    }
  }

  /* ------------------------------------------------------ *
   *  Context-menu & Export
   * ------------------------------------------------------ */
  onContextMenu(e) {
    e.preventDefault();
    const li = e.target.closest("li"); if (!li) return;
    const menu = $$("#node-context-menu"); if (!menu) return;

    menu.innerHTML = `
      <button data-action="expand"   class="w-full text-left px-4 py-2 hover:bg-dark-600">Expand children</button>
      <button data-action="collapse" class="w-full text-left px-4 py-2 hover:bg-dark-600">Collapse children</button>
      <div class="border-t border-slate-700 my-1"></div>
      <button data-action="export-png" class="w-full text-left px-4 py-2 hover:bg-dark-600">Export PNG</button>
      <button data-action="export-pdf" class="w-full text-left px-4 py-2 hover:bg-dark-600">Export PDF</button>
    `;
    menu.style.top  = `${e.clientY}px`;
    menu.style.left = `${e.clientX}px`;
    menu.classList.remove("hidden");

    const onClick = evt => {
      const action = evt.target.dataset.action;
      if (!action) return;
      evt.stopPropagation();
      menu.classList.add("hidden");
      menu.removeEventListener("click", onClick);

      if (action === "expand")       this.expandAll(li);
      else if (action === "collapse") this.collapseAll(li);
      else this.exportSubtree(li, action.endsWith("png") ? "png" : "pdf");
    };
    menu.addEventListener("click", onClick);
  }
  hideContextMenu() { $$("#node-context-menu")?.classList.add("hidden"); }

  expandAll(li) {
    $$$("ul", li).forEach(u => u.hidden = false);
    $$$("div > i.fa-chevron-right", li)
      .forEach(i => i.classList.replace("fa-chevron-right", "fa-chevron-down"));
  }
  collapseAll(li) {
    $$$("ul", li).forEach(u => u.hidden = true);
    $$$("div > i.fa-chevron-down", li)
      .forEach(i => i.classList.replace("fa-chevron-down", "fa-chevron-right"));
  }

  async exportSubtree(li, fmt = "png") {
    const { default: html2canvas } = await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm");
    const canvas = await html2canvas(li, { scale: fmt === "pdf" ? 2 : 1 });

    if (fmt === "png") {
      const a = create("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `subtree-${Date.now()}.png`;
      a.click();
      toast("PNG downloaded 🖼️");
    } else {
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = await import("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.es.min.js");
      const pdf = new jsPDF({ orientation: "p", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`subtree-${Date.now()}.pdf`);
      toast("PDF downloaded 📄");
    }
  }
}

/* ------------------------------------------------------------------
 * Bootstrap – single entry-point (safe in all browsers)
 * -----------------------------------------------------------------*/
const startHierarchyViewer = () => {
  if (window.__hierarchyViewer) return; // guard against double-boot
  try {
    const hv = new HierarchyViewer();
    window.__hierarchyViewer = hv;     // expose for debugging
    console.info("%cHierarchyViewer ready ✔︎", "color:#7c3aed");
  } catch (err) {
    console.error("[HierarchyViewer] init failed:", err);
    window.showToast?.("Hierarchy failed to load", "danger");
  }
};

if (document.readyState === "complete" || document.readyState === "interactive") {
  startHierarchyViewer();
} else {
  document.addEventListener("DOMContentLoaded", startHierarchyViewer, { once: true });
}