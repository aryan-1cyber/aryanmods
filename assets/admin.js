/* aryanmods — admin panel. Runs entirely in the browser. */

(function () {
  'use strict';

  const SITE = Object.assign({ name: 'aryanmods', brandMark: 'A', footer: '', accent: '#4f8cff', accent2: '#8b5cf6' }, window.SITE || {});
  const FIELD_ORDER = ['id', 'name', 'category', 'version', 'size', 'updated', 'developer', 'requires', 'icon', 'description', 'screenshots', 'releases', 'downloads'];
  const STORE_APPS = 'av-admin-apps';
  const STORE_GH = 'av-gh';

  const HEADER = `/*
 * YOUR APP LIST
 * -------------
 * Managed from admin.html, or edit by hand.
 *
 * Required:  id, name
 * Optional:  category, version, size, updated, icon, description,
 *            developer, requires, screenshots, releases, downloads
 */
`;

  const state = { apps: [], index: null, rows: { downloads: [], releases: [] }, idTouched: false };

  const $ = (id) => document.getElementById(id);
  const val = (id) => {
    const el = $(id);
    return el ? el.value : '';
  };

  const esc = (v) => {
    const map = { '&': '&' + 'amp;', '<': '&' + 'lt;', '>': '&' + 'gt;', '"': '&' + 'quot;', "'": '&' + '#39;' };
    return String(v ?? '').replace(/[&<>"']/g, (c) => map[c]);
  };

  function initials(name) {
    return String(name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function setStatus(el, message, isError) {
    const node = typeof el === 'string' ? $(el) : el;
    if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-error', Boolean(isError));
  }

  /* ----------------------------- branding ------------------------------ */

  function applyBrand() {
    const root = document.documentElement;
    if (SITE.accent) root.style.setProperty('--accent', SITE.accent);
    if (SITE.accent2) root.style.setProperty('--accent-2', SITE.accent2);
    document.querySelectorAll('[data-site-name]').forEach((el) => (el.textContent = SITE.name));
    document.querySelectorAll('[data-site-mark]').forEach((el) => (el.textContent = SITE.brandMark || SITE.name.charAt(0)));
    document.querySelectorAll('[data-site-footer]').forEach((el) => (el.textContent = SITE.footer));
  }

  function initTheme() {
    const root = document.documentElement;
    const btn = $('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem('av-theme', next);
      } catch (e) {}
    });
  }

  /* ------------------------------- drafts ------------------------------ */

  function saveDraft() {
    try {
      localStorage.setItem(STORE_APPS, JSON.stringify(state.apps));
    } catch (e) {}
  }

  function clearDraft() {
    try {
      localStorage.removeItem(STORE_APPS);
    } catch (e) {}
  }

  function restoreDraft() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORE_APPS);
    } catch (e) {}
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return false;
      state.apps = parsed;
      const note = $('draftNote');
      if (note) note.hidden = false;
      return true;
    } catch (e) {
      return false;
    }
  }

  /* -------------------------------- list ------------------------------- */

  function renderList() {
    const ul = $('adminApps');
    ul.innerHTML =
      state.apps
        .map(
          (app, i) => `
        <li>
          <button type="button" class="admin-item${i === state.index ? ' is-active' : ''}" data-i="${i}">
            <span class="icon"><span>${esc(initials(app.name))}</span></span>
            <span class="ai-main">
              <strong>${esc(app.name || 'Untitled')}</strong>
              <small>${esc(app.id || 'no-id')}${app.version ? ' · v' + esc(app.version) : ''}</small>
            </span>
          </button>
        </li>`
        )
        .join('') || '<li><p class="admin-empty-list">No apps yet. Hit “+ New app”.</p></li>';

    $('appCount').textContent = state.apps.length ? String(state.apps.length) : '';

    const cats = [...new Set(state.apps.map((a) => a.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    $('catList').innerHTML = cats.map((c) => `<option value="${esc(c)}"></option>`).join('');
  }

  /* ------------------------------- editor ------------------------------ */

  function showEmptyEditor() {
    $('appForm').hidden = true;
    $('editorEmpty').hidden = false;
    state.index = null;
    renderList();
  }

  function fillFields(app) {
    $('fName').value = app.name || '';
    $('fId').value = app.id || '';
    $('fCategory').value = app.category || '';
    $('fVersion').value = app.version || '';
    $('fSize').value = app.size || '';
    $('fUpdated').value = app.updated || '';
    $('fDeveloper').value = app.developer || '';
    $('fRequires').value = app.requires || '';
    $('fIcon').value = app.icon || '';
    $('fDescription').value = app.description || '';
    $('fScreenshots').value = (app.screenshots || []).join('\n');
  }

  function downloadRow(d, i) {
    return `
      <div class="repeat-row" data-row="download" data-i="${i}">
        <input type="text" data-k="label" placeholder="Label" value="${esc(d.label || '')}">
        <input type="text" data-k="url" placeholder="https://…" value="${esc(d.url || '')}" spellcheck="false">
        <button type="button" class="row-remove" title="Remove">×</button>
      </div>`;
  }

  function releaseRow(r, i) {
    return `
      <div class="repeat-row release-row" data-row="release" data-i="${i}">
        <input type="text" data-k="version" placeholder="1.0.0" value="${esc(r.version || '')}">
        <input type="date" data-k="date" value="${esc(r.date || '')}">
        <textarea data-k="notes" rows="1" placeholder="What changed?">${esc(r.notes || '')}</textarea>
        <button type="button" class="row-remove" title="Remove">×</button>
      </div>`;
  }

  function renderRows() {
    $('downloadsList').innerHTML = state.rows.downloads.map(downloadRow).join('');
    $('releasesList').innerHTML = state.rows.releases.map(releaseRow).join('');
  }

  function collectDownloads() {
    return [...document.querySelectorAll('#downloadsList .repeat-row')]
      .map((row) => ({
        label: row.querySelector('[data-k="label"]').value.trim(),
        url: row.querySelector('[data-k="url"]').value.trim()
      }))
      .filter((d) => d.label || d.url);
  }

  function collectReleases() {
    return [...document.querySelectorAll('#releasesList .repeat-row')]
      .map((row) => ({
        version: row.querySelector('[data-k="version"]').value.trim(),
        date: row.querySelector('[data-k="date"]').value.trim(),
        notes: row.querySelector('[data-k="notes"]').value.trim()
      }))
      .filter((r) => r.version || r.notes);
  }

  function collectForm() {
    const screenshots = val('fScreenshots')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      id: val('fId').trim(),
      name: val('fName').trim(),
      category: val('fCategory').trim(),
      version: val('fVersion').trim(),
      size: val('fSize').trim(),
      updated: val('fUpdated').trim(),
      developer: val('fDeveloper').trim(),
      requires: val('fRequires').trim(),
      icon: val('fIcon').trim(),
      description: val('fDescription').trim(),
      screenshots,
      releases: collectReleases(),
      downloads: collectDownloads()
    };
  }

  function validate(app, index) {
    const errs = [];
    if (!app.name) errs.push('Name is required.');
    if (!app.id) {
      errs.push('ID is required.');
    } else if (!/^[a-z0-9][a-z0-9-]*$/.test(app.id)) {
      errs.push('ID can only contain lowercase letters, numbers and dashes.');
    } else if (state.apps.some((a, i) => i !== index && a.id === app.id)) {
      errs.push(`Another app already uses the ID “${app.id}”.`);
    }
    app.downloads.forEach((d, i) => {
      if (d.url && !/^https?:\/\//i.test(d.url)) errs.push(`Download ${i + 1}: URL must start with http:// or https://`);
      if (d.label && !d.url) errs.push(`Download ${i + 1}: add a URL, or clear the label.`);
    });
    return errs;
  }

  function loadApp(index) {
    if (index == null || !state.apps[index]) return;
    const app = state.apps[index];
    state.index = index;
    state.idTouched = false;
    state.rows = {
      downloads: clone(app.downloads || []),
      releases: clone(app.releases || [])
    };
    fillFields(app);
    renderRows();
    $('appForm').hidden = false;
    $('editorEmpty').hidden = true;
    setStatus('formStatus', '');
    renderList();
  }

  function newApp() {
    state.index = null;
    state.idTouched = false;
    state.rows = { downloads: [{ label: 'Download APK', url: '' }], releases: [] };
    fillFields({ updated: new Date().toISOString().slice(0, 10) });
    renderRows();
    $('appForm').hidden = false;
    $('editorEmpty').hidden = true;
    setStatus('formStatus', 'New app — fill in the details and save.');
    renderList();
    $('fName').focus();
  }

  function wireEditor() {
    $('fName').addEventListener('input', () => {
      if (state.idTouched) return;
      $('fId').value = slugify($('fName').value);
    });

    $('fId').addEventListener('input', () => {
      state.idTouched = true;
    });

    $('addDownload').addEventListener('click', () => {
      state.rows.downloads = collectDownloads();
      state.rows.downloads.push({ label: '', url: '' });
      renderRows();
    });

    $('addRelease').addEventListener('click', () => {
      state.rows.releases = collectReleases();
      state.rows.releases.push({ version: '', date: new Date().toISOString().slice(0, 10), notes: '' });
      renderRows();
    });

    document.addEventListener('click', (e) => {
      const remove = e.target.closest('.row-remove');
      if (!remove) return;
      const row = remove.closest('.repeat-row');
      const kind = row.dataset.row;
      if (kind === 'download') {
        state.rows.downloads = collectDownloads();
        state.rows.downloads.splice(Number(row.dataset.i), 1);
      } else {
        state.rows.releases = collectReleases();
        state.rows.releases.splice(Number(row.dataset.i), 1);
      }
      renderRows();
    });

    $('appForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const app = collectForm();
      const errs = validate(app, state.index);
      if (errs.length) {
        setStatus('formStatus', errs.join(' '), true);
        return;
      }
      const wasNew = state.index == null;
      if (wasNew) {
        state.apps.push(app);
        state.index = state.apps.length - 1;
      } else {
        state.apps[state.index] = app;
      }
      state.rows = { downloads: clone(app.downloads), releases: clone(app.releases) };
      saveDraft();
      renderList();
      setStatus('formStatus', wasNew ? 'Added. Export or publish to go live.' : 'Saved in this browser. Export or publish to go live.');
    });

    $('duplicateBtn').addEventListener('click', () => {
      const app = collectForm();
      const base = app.id || 'app';
      let copyId = `${base}-copy`;
      let n = 2;
      while (state.apps.some((a) => a.id === copyId)) {
        copyId = `${base}-copy-${n}`;
        n += 1;
      }
      const copy = Object.assign({}, app, { id: copyId, name: `${app.name} copy` });
      state.apps.push(copy);
      state.index = state.apps.length - 1;
      saveDraft();
      loadApp(state.index);
      setStatus('formStatus', 'Duplicated.');
    });

    $('deleteBtn').addEventListener('click', () => {
      if (state.index == null) return;
      const app = state.apps[state.index];
      if (!window.confirm(`Delete “${app.name || app.id}”?`)) return;
      state.apps.splice(state.index, 1);
      saveDraft();
      showEmptyEditor();
      setStatus('formStatus', 'Deleted. Export or publish to go live.');
    });

    $('adminApps').addEventListener('click', (e) => {
      const btn = e.target.closest('.admin-item');
      if (!btn) return;
      loadApp(Number(btn.dataset.i));
    });

    $('newBtn').addEventListener('click', newApp);

    $('resetDraft').addEventListener('click', () => {
      clearDraft();
      window.location.reload();
    });
  }

  /* ------------------------------- export ------------------------------ */

  function cleanApp(app) {
    const out = {};
    FIELD_ORDER.forEach((key) => {
      const v = app[key];
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) {
        const arr = v
          .map((item) =>
            typeof item === 'object' && item !== null
              ? Object.keys(item).reduce((acc, k) => {
                  const value = item[k];
                  if (value !== undefined && value !== null && value !== '') acc[k] = value;
                  return acc;
                }, {})
              : String(item).trim()
          )
          .filter((item) => (typeof item === 'string' ? item.length > 0 : Object.keys(item).length > 0));
        if (!arr.length) return;
        out[key] = arr;
      } else {
        out[key] = v;
      }
    });
    return out;
  }

  function serialize(apps) {
    const body = apps
      .map((app) => {
        const json = JSON.stringify(cleanApp(app), null, 2);
        const indented = json
          .split('\n')
          .map((line, i) => (i === 0 ? line : '  ' + line))
          .join('\n');
        return '  ' + indented;
      })
      .join(',\n');
    return `${HEADER}\nwindow.APPS = [\n${body}\n];\n`;
  }

  function fileText() {
    return serialize(state.apps);
  }

  function downloadFile() {
    const blob = new Blob([fileText()], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apps.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('formStatus', 'Downloaded apps.js — drop it into the data/ folder of your site.');
  }

  async function copyFile() {
    const text = fileText();
    try {
      await navigator.clipboard.writeText(text);
      setStatus('formStatus', `Copied ${state.apps.length} apps to the clipboard.`);
    } catch (e) {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      setStatus('formStatus', 'Copied to the clipboard.');
    }
  }

  /* ------------------------------- github ------------------------------ */

  function ghStatus(message, isError) {
    setStatus('ghStatus', message, isError);
  }

  function ghConfig() {
    return {
      owner: val('ghOwner').trim(),
      repo: val('ghRepo').trim(),
      branch: val('ghBranch').trim() || 'main',
      path: val('ghPath').trim() || 'data/apps.js',
      token: val('ghToken').trim(),
      remember: $('ghRemember').checked
    };
  }

  function ghSaveConfig(cfg) {
    try {
      const stored = { owner: cfg.owner, repo: cfg.repo, branch: cfg.branch, path: cfg.path, remember: cfg.remember };
      if (cfg.remember) stored.token = cfg.token;
      localStorage.setItem(STORE_GH, JSON.stringify(stored));
    } catch (e) {}
  }

  function ghLoadConfig() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_GH) || '{}');
      if (stored.owner) $('ghOwner').value = stored.owner;
      if (stored.repo) $('ghRepo').value = stored.repo;
      if (stored.branch) $('ghBranch').value = stored.branch;
      if (stored.path) $('ghPath').value = stored.path;
      if (stored.token) $('ghToken').value = stored.token;
      if (stored.remember) $('ghRemember').checked = true;
    } catch (e) {}
  }

  function ghUrl(cfg) {
    const path = cfg.path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
    return `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${path}`;
  }

  function ghHeaders(cfg) {
    const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
    return headers;
  }

  async function ghError(res) {
    let detail = '';
    try {
      const json = await res.json();
      detail = json.message || '';
    } catch (e) {}
    const map = {
      401: 'Token is invalid or expired.',
      403: 'Token lacks permission. It needs Contents: Read and write on this repo (or the rate limit is hit).',
      404: 'Repo or file not found. Check username, repo name, branch and path.',
      409: 'The file changed on GitHub. Use “Load from repo”, then publish again.',
      422: 'GitHub rejected the request. Check the branch name.'
    };
    return map[res.status] || detail || `GitHub error ${res.status}.`;
  }

  function decodeB64(b64) {
    const bin = atob(String(b64 || '').replace(/\s/g, ''));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeB64(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    bytes.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin);
  }

  async function ghFetchFile(cfg) {
    const res = await fetch(`${ghUrl(cfg)}?ref=${encodeURIComponent(cfg.branch)}`, { headers: ghHeaders(cfg) });
    if (res.status === 404) return { missing: true };
    if (!res.ok) throw new Error(await ghError(res));
    const json = await res.json();
    if (Array.isArray(json)) throw new Error('That path is a folder, not a file.');
    return { text: decodeB64(json.content), sha: json.sha };
  }

  function parseAppsFile(text) {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1 || end < start) throw new Error('No app list found in that file.');
    const slice = text.slice(start, end + 1);
    try {
      return JSON.parse(slice);
    } catch (e) {
      throw new Error('That file uses syntax the admin cannot read. Open it and remove comments or trailing commas inside the array.');
    }
  }

  function ghGuard() {
    const cfg = ghConfig();
    if (!cfg.owner || !cfg.repo) {
      ghStatus('Enter your GitHub username and repository.', true);
      return null;
    }
    if (!cfg.token) {
      ghStatus('Enter an access token.', true);
      return null;
    }
    ghSaveConfig(cfg);
    return cfg;
  }

  async function ghTest() {
    const cfg = ghGuard();
    if (!cfg) return;
    try {
      ghStatus('Connecting…');
      const file = await ghFetchFile(cfg);
      if (file.missing) {
        ghStatus('Connected, but that file does not exist yet. Publishing will create it.', false);
        return;
      }
      const apps = parseAppsFile(file.text);
      ghStatus(`Connected. ${cfg.path} has ${apps.length} app${apps.length === 1 ? '' : 's'}.`);
    } catch (e) {
      ghStatus(e.message, true);
    }
  }

  async function ghLoad() {
    const cfg = ghGuard();
    if (!cfg) return;
    try {
      ghStatus('Loading…');
      const file = await ghFetchFile(cfg);
      if (file.missing) return ghStatus('That file does not exist in the repo yet.', true);
      const apps = parseAppsFile(file.text);
      if (!Array.isArray(apps)) throw new Error('No app list found in that file.');
      state.apps = apps;
      state.rows = { downloads: [], releases: [] };
      saveDraft();
      showEmptyEditor();
      ghStatus(`Loaded ${apps.length} app${apps.length === 1 ? '' : 's'} from GitHub.`);
    } catch (e) {
      ghStatus(e.message, true);
    }
  }

  async function ghPublish() {
    const cfg = ghGuard();
    if (!cfg) return;
    if (!state.apps.length) return ghStatus('Add at least one app before publishing.', true);
    try {
      ghStatus('Publishing…');
      let sha;
      const existing = await ghFetchFile(cfg);
      if (!existing.missing) sha = existing.sha;

      const payload = {
        message: `Update ${cfg.path} from admin`,
        content: encodeB64(fileText()),
        branch: cfg.branch
      };
      if (sha) payload.sha = sha;

      const res = await fetch(ghUrl(cfg), {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, ghHeaders(cfg)),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await ghError(res));

      clearDraft();
      const note = $('draftNote');
      if (note) note.hidden = true;
      ghStatus('Published. Your host rebuilds the site in about a minute.');
    } catch (e) {
      ghStatus(e.message, true);
    }
  }

  /* -------------------------------- boot ------------------------------- */

  applyBrand();
  initTheme();

  state.apps = clone(Array.isArray(window.APPS) ? window.APPS : []);
  const restored = restoreDraft();

  renderList();
  showEmptyEditor();
  wireEditor();
  ghLoadConfig();

  if (restored) setStatus('formStatus', 'Restored unpublished changes from this browser.');

  $('copyBtn').addEventListener('click', copyFile);
  $('downloadBtn').addEventListener('click', downloadFile);
  $('ghTest').addEventListener('click', ghTest);
  $('ghLoad').addEventListener('click', ghLoad);
  $('ghPublish').addEventListener('click', ghPublish);

  document.title = `Admin — ${SITE.name}`;
})();
