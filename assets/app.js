/* aryanmods — client-side rendering. Works on file:// and on a static host. */

const SITE = Object.assign(
  {
    name: 'aryanmods',
    brandMark: 'A',
    tagline: 'Apps, ready to install',
    heroTitle: 'Apps, ready to install',
    heroSubtitle: '',
    accent: '#4f8cff',
    accent2: '#8b5cf6',
    footer: '',
    formEndpoint: '',
    contactEmail: '',
    socials: []
  },
  window.SITE || {}
);

const APPDATA = Array.isArray(window.APPS) ? window.APPS : [];
const UPDATES = Array.isArray(window.UPDATES) ? window.UPDATES : [];

const ENTITIES = { '&': '&' + 'amp;', '<': '&' + 'lt;', '>': '&' + 'gt;', '"': '&' + 'quot;', "'": '&' + '#39;' };

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

function initials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function iconMarkup(app, extraClass) {
  const img = app.icon
    ? `<img src="${esc(app.icon)}" alt="" loading="lazy" onerror="this.remove()">`
    : '';
  return `<div class="icon ${extraClass || ''}"><span>${esc(initials(app.name))}</span>${img}</div>`;
}

function prettyDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value || '');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ------------------------------ branding ------------------------------- */

function applyBrand() {
  const root = document.documentElement;
  if (SITE.accent) root.style.setProperty('--accent', SITE.accent);
  if (SITE.accent2) root.style.setProperty('--accent-2', SITE.accent2);

  document.querySelectorAll('[data-site-name]').forEach((el) => (el.textContent = SITE.name));
  document.querySelectorAll('[data-site-mark]').forEach((el) => (el.textContent = SITE.brandMark || SITE.name.charAt(0)));
  document.querySelectorAll('[data-site-hero-title]').forEach((el) => (el.textContent = SITE.heroTitle || SITE.tagline));
  document.querySelectorAll('[data-site-hero-subtitle]').forEach((el) => (el.textContent = SITE.heroSubtitle));
  document.querySelectorAll('[data-site-footer]').forEach((el) => (el.textContent = SITE.footer));

  const socials = document.getElementById('socials');
  if (socials) {
    socials.innerHTML = (SITE.socials || [])
      .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`)
      .join('');
  }
}

/* --------------------------- dark / light ------------------------------ */

function initTheme() {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');

  const apply = (theme) => {
    root.dataset.theme = theme;
    try {
      localStorage.setItem('av-theme', theme);
    } catch (e) {}
  };

  if (btn) {
    btn.addEventListener('click', () => {
      apply(root.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  }

  // Respect the visitor's OS preference the first time they visit.
  if (!root.dataset.theme || !['dark', 'light'].includes(root.dataset.theme)) {
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    apply(prefersLight ? 'light' : 'dark');
  }
}

/* ------------------------------ updates -------------------------------- */

function updateMarkup(u) {
  return `
    <li class="update">
      <span class="update-date">${esc(prettyDate(u.date))}</span>
      <div>
        <h3>${esc(u.title)}</h3>
        <p>${esc(u.body)}</p>
        ${u.app ? `<a class="link" href="app.html?id=${encodeURIComponent(u.app)}">View app</a>` : ''}
      </div>
    </li>`;
}

function initUpdates() {
  const latest = document.getElementById('latestUpdates');
  if (latest) latest.innerHTML = UPDATES.slice(0, 3).map(updateMarkup).join('');

  const all = document.getElementById('updatesList');
  if (all) all.innerHTML = UPDATES.map(updateMarkup).join('');
}

/* ------------------------------- list ---------------------------------- */

function initList() {
  const grid = document.getElementById('grid');
  if (!grid) return;

  const searchEl = document.getElementById('search');
  const chipsEl = document.getElementById('chips');
  const sortEl = document.getElementById('sort');
  const countEl = document.getElementById('count');
  const emptyEl = document.getElementById('empty');
  const viewBox = document.querySelector('.view-toggle');

  const state = { q: '', cat: 'all', sort: 'name', view: 'grid' };

  try {
    const saved = localStorage.getItem('av-view');
    if (saved === 'list' || saved === 'grid') state.view = saved;
  } catch (e) {}

  const categories = [...new Set(APPDATA.map((a) => a.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  chipsEl.innerHTML = ['all', ...categories]
    .map((c) => `<button type="button" class="chip${c === 'all' ? ' is-active' : ''}" data-cat="${esc(c)}">${c === 'all' ? 'All' : esc(c)}</button>`)
    .join('');

  chipsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    state.cat = btn.dataset.cat;
    [...chipsEl.children].forEach((c) => c.classList.toggle('is-active', c === btn));
    render();
  });

  searchEl.addEventListener('input', () => {
    state.q = searchEl.value.trim().toLowerCase();
    render();
  });

  sortEl.addEventListener('change', () => {
    state.sort = sortEl.value;
    render();
  });

  if (viewBox) {
    viewBox.addEventListener('click', (e) => {
      const btn = e.target.closest('.vt-btn');
      if (!btn) return;
      state.view = btn.dataset.view;
      [...viewBox.children].forEach((b) => b.classList.toggle('is-active', b === btn));
      document.body.classList.toggle('list-view', state.view === 'list');
      try {
        localStorage.setItem('av-view', state.view);
      } catch (err) {}
    });
    document.body.classList.toggle('list-view', state.view === 'list');
    [...viewBox.children].forEach((b) => b.classList.toggle('is-active', b.dataset.view === state.view));
  }

  function matches(app) {
    if (state.cat !== 'all' && app.category !== state.cat) return false;
    if (!state.q) return true;
    return [app.name, app.description, app.category, app.version, app.developer]
      .join(' ')
      .toLowerCase()
      .includes(state.q);
  }

  function card(app) {
    return `
      <a class="card" href="app.html?id=${encodeURIComponent(app.id)}">
        ${iconMarkup(app)}
        <div class="card-body">
          <h3>${esc(app.name)}</h3>
          <p>${esc(app.description || '')}</p>
          <div class="meta">
            ${app.category ? `<span class="pill">${esc(app.category)}</span>` : ''}
            ${app.version ? `<span class="meta-item">v${esc(app.version)}</span>` : ''}
            ${app.size ? `<span class="meta-item">${esc(app.size)}</span>` : ''}
            ${app.requires ? `<span class="meta-item">${esc(app.requires)}</span>` : ''}
          </div>
        </div>
        <span class="card-cta">Get</span>
      </a>`;
  }

  function render() {
    const list = APPDATA.filter(matches).sort((a, b) => {
      if (state.sort === 'updated') {
        return new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime();
      }
      return String(a.name).localeCompare(String(b.name));
    });

    grid.innerHTML = list.map(card).join('');
    countEl.textContent = list.length === 1 ? '1 app' : `${list.length} apps`;
    emptyEl.hidden = list.length > 0;
  }

  render();
}

/* ------------------------------ detail --------------------------------- */

function initDetail() {
  const root = document.getElementById('detail');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  const app = APPDATA.find((a) => a.id === id);

  if (!app) {
    root.innerHTML = `
      <div class="empty">
        <h2>App not found</h2>
        <p>This link may be out of date, or the app was removed.</p>
        <a class="btn btn-primary" href="index.html">Browse all apps</a>
      </div>`;
    return;
  }

  document.title = `${app.name} — ${SITE.name}`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', app.description || `${app.name} download`);

  const downloads = (app.downloads || []).filter((d) => d && d.url);
  const shots = (app.screenshots || []).filter(Boolean);
  const releases = (app.releases || []).filter(Boolean);

  root.innerHTML = `
    <a class="back" href="index.html">&larr; All apps</a>

    <section class="detail-head">
      ${iconMarkup(app, 'icon-lg')}
      <div class="detail-title">
        <h1>${esc(app.name)}</h1>
        <div class="meta">
          ${app.category ? `<span class="pill">${esc(app.category)}</span>` : ''}
          ${app.version ? `<span class="meta-item">Version ${esc(app.version)}</span>` : ''}
          ${app.size ? `<span class="meta-item">${esc(app.size)}</span>` : ''}
          ${app.requires ? `<span class="meta-item">${esc(app.requires)}</span>` : ''}
          ${app.updated ? `<span class="meta-item">Updated ${esc(prettyDate(app.updated))}</span>` : ''}
          ${app.developer ? `<span class="meta-item">by ${esc(app.developer)}</span>` : ''}
        </div>
      </div>
    </section>

    ${app.description ? `<p class="lede">${esc(app.description)}</p>` : ''}

    <section class="panel">
      <h2>Download</h2>
      ${downloads.length
        ? `<div class="downloads">${downloads
            .map((d) => `<a class="btn btn-primary" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.label || 'Download APK')}</a>`)
            .join('')}</div>`
        : '<p class="muted">No download links yet.</p>'}
      <p class="fineprint">Links open in a new tab. Only install APKs from sources you trust.</p>
    </section>

    ${releases.length
      ? `<section class="panel">
           <h2>Version history</h2>
           <ul class="releases">
             ${releases
               .map(
                 (r) => `<li>
                   <div class="release-head">
                     <strong>v${esc(r.version || '')}</strong>
                     <span>${esc(prettyDate(r.date))}</span>
                   </div>
                   <p>${esc(r.notes || '')}</p>
                 </li>`
               )
               .join('')}
           </ul>
         </section>`
      : ''}

    ${shots.length
      ? `<section class="panel"><h2>Screenshots</h2><div class="shots">${shots
          .map((s) => `<img src="${esc(s)}" alt="" loading="lazy" onerror="this.remove()">`)
          .join('')}</div></section>`
      : ''}

    <section class="panel">
      <h2>Older version or a new release?</h2>
      <p class="muted">Tell us and we&rsquo;ll look into it.</p>
      <a class="btn" href="index.html?request=${encodeURIComponent(app.id)}#request">Request a version</a>
    </section>
  `;
}

/* --------------------------- request form ------------------------------ */

function initRequestForm() {
  const form = document.getElementById('requestForm');
  if (!form) return;

  const status = document.getElementById('requestStatus');
  const prefill = new URLSearchParams(location.search).get('request');
  if (prefill) {
    const app = APPDATA.find((a) => a.id === prefill);
    if (app) {
      const nameField = document.getElementById('reqName');
      if (nameField) nameField.value = app.name;
    }
  }

  form.addEventListener('submit', (e) => {
    const data = Object.fromEntries(new FormData(form).entries());
    const missing = ['name', 'email'].filter((k) => !String(data[k] || '').trim());
    if (missing.length) {
      e.preventDefault();
      status.textContent = 'Please fill in the app name and your email.';
      status.classList.add('is-error');
      return;
    }
    status.classList.remove('is-error');

    if (SITE.formEndpoint) {
      e.preventDefault();
      status.textContent = 'Sending…';
      fetch(SITE.formEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      })
        .then((res) => {
          if (!res.ok) throw new Error('request failed');
          status.textContent = 'Thanks! Your request was sent.';
          form.reset();
        })
        .catch(() => {
          status.textContent = 'Could not send. Please try again later.';
          status.classList.add('is-error');
        });
    } else if (SITE.contactEmail) {
      e.preventDefault();
      const subject = encodeURIComponent(`App request: ${data.name}`);
      const body = encodeURIComponent(
        `App: ${data.name}\nLink: ${data.link || '-'}\nContact: ${data.email}\n\n${data.message || ''}`
      );
      status.textContent = 'Opening your email app…';
      location.href = `mailto:${SITE.contactEmail}?subject=${subject}&body=${body}`;
    } else {
      e.preventDefault();
      status.textContent = 'No contact channel set yet — add formEndpoint or contactEmail in data/site.js.';
      status.classList.add('is-error');
    }
  });
}

/* --------------------------- offers / support --------------------------- */

function initOffers() {
  const section = document.getElementById('support');
  const grid = document.getElementById('offerGrid');
  if (!section || !grid) return;

  const cfg = window.OFFERS || {};
  const items = (Array.isArray(cfg.items) ? cfg.items : []).filter((o) => o && o.url);
  const support = (Array.isArray(cfg.support) ? cfg.support : []).filter((s) => s && s.url);

  if (!items.length && !support.length) {
    section.remove();
    return;
  }

  document.getElementById('supportButtons').innerHTML = support
    .map((s) => `<a class="btn btn-primary" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`)
    .join('');

  grid.innerHTML = items
    .map(
      (o) => `
      <a class="offer" href="${esc(o.url)}" target="_blank" rel="sponsored nofollow noopener noreferrer">
        <span class="offer-tag">${esc(o.tag || 'Partner')}</span>
        <strong>${esc(o.label)}</strong>
        <span class="offer-note">${esc(o.note || '')}</span>
      </a>`
    )
    .join('');

  if (items.length) {
    const badge = document.getElementById('offerBadge');
    if (badge) badge.hidden = false;
    const disclosure = document.getElementById('offerDisclosure');
    if (disclosure && cfg.disclose) {
      disclosure.textContent = cfg.disclose;
      disclosure.hidden = false;
    }
  }
}

/* --------------------------------- deals -------------------------------- */

function initDeals() {
  const section = document.getElementById('deals');
  const grid = document.getElementById('dealsGrid');
  if (!section || !grid) return;

  const cfg = window.DEALS || {};
  const items = (Array.isArray(cfg.items) ? cfg.items : []).filter(
    (d) => d && /^https?:\/\//i.test(String(d.url || ''))
  );

  if (!cfg.enabled || !items.length) {
    section.remove();
    return;
  }

  const title = document.getElementById('dealsTitle');
  if (title && cfg.title) title.textContent = cfg.title;

  const initials = (name) =>
    String(name || '?')
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();

  grid.innerHTML = items
    .map((d) => {
      const mark = /^https?:\/\//i.test(String(d.image || ''))
        ? `<img src="${esc(d.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
        : `<span class="deal-mark" style="background:${esc(d.accent || '#2b3550')}">${esc(initials(d.merchant))}</span>`;

      return `
      <a class="deal" href="${esc(d.url)}" target="_blank" rel="sponsored nofollow noopener noreferrer">
        ${mark}
        <span class="deal-body">
          <span class="deal-tag">${esc(d.merchant || 'Deal')}</span>
          <strong>${esc(d.title || '')}</strong>
          ${d.note ? `<span class="deal-note">${esc(d.note)}</span>` : ''}
          <span class="deal-foot">
            ${d.price ? `<span class="deal-price">${esc(d.price)}</span>` : ''}
            ${d.was ? `<span class="deal-was">${esc(d.was)}</span>` : ''}
            <span class="deal-cta">View deal</span>
          </span>
        </span>
      </a>`;
    })
    .join('');

  section.hidden = false;

  const disclosure = document.getElementById('dealsDisclosure');
  if (disclosure && cfg.disclose) {
    disclosure.textContent = cfg.disclose;
    disclosure.hidden = false;
  }
}

/* --------------------------------- boot -------------------------------- */

applyBrand();
initTheme();
initUpdates();
initList();
initDetail();
initRequestForm();
initOffers();
initDeals();

if (!document.title.includes(SITE.name) && document.getElementById('grid')) {
  document.title = `${SITE.name} — App Downloads`;
}
if (document.getElementById('updatesList')) {
  document.title = `What's new — ${SITE.name}`;
}
