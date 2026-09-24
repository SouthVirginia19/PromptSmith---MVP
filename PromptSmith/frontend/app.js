const API = "/api";

const CATEGORY_ICONS = {
  general: "📝",
  coding: "💻",
  writing: "✍️",
  learning: "🎓",
  database: "🗄️",
  ai: "🤖",
  design: "🎨",
  research: "🔬",
  business: "💼",
  fun: "🎉",
};

const state = {
  prompts: [],
  allPrompts: [],
  tags: [],
  categories: [],
  stats: {},
  filters: { q: "", tag: null, category: null, favorite: null },
  sort: "recent",
  view: "grid",
  editing: null,
  using: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function extractVariables(content) {
  const matches = [...content.matchAll(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

function fillVariables(content, values) {
  return content.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, name) =>
    Object.prototype.hasOwnProperty.call(values, name) && values[name] !== ""
      ? values[name]
      : `{${name}}`
  );
}

function categoryIcon(cat) {
  return CATEGORY_ICONS[(cat || "").toLowerCase()] || "📁";
}

function snippet(content, lines = 4) {
  const cleaned = content.trim().split("\n").slice(0, lines).join("\n");
  return cleaned.length > 200 ? cleaned.slice(0, 200) + "…" : cleaned;
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function loadAll() {
  const params = new URLSearchParams();
  if (state.filters.q) params.set("q", state.filters.q);
  if (state.filters.tag) params.set("tag", state.filters.tag);
  if (state.filters.category) params.set("category", state.filters.category);
  if (state.filters.favorite !== null) params.set("favorite", state.filters.favorite);

  const [prompts, tags, categories, stats, allPrompts] = await Promise.all([
    api(`/prompts?${params}`),
    api("/meta/tags"),
    api("/meta/categories"),
    api("/meta/stats"),
    api("/prompts"),
  ]);

  state.prompts = prompts;
  state.allPrompts = allPrompts;
  state.tags = tags;
  state.categories = categories;
  state.stats = stats;

  render();
}

function applySort(list) {
  const arr = [...list];
  switch (state.sort) {
    case "name":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "created":
      return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    case "favorites":
      return arr.sort((a, b) => (b.favorite - a.favorite) || (new Date(b.updated_at) - new Date(a.updated_at)));
    case "recent":
    default:
      return arr.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
}

function categoryCounts() {
  const counts = {};
  state.allPrompts.forEach((p) => {
    const c = p.category || "general";
    counts[c] = (counts[c] || 0) + 1;
  });
  return counts;
}

function render() {
  renderHero();
  renderQuickFilters();
  renderCategories();
  renderTags();
  renderContentHead();
  renderGrid();
}

function renderHero() {
  const s = state.stats;
  $("#hero-stats").innerHTML = `
    <div class="hero-stat accent">
      <div class="label">📦 Prompts</div>
      <div class="value">${s.total_prompts ?? 0}</div>
    </div>
    <div class="hero-stat gold">
      <div class="label">★ Favorites</div>
      <div class="value">${s.favorites ?? 0}</div>
    </div>
    <div class="hero-stat green">
      <div class="label">🏷️ Tags</div>
      <div class="value">${s.tags ?? 0}</div>
    </div>
    <div class="hero-stat purple">
      <div class="label">📁 Categories</div>
      <div class="value">${state.categories.length}</div>
    </div>
  `;
}

function renderQuickFilters() {
  const total = state.allPrompts.length;
  const fav = state.allPrompts.filter((p) => p.favorite).length;
  const recent = state.allPrompts.filter((p) => {
    const d = new Date(p.created_at);
    return Date.now() - d.getTime() < 7 * 24 * 3600 * 1000;
  }).length;

  const current = state.filters.favorite === true ? "fav" : "all";

  $("#quick-filters").innerHTML = `
    <li data-quick="all" class="${current === "all" ? "active" : ""}">
      <span class="cat-icon">📚</span> All prompts
      <span class="count-pill">${total}</span>
    </li>
    <li data-quick="fav" class="${current === "fav" ? "active" : ""}">
      <span class="cat-icon">★</span> Favorites
      <span class="count-pill">${fav}</span>
    </li>
    <li data-quick="recent" class="">
      <span class="cat-icon">🆕</span> Added this week
      <span class="count-pill">${recent}</span>
    </li>
  `;
}

function renderCategories() {
  const counts = categoryCounts();
  const items = [`<li data-category="" class="${state.filters.category === null ? "active" : ""}">
      <span class="cat-icon">🌐</span> All categories
      <span class="count-pill">${state.allPrompts.length}</span>
    </li>`];

  state.categories.forEach((c) => {
    const active = state.filters.category === c;
    items.push(`
      <li data-category="${escapeHtml(c)}" class="${active ? "active" : ""}">
        <span class="cat-icon">${categoryIcon(c)}</span> ${escapeHtml(c)}
        <span class="count-pill">${counts[c] || 0}</span>
      </li>
    `);
  });

  $("#categories").innerHTML = items.join("");
}

function renderTags() {
  $("#tags").innerHTML = state.tags
    .map(
      (t) =>
        `<span class="tag-chip ${state.filters.tag === t ? "active" : ""}" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</span>`
    )
    .join("");
}

function renderContentHead() {
  const f = state.filters;
  let title = "All prompts";
  if (f.favorite === true) title = "★ Favorites";
  if (f.category) title = `${categoryIcon(f.category)} ${f.category}`;
  if (f.tag) title = `#${f.tag}`;
  if (f.q) title = `Search: "${f.q}"`;

  $("#list-title").textContent = title;
  $("#list-count").textContent = state.prompts.length;
}

function renderGrid() {
  const grid = $("#grid");
  grid.classList.toggle("list-view", state.view === "list");

  const sorted = applySort(state.prompts);

  if (!sorted.length) {
    grid.innerHTML = `
      <div class="empty">
        <span class="empty-emoji">🪶</span>
        <h3>No prompts found</h3>
        <p>${state.allPrompts.length ? "Try clearing filters or searching for something else." : "Create your first prompt to get started."}</p>
        <button class="primary" onclick="document.getElementById('btn-new').click()">+ New Prompt</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = sorted.map(renderCard).join("");
}

function renderCard(p) {
  const tags = p.tags.map((t) => `<span class="tag">#${escapeHtml(t.name)}</span>`).join("");
  const vars = extractVariables(p.content);
  const varsBadge = vars.length
    ? `<span class="badge-vars">{${vars.length}} var${vars.length > 1 ? "s" : ""}</span>`
    : "";

  return `
    <article class="card" data-id="${p.id}">
      <header class="card-head">
        <h3>${escapeHtml(p.title)}</h3>
        <button class="star ${p.favorite ? "on" : ""}" data-action="fav" title="Favorite">★</button>
      </header>
      ${p.description ? `<p class="desc">${escapeHtml(p.description)}</p>` : ""}
      <pre class="snippet">${escapeHtml(snippet(p.content))}</pre>
      <div class="card-tags">${tags}${varsBadge}</div>
      <footer class="card-foot">
        <span class="category-pill">${categoryIcon(p.category)} ${escapeHtml(p.category)}</span>
        <div class="actions">
          <button data-action="use" class="use" title="Use prompt">⚡ Use</button>
          <button data-action="quick-copy" title="Copy as-is">📋</button>
          <button data-action="edit" title="Edit">✏️</button>
          <button data-action="delete" class="danger" title="Delete">🗑</button>
        </div>
      </footer>
    </article>
  `;
}

function openModal(id) { $("#" + id).classList.add("open"); }
function closeModal(id) { $("#" + id).classList.remove("open"); }

function openEdit(prompt = null) {
  state.editing = prompt;
  $("#edit-title").textContent = prompt ? "Edit Prompt" : "New Prompt";
  $("#f-title").value = prompt?.title ?? "";
  $("#f-description").value = prompt?.description ?? "";
  $("#f-content").value = prompt?.content ?? "";
  $("#f-category").value = prompt?.category ?? "general";
  $("#f-tags").value = prompt ? prompt.tags.map((t) => t.name).join(", ") : "";

  $("#category-suggestions").innerHTML = state.categories
    .map((c) => `<option value="${escapeHtml(c)}">`)
    .join("");

  openModal("modal-edit");
  setTimeout(() => $("#f-title").focus(), 50);
}

async function savePrompt() {
  const payload = {
    title: $("#f-title").value.trim(),
    description: $("#f-description").value.trim(),
    content: $("#f-content").value,
    category: $("#f-category").value.trim() || "general",
    tags: $("#f-tags").value.split(",").map((s) => s.trim()).filter(Boolean),
  };
  if (!payload.title || !payload.content.trim()) {
    alert("Title and content are required.");
    return;
  }
  try {
    if (state.editing) {
      await api(`/prompts/${state.editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
    } else {
      await api("/prompts", { method: "POST", body: JSON.stringify(payload) });
    }
    closeModal("modal-edit");
    await loadAll();
    flash(state.editing ? "Prompt updated" : "Prompt created");
  } catch (e) {
    alert("Save failed: " + e.message);
  }
}

function openUse(prompt) {
  state.using = prompt;
  $("#use-title").textContent = prompt.title;
  const vars = extractVariables(prompt.content);
  const form = $("#vars-form");
  if (vars.length) {
    form.innerHTML = `
      <p class="hint">Fill in the variables below, then click Copy.</p>
      ${vars.map((v) => `<label>${escapeHtml(v)}<input data-var="${escapeHtml(v)}" placeholder="value for {${escapeHtml(v)}}" /></label>`).join("")}
      <details><summary>Preview template</summary><pre>${escapeHtml(prompt.content)}</pre></details>
    `;
  } else {
    form.innerHTML = `
      <p class="hint">No variables in this prompt. Ready to copy.</p>
      <pre>${escapeHtml(prompt.content)}</pre>
    `;
  }
  openModal("modal-use");
}

function confirmCopy() {
  if (!state.using) return;
  const values = {};
  $$("#vars-form input").forEach((inp) => { values[inp.dataset.var] = inp.value; });
  const filled = fillVariables(state.using.content, values);
  navigator.clipboard.writeText(filled).then(
    () => { closeModal("modal-use"); flash("Copied to clipboard"); },
    () => alert("Copy failed — check browser permissions.")
  );
}

function quickCopy(prompt) {
  navigator.clipboard.writeText(prompt.content).then(
    () => flash("Copied raw prompt"),
    () => alert("Copy failed.")
  );
}

function flash(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(flash._t);
  flash._t = setTimeout(() => el.classList.remove("show"), 1700);
}

function pickRandom() {
  if (!state.allPrompts.length) { flash("No prompts yet"); return; }
  const p = state.allPrompts[Math.floor(Math.random() * state.allPrompts.length)];
  openUse(p);
}

/* ===== EVENTS ===== */
document.addEventListener("click", async (e) => {
  const actionBtn = e.target.closest("[data-action]");
  const card = e.target.closest(".card");
  if (actionBtn && card) {
    const id = Number(card.dataset.id);
    const prompt = state.prompts.find((p) => p.id === id) || state.allPrompts.find((p) => p.id === id);
    if (!prompt) return;
    const action = actionBtn.dataset.action;

    if (action === "use") openUse(prompt);
    if (action === "quick-copy") quickCopy(prompt);
    if (action === "edit") openEdit(prompt);
    if (action === "delete") {
      if (confirm(`Delete "${prompt.title}"?`)) {
        try {
          await api(`/prompts/${id}`, { method: "DELETE" });
          await loadAll();
          flash("Deleted");
        } catch (err) { alert("Delete failed: " + err.message); }
      }
    }
    if (action === "fav") {
      try {
        await api(`/prompts/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ favorite: !prompt.favorite }),
        });
        await loadAll();
      } catch (err) { alert("Update failed: " + err.message); }
    }
    return;
  }

  const quickLi = e.target.closest("#quick-filters li");
  if (quickLi) {
    const q = quickLi.dataset.quick;
    state.filters.favorite = q === "fav" ? true : null;
    state.filters.category = null;
    state.filters.tag = null;
    if (q === "recent") {
      state.filters.favorite = null;
      state.sort = "created";
      $("#sort").value = "created";
    }
    await loadAll();
    return;
  }

  const catLi = e.target.closest("#categories li");
  if (catLi) {
    state.filters.category = catLi.dataset.category || null;
    state.filters.favorite = null;
    await loadAll();
    return;
  }

  const tagChip = e.target.closest(".tag-chip");
  if (tagChip) {
    const next = tagChip.dataset.tag;
    state.filters.tag = state.filters.tag === next ? null : next;
    await loadAll();
    return;
  }

  const viewBtn = e.target.closest(".view-toggle button");
  if (viewBtn) {
    state.view = viewBtn.dataset.view;
    $$(".view-toggle button").forEach((b) => b.classList.toggle("active", b === viewBtn));
    renderGrid();
    return;
  }

  if (e.target.classList.contains("modal-close") || e.target.classList.contains("modal-backdrop")) {
    const modal = e.target.closest(".modal-backdrop");
    if (modal) modal.classList.remove("open");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $$(".modal-backdrop.open").forEach((m) => m.classList.remove("open"));
  }
  if (e.target.matches("input, textarea, select")) return;
  if (e.key === "n") { e.preventDefault(); openEdit(null); }
  if (e.key === "r") { e.preventDefault(); pickRandom(); }
  if (e.key === "/") { e.preventDefault(); $("#search").focus(); }
});

$("#btn-new").addEventListener("click", () => openEdit(null));
$("#btn-save").addEventListener("click", savePrompt);
$("#btn-copy").addEventListener("click", confirmCopy);
$("#btn-random").addEventListener("click", pickRandom);
$("#btn-export").addEventListener("click", () => {
  window.location.href = "/api/export";
});

$("#btn-import").addEventListener("click", () => {
  $("#file-import").click();
});

$("#file-import").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Not a valid JSON file");
    }
    const res = await api("/import", { method: "POST", body: JSON.stringify(data) });
    await loadAll();
    const parts = [`✅ ${res.created} imported`];
    if (res.skipped) parts.push(`⏭ ${res.skipped} skipped (duplicates)`);
    if (res.errors.length) parts.push(`⚠ ${res.errors.length} errors`);
    flash(parts.join("  •  "));
  } catch (err) {
    alert("Import failed: " + err.message);
  } finally {
    e.target.value = "";
  }
});

$("#sort").addEventListener("change", (e) => {
  state.sort = e.target.value;
  renderGrid();
});

let searchTimer;
$("#search").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    state.filters.q = e.target.value.trim();
    await loadAll();
  }, 250);
});

/* ===== TABS ===== */
function switchTab(tab) {
  document.body.dataset.tab = tab;
  document.querySelectorAll(".main-tabs button").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  document.querySelectorAll("[data-view]").forEach((v) => {
    v.classList.toggle("hidden", v.dataset.view !== tab);
  });
  if (tab === "about") loadProfile();
}

document.querySelectorAll(".main-tabs button").forEach((b) => {
  b.addEventListener("click", () => switchTab(b.dataset.tab));
});

/* ===== PROFILE ===== */
const LANG_COLORS = {
  Python: "#3776ab",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Rust: "#dea584",
  PHP: "#4F5D95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SQL: "#e38c00",
  Shell: "#89e051",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Vue: "#41b883",
  Lua: "#000080",
};

const DEFAULT_LANG_COLOR = "#8b949e";
let profileLoaded = false;

async function loadProfile(force = false) {
  if (profileLoaded && !force) return;
  try {
    const data = await api("/profile");
    renderProfile(data);
    profileLoaded = true;
  } catch (e) {
    $("#prof-name").textContent = "Failed to load profile";
    $("#prof-bio").textContent = e.message;
  }
}

function renderProfile(data) {
  const u = data.user;
  const s = data.stats;

  $("#prof-avatar").src = u.avatar_url;
  $("#prof-name").textContent = u.name || u.login;

  const handle = $("#prof-handle");
  handle.textContent = "@" + u.login;
  handle.href = u.html_url;

  $("#prof-bio").textContent = u.bio || "No bio yet.";

  const metaParts = [];
  if (u.location) metaParts.push(`<span>📍 ${escapeHtml(u.location)}</span>`);
  if (u.company) metaParts.push(`<span>🏢 ${escapeHtml(u.company)}</span>`);
  if (u.blog)
    metaParts.push(
      `<span>🔗 <a href="${escapeHtml(u.blog)}" target="_blank" rel="noopener" style="color: var(--accent);">${escapeHtml(u.blog.replace(/^https?:\/\//, ""))}</a></span>`
    );
  const joined = new Date(u.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" });
  metaParts.push(`<span>📅 Joined ${joined}</span>`);
  $("#prof-meta").innerHTML = metaParts.join("");

  $("#prof-stats").innerHTML = `
    <div class="hero-stat accent">
      <div class="label">📦 Repositories</div>
      <div class="value">${u.public_repos}</div>
    </div>
    <div class="hero-stat gold">
      <div class="label">★ Total stars</div>
      <div class="value">${s.total_stars}</div>
    </div>
    <div class="hero-stat green">
      <div class="label">👥 Followers</div>
      <div class="value">${u.followers}</div>
    </div>
    <div class="hero-stat purple">
      <div class="label">🛠 Languages</div>
      <div class="value">${Object.keys(s.languages).length}</div>
    </div>
  `;

  const langs = Object.entries(s.languages).slice(0, 6);
  const total = langs.reduce((acc, [, c]) => acc + c, 0) || 1;
  $("#prof-langs").innerHTML = langs
    .map(([name, count]) => {
      const pct = Math.round((count / total) * 100);
      const color = LANG_COLORS[name] || DEFAULT_LANG_COLOR;
      return `
        <div class="lang-row">
          <span class="lang-name"><span class="lang-dot" style="background:${color}"></span>${escapeHtml(name)}</span>
          <div class="lang-bar-track"><div class="lang-bar-fill" style="width:${pct}%; background:${color}"></div></div>
          <span class="lang-percent">${pct}%</span>
        </div>
      `;
    })
    .join("");

  if (!data.top_repos.length) {
    $("#prof-repos").innerHTML = `<p style="color: var(--muted);">No public repositories yet.</p>`;
  } else {
    $("#prof-repos").innerHTML = data.top_repos
      .map(
        (r) => `
        <a class="repo-card" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">
          <div class="repo-name">📦 ${escapeHtml(r.name)}</div>
          <p class="repo-desc">${escapeHtml(r.description || "No description.")}</p>
          <div class="repo-meta">
            <span>⭐ ${r.stars}</span>
            <span>🍴 ${r.forks}</span>
            ${r.language ? `<span>${escapeHtml(r.language)}</span>` : ""}
          </div>
        </a>
      `
      )
      .join("");
  }
}

loadAll().catch((e) => alert("Load failed: " + e.message));