"use strict";
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
  PROFILE_UPDATED_EVENT,
} from "./profile.js";

/* --------------------------------------------------------------------- *
 * Utility helpers
 * -------------------------------------------------------------------- */
const $$ = (sel, ctx = document) => ctx.querySelector(sel);
const $$$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const create = (tag, cls = "") => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
};
const debounce = (fn, d = 250) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, a), d);
  };
};

/* lightweight, collision-free toast using a fresh <sl-alert> each time */
const toast = (msg, type = "info") => {
  const { toastDuration = 3000 } = loadProfile?.() || {};

  // Prefer Shoelace if it’s loaded; otherwise fall back to a custom div.
  if (window.customElements?.get("sl-alert")) {
    const alert = Object.assign(document.createElement("sl-alert"), {
      variant: type,
      duration: toastDuration,
      closable: true,
      innerHTML: `<sl-icon slot="icon" name="info-circle"></sl-icon>${msg}`,
    });
    document.body.append(alert);
    alert.toast();
  } else {
    const cls = type === "danger" ? "error" : type;
    const toast = create("div", `toast ${cls}`);
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    const icon = create("span", "toast-icon");
    icon.innerHTML =
      cls === "success"
        ? '<i class="fas fa-check-circle"></i>'
        : cls === "error"
        ? '<i class="fas fa-exclamation-circle"></i>'
        : '<i class="fas fa-info-circle"></i>';

    const content = create("div", "toast-content");
    const title = create("div", "toast-title");
    title.textContent =
      cls === "success" ? "Success" : cls === "error" ? "Error" : "Notice";
    const message = create("div", "toast-message");
    message.textContent = msg;
    content.append(title, message);

    const close = create("button", "toast-close");
    close.setAttribute("aria-label", "Dismiss");
    close.innerHTML = '<i class="fas fa-times"></i>';
    close.addEventListener("click", () => toast.remove());

    toast.append(icon, content, close);
    document.body.append(toast);

    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("opacity-0");
    }, toastDuration + 200);
    setTimeout(() => toast.remove(), toastDuration + 600);
  }
};

const spinner = {
  show() {
    $$("#spinner")?.classList.remove("hidden");
  },
  hide() {
    $$("#spinner")?.classList.add("hidden");
  },
};

function ensureQuantumStyles() {
  if (document.getElementById("hierarchy-viewer-styles")) return;
  const style = document.createElement("style");
  style.id = "hierarchy-viewer-styles";
  style.textContent = `
/* --- UI polish additions --- */
.tree-node{transition:background .15s ease,box-shadow .15s ease;border-radius:.5rem;}
.tree-node:hover{background:rgba(255,255,255,.06);box-shadow:0 1px 0 rgba(255,255,255,.06) inset;}
.tree-node:focus{outline:none;box-shadow:0 0 0 2px rgba(99,102,241,.45);}
.tree-node.selected{background:rgba(99,102,241,.18);box-shadow:0 0 0 1px rgba(99,102,241,.35) inset;}
.tree-toggle{transition:transform .18s ease;opacity:.85;display:inline-block;}
.tree-toggle.rotated{transform:rotate(90deg);}
.node-subtitle{font-size:.75rem;opacity:.7;}
.badge{display:inline-flex;gap:.35rem;align-items:center;padding:.15rem .5rem;border-radius:999px;border:1px solid var(--q-border);background:rgba(255,255,255,.04);font-size:.7rem;}
.table-striped tbody tr:nth-child(even){background:rgba(255,255,255,.03);}
.table-striped tbody tr:hover{background:rgba(255,255,255,.06);}
.toast.info{border-left:3px solid #3b82f6;}
.toast.success{border-left:3px solid #10b981;}
.toast.error{border-left:3px solid #ef4444;}
.toast{position:fixed;bottom:1.5rem;right:1.5rem;z-index:50;background:#1f2937;color:#fff;padding:.5rem .75rem;border-radius:.375rem;box-shadow:0 2px 6px rgba(0,0,0,.2);display:flex;align-items:center;gap:.5rem;opacity:1;transition:opacity .3s,transform .3s;}
.toast.show{transform:translateY(0);}
.toast-icon i{opacity:.85;}
.toast-close{background:none;border:0;color:inherit;cursor:pointer;}
`;
  document.head.appendChild(style);
}

ensureQuantumStyles();

/* --------------------------------------------------------------------- *
 * HierarchyViewer  –  main class
 * -------------------------------------------------------------------- */
export class HierarchyViewer {
  /** @typedef {Object} ViewerOptions */
  constructor(opts = {}) {
    this.opts = Object.assign(
      {
        dataUrl: "/static/js/sample_data/example.json",
        outlineSel: "#diagram-outline",
        searchInputSel: "#hierarchy-search",
        searchSuggestionSel: "#search-suggestions",
        maxSuggestions: 8,
      },
      opts,
    );

    /* API mode detected via query-params or body data-attrs */
    const qs = new URLSearchParams(location.search);
    this.apiRoot =
      qs.get("root_name") || document.body.getAttribute("data-root-name");
    this.apiDiagram =
      qs.get("diagramName") ||
      qs.get("diagram_name") ||
      document.body.getAttribute("data-diagram-name");

    /* State */
    this.rawData = [];
    this.fuse = null;
    this.keyboardIdx = -1;
    this.filteredData = null;
    this.currentHits = [];
    this.currentHitIdx = -1;

    /* DOM refs */
    this.outline = $$(this.opts.outlineSel);
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
  }

  /* Convert flat rule array (with ParentGUID & Actions) to nested tree */
  /* ------------------------------------------------------------------
   *  Convert flat rule list into a *cycle-safe* nested graph.
   *  – Guarantees no duplicate child insertion
   *  – Breaks potential loops (visited-set)
   * ----------------------------------------------------------------- */
  buildHierarchyGraph(rules) {
    const map = Object.create(null); // GUID → node
    const roots = [];

    /* prime map with shallow copies so we can safely mutate .children */
    rules.forEach((r) => (map[r.RuleGUID] = { ...r, children: [] }));

    /* regular parent → child links */
    rules.forEach((r) => {
      if (r.ParentGUID && map[r.ParentGUID]) {
        map[r.ParentGUID].children.push(map[r.RuleGUID]);
      } else if (
        !r.ParentGUID ||
        r.ParentGUID === "" ||
        r.ParentGUID === "00000000-0000-0000-0000-000000000000"
      ) {
        roots.push(map[r.RuleGUID]);
      }
    });

    /* one-time walk to attach Action.ChildRules without duplicates / loops */
    const visited = new Set();

    const attachActionChildren = (node) => {
      if (!node || visited.has(node.RuleGUID)) return;
      visited.add(node.RuleGUID);

      if (Array.isArray(node.Actions)) {
        node.Actions.forEach((action) => {
          if (Array.isArray(action.ChildRules)) {
            action.ChildRules.forEach((cr) => {
              const target =
                map[cr.RuleGUID] ??
                (map[cr.RuleGUID] = { ...cr, children: [] });
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
      const p = [
        ...path,
        node.label ?? node.RuleName ?? node.name ?? "Unnamed",
      ];
      flat.push({ ...node, _path: p.join(" → ") });
      (node.children || []).forEach((c) => dfs(c, p));
    };
    this.rawData.forEach((n) => dfs(n));

    this.fuse = new Fuse(flat, {
      keys: [
        "label",
        "RuleName",
        "name",
        "_path",
        "FunctionName",
        "RuleGUID",
        "Container",
      ],
      includeScore: true,
      threshold: 0.35,
    });
  }

  /* ------------------------------------------------------ *
   *  Rendering
   * ------------------------------------------------------ */
  renderTree(data = null) {
    this.outline.innerHTML = "";
    this.currentHits = [];
    this.currentHitIdx = -1;

    const dataset = data || this.rawData;
    const ulRoot = create("ul", "list-none space-y-1");
    this.outline.appendChild(ulRoot);
    dataset.forEach((n) => ulRoot.appendChild(this.renderNode(n, 0)));
    const cnt = $$("#node-count");
    if (cnt) {
      const total = this.countNodes(dataset);
      cnt.textContent = `${total} node${total === 1 ? "" : "s"}`;
    }
  }

  renderNode(node, depth) {
    const li = create("li");
    const wrap = create("div", "tree-node");
    wrap.setAttribute("tabindex", "0");
    wrap.setAttribute("role", "treeitem");
    wrap.style.setProperty("--tree-level", depth);
    wrap.dataset.nodeId = node.RuleGUID ?? node.id ?? crypto.randomUUID();

    const title = node.label ?? node.RuleName ?? node.name ?? "<em>Unnamed</em>";
    const subtitle = node.RuleGUID
      ? `<div class="node-subtitle">${node.RuleGUID}</div>`
      : "";
    wrap.innerHTML = `
      <i class="fas fa-${
        node.Actions ? "bolt" : node.children?.length ? "folder" : "file-alt"
      } text-slate-400 w-4"></i>
      <div class="flex-1 min-w-0">
        <span class="block truncate">${title}</span>
        ${subtitle}
      </div>
      ${
        node.children?.length
          ? '<i class="tree-toggle fas fa-chevron-right text-xs rotated"></i>'
          : ""
      }
    `;
    wrap.addEventListener("click", (e) => this.onNodeClick(e, node, li));
    wrap.addEventListener("keydown", (e) => this.onNodeKeydown(e, node, li));
    li.appendChild(wrap);

    if (node.children?.length) {
      const ul = create("ul", "space-y-1");
      node.children.forEach((c) => ul.appendChild(this.renderNode(c, depth + 1)));
      li.appendChild(ul);
    }
    return li;
  }

  countNodes(nodes) {
    return nodes.reduce(
      (sum, n) => sum + 1 + (n.children ? this.countNodes(n.children) : 0),
      0,
    );
  }

  onNodeClick(e, node, li) {
    e.stopPropagation();
    const ul = li.querySelector(":scope > ul");
    if (ul) {
      ul.hidden = !ul.hidden;
      const ic = li.querySelector(":scope > .tree-node > .tree-toggle");
      ic?.classList.toggle("rotated", !ul.hidden);
    }
    this.selectNode(li);
    toast(this.getNodePath(li).join(" → "));
    updateProfile({ lastVisitedNodeId: node.RuleGUID ?? node.id });
  }

  onNodeKeydown(e, node, li) {
    const ul = li.querySelector(":scope > ul");
    if (e.key === "Enter") {
      this.onNodeClick(e, node, li);
    } else if (e.key === "ArrowRight" && ul && ul.hidden) {
      ul.hidden = false;
      const ic = li.querySelector(":scope > .tree-node > .tree-toggle");
      ic?.classList.add("rotated");
    } else if (e.key === "ArrowLeft" && ul && !ul.hidden) {
      ul.hidden = true;
      const ic = li.querySelector(":scope > .tree-node > .tree-toggle");
      ic?.classList.remove("rotated");
    }
  }

  selectNode(li) {
    this.outline
      .querySelectorAll(".tree-node.selected")
      .forEach((el) => el.classList.remove("selected"));
    li.querySelector(":scope > .tree-node")?.classList.add("selected");
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
    $$("#attributes table")?.classList.add("table-striped");
    const escape = (s) =>
      String(s ?? "").replace(
        /[&<>'"]/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
    const setHTML = (sel, html) => {
      const el = $$(sel);
      if (el) {
        el.innerHTML = html;
      }
    };

    /* ATTRIBUTES */
    const attribRows = Object.entries(node)
      .filter(([k]) => !["children", "Actions"].includes(k))
      .map(
        ([k, v]) =>
          `<tr><td class="px-4 py-1">${escape(k)}</td><td class="px-4 py-1">${escape(v)}</td></tr>`,
      )
      .join("");
    setHTML(
      "#attributes-table-body",
      attribRows ||
        `<tr><td colspan="2" class="px-4 py-2 text-slate-500">—</td></tr>`,
    );

    /* ACTIONS */
    const actions = Array.isArray(node.Actions) ? node.Actions : [];
    const actionRows = actions
      .map(
        (a) =>
          `<tr><td class="px-4 py-1">${escape(a.ActionName || a.name)}</td><td class="px-4 py-1">${escape(JSON.stringify(a.Details || a, null, 0))}</td></tr>`,
      )
      .join("");
    setHTML(
      "#actions-table-body",
      actionRows ||
        `<tr><td colspan="2" class="px-4 py-2 text-slate-500">—</td></tr>`,
    );

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
      ...(node.children || []).map((c) => ["Child", c.RuleGUID]),
    ];
    const relRows = relations
      .map(
        ([type, id]) =>
          `<tr><td class="px-4 py-1">${type}</td><td class="px-4 py-1">${id}</td></tr>`,
      )
      .join("");
    setHTML(
      "#relations-table-body",
      relRows ||
        `<tr><td colspan="2" class="px-4 py-2 text-slate-500">—</td></tr>`,
    );
  }
  /* ----------------------------------------------------------------- *
   *  Event wiring
   * ----------------------------------------------------------------- */
  bindEvents() {
    /* search box */
    this.searchInput.addEventListener(
      "input",
      debounce(() => this.onSearchInput(), 200),
    );
    this.searchInput.addEventListener("keydown", (e) => this.onSearchKey(e));

    /* click outside suggestions */
    document.addEventListener("click", (e) => {
      if (!this.suggestList.contains(e.target) && e.target !== this.searchInput)
        this.hideSuggestions();
    });

    /* keyboard '/' or Ctrl+F focus */
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        this.searchInput.focus();
      }
    });

    /* quick-filter chips */
    $$$(".btn[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const rule = JSON.parse(btn.dataset.filter);
        this.applyQuickFilter(rule);
        $$$("[data-filter].btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
    $$("#filter-reset")?.addEventListener("click", () => {
      this.filteredData = null;
      this.guidMap = Object.create(null); // fast lookup for details panel
      this.renderTree();
      $$$("[data-filter].btn").forEach((b) => b.classList.remove("active"));
    });

    /* prev / next / clear */
    $$("#prev-match")?.addEventListener("click", () => this.jumpHit(-1));
    $$("#next-match")?.addEventListener("click", () => this.jumpHit(1));
    $$("#clear-search")?.addEventListener("click", () => {
      this.searchInput.value = "";
      this.hideSuggestions();
      this.clearHighlights();
    });

    /* tabbed panel */
    $$$("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const t = btn.dataset.tab;
        $$$("[role='tabpanel']").forEach((p) => p.classList.add("hidden"));
        $$$("[data-tab]").forEach((b) =>
          b.setAttribute("aria-selected", "false"),
        );
        $$(`#${t}-tab`)?.classList.remove("hidden");
        btn.setAttribute("aria-selected", "true");
      });
    });

    /* copy buttons */
    const copy = (txt) =>
      navigator.clipboard.writeText(txt).then(() => toast("Copied 📋"));
    $$("#copy-attributes")?.addEventListener("click", () =>
      copy($$("#attributes-tab")?.innerText || ""),
    );
    $$("#copy-actions")?.addEventListener("click", () =>
      copy($$("#actions-tab")?.innerText || ""),
    );
    $$("#copy-json")?.addEventListener("click", () =>
      copy($$("#raw-json-block")?.innerText || ""),
    );
    $$("#copy-relations")?.addEventListener("click", () =>
      copy($$("#relations-tab")?.innerText || ""),
    );

    /* mobile sidebar */
    const mobBtn = $$("#mobile-search-toggle");
    mobBtn?.addEventListener("click", () => {
      const side = $$("#search-sidebar");
      const hidden = side?.classList.toggle("hidden");
      mobBtn.setAttribute("aria-expanded", (!hidden).toString());
    });

    /* export modal */
    $$("#export-btn")?.addEventListener("click", () =>
      $$("#export-modal")?.classList.remove("hidden"),
    );
    $$("#close-export-modal")?.addEventListener("click", () =>
      $$("#export-modal")?.classList.add("hidden"),
    );

    /* context-menu + theme updates */
    this.outline.addEventListener("contextmenu", (e) => this.onContextMenu(e));
    document.addEventListener("click", () => this.hideContextMenu());

    window.addEventListener(PROFILE_UPDATED_EVENT, () =>
      document.documentElement.setAttribute("data-theme", getEffectiveTheme()),
    );
    document.documentElement.setAttribute("data-theme", getEffectiveTheme());
  }

  /* ------------------------------------------------------ *
   *  Quick-filter helper
   * ------------------------------------------------------ */
  applyQuickFilter(rule) {
    const matches = (node) => {
      if (rule.nodeType && (rule.nodeType === "action") !== !!node.Actions)
        return false;
      if (rule.level && (node._depth ?? 0) < +rule.level) return false;
      if (rule.attribute && !node[rule.attribute]) return false;
      return true;
    };
    const walk = (nodes, d = 0) =>
      nodes
        .map((n) => ({
          ...n,
          _depth: d,
          children: n.children ? walk(n.children, d + 1) : [],
        }))
        .filter(matches);
    this.filteredData = walk(this.rawData);
    this.renderTree(this.filteredData);
  }

  /* ------------------------------------------------------ *
   *  Search handling
   * ------------------------------------------------------ */
  onSearchInput() {
    const q = this.searchInput.value.trim();
    if (q.length < 2) {
      this.hideSuggestions();
      this.clearHighlights();
      return;
    }

    const hits = this.fuse
      .search(q, { limit: this.opts.maxSuggestions })
      .map((r) => r.item);
    this.renderSuggestions(hits);

    /* highlight nodes */
    this.clearHighlights();
    this.currentHits = $$$("span", this.outline)
      .filter((s) => s.textContent.toLowerCase().includes(q.toLowerCase()))
      .map((s) => s.closest("li"));
    this.currentHits.forEach((li) =>
      li.querySelector(":scope > div")?.classList.add("bg-indigo-600/20"),
    );
    if (this.currentHits.length) {
      this.currentHitIdx = 0;
      this.currentHits[0].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    this.updateMatchHud();
  }

  renderSuggestions(items) {
    this.suggestList.innerHTML = "";
    if (!items.length) return this.hideSuggestions();

    items.forEach((it, i) => {
      const li = create(
        "li",
        "px-3 py-1 hover:bg-indigo-700/30 cursor-pointer",
      );
      li.dataset.idx = i;
      li.textContent = it._path;
      li.addEventListener("click", () => this.selectSuggestion(it));
      this.suggestList.appendChild(li);
    });
    this.keyboardIdx = -1;
    this.suggestList.classList.remove("hidden");
  }
  hideSuggestions() {
    this.suggestList.classList.add("hidden");
    this.keyboardIdx = -1;
  }

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
      el.classList.toggle("bg-indigo-700/30", i === this.keyboardIdx),
    );
  }

  clearHighlights() {
    this.currentHits.forEach((li) =>
      li.querySelector(":scope > div")?.classList.remove("bg-indigo-600/20"),
    );
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
    const prev = $$("#prev-match"),
      next = $$("#next-match");
    if (prev) prev.disabled = next.disabled = !this.currentHits.length;
  }
  jumpHit(d) {
    if (!this.currentHits.length) return;
    this.currentHitIdx =
      (this.currentHitIdx + d + this.currentHits.length) %
      this.currentHits.length;
    this.currentHits[this.currentHitIdx].scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    this.updateMatchHud();
  }

  findLiByPath(path) {
    const labels = path.split(" → ");
    let container = this.outline;
    let li = null;
    for (const lbl of labels) {
      li = $$$("li", container).find(
        (l) =>
          l.querySelector(":scope > div > span")?.textContent.trim() === lbl,
      );
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
    const li = e.target.closest("li");
    if (!li) return;
    const menu = $$("#node-context-menu");
    if (!menu) return;

    menu.innerHTML = `
      <button data-action="expand"   class="w-full text-left px-4 py-2 hover:bg-dark-600">Expand children</button>
      <button data-action="collapse" class="w-full text-left px-4 py-2 hover:bg-dark-600">Collapse children</button>
      <div class="border-t border-slate-700 my-1"></div>
      <button data-action="export-png" class="w-full text-left px-4 py-2 hover:bg-dark-600">Export PNG</button>
      <button data-action="export-pdf" class="w-full text-left px-4 py-2 hover:bg-dark-600">Export PDF</button>
    `;
    menu.style.top = `${e.clientY}px`;
    menu.style.left = `${e.clientX}px`;
    menu.classList.remove("hidden");

    const onClick = (evt) => {
      const action = evt.target.dataset.action;
      if (!action) return;
      evt.stopPropagation();
      menu.classList.add("hidden");
      menu.removeEventListener("click", onClick);

      if (action === "expand") this.expandAll(li);
      else if (action === "collapse") this.collapseAll(li);
      else this.exportSubtree(li, action.endsWith("png") ? "png" : "pdf");
    };
    menu.addEventListener("click", onClick);
  }
  hideContextMenu() {
    $$("#node-context-menu")?.classList.add("hidden");
  }

  expandAll(li) {
    $$$("ul", li).forEach((u) => (u.hidden = false));
    $$$("div > i.fa-chevron-right", li).forEach((i) =>
      i.classList.replace("fa-chevron-right", "fa-chevron-down"),
    );
  }
  collapseAll(li) {
    $$$("ul", li).forEach((u) => (u.hidden = true));
    $$$("div > i.fa-chevron-down", li).forEach((i) =>
      i.classList.replace("fa-chevron-down", "fa-chevron-right"),
    );
  }

  async exportSubtree(li, fmt = "png") {
    const { default: html2canvas } = await import(
      "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm"
    );
    const canvas = await html2canvas(li, { scale: fmt === "pdf" ? 2 : 1 });

    if (fmt === "png") {
      const a = create("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `subtree-${Date.now()}.png`;
      a.click();
      toast("PNG downloaded 🖼️");
    } else {
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = await import(
        "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.es.min.js"
      );
      const pdf = new jsPDF({
        orientation: "p",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
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
    window.__hierarchyViewer = hv; // expose for debugging
    console.info("%cHierarchyViewer ready ✔︎", "color:#7c3aed");
  } catch (err) {
    console.error("[HierarchyViewer] init failed:", err);
    window.showToast?.("Hierarchy failed to load", "danger");
  }
};

if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  startHierarchyViewer();
} else {
  document.addEventListener("DOMContentLoaded", startHierarchyViewer, {
    once: true,
  });
}
