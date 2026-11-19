/* aryanmods — channel page renderer. Reads the same data/apps.js as the site. */

(function () {
  var SITE = window.SITE || {};
  var APPS = Array.isArray(window.APPS) ? window.APPS : [];

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function prettyDate(value) {
    var d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value || '');
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function initials(name) {
    return String(name || '?')
      .trim()
      .split(/\s+/)
      .map(function (w) { return w.charAt(0); })
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function timeLabel(value) {
    var d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    // Date-only values ("2026-11-02") get a date; timestamps get time too.
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return prettyDate(value);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function post(app) {
    var downloads = (app.downloads || []).filter(function (d) { return d && d.url; });
    var primary = downloads[0];
    var version = app.version ? ' ' + app.version : '';

    var meta = [
      app.category,
      app.size,
      app.requires,
      app.version ? 'v' + app.version : ''
    ].filter(Boolean).map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('');

    return '' +
      '<article class="post">' +
        '<div class="post-head">' +
          '<span class="post-avatar">' + esc(SITE.brandMark || 'A') + '</span>' +
          '<span class="post-author">' + esc(SITE.name || 'aryanmods') + '</span>' +
          '<span class="post-time">' + esc(timeLabel(app.updated)) + '</span>' +
        '</div>' +
        '<div class="bubble">' +
          '<h2>' + esc(app.name || '') + esc(version) + '</h2>' +
          (app.description ? '<p>' + esc(app.description) + '</p>' : '') +
          (meta ? '<div class="post-meta">' + meta + '</div>' : '') +
          '<div class="post-actions">' +
            (primary
              ? '<a class="btn btn-primary" href="' + esc(primary.url) + '" target="_blank" rel="noopener noreferrer">' +
                  esc(primary.label || 'Download') + '</a>'
              : '') +
            (app.id
              ? '<a class="btn" href="app.html?id=' + encodeURIComponent(app.id) + '">Details</a>'
              : '') +
          '</div>' +
          '<div class="post-foot">' +
            (downloads.length > 1 ? downloads.length + ' download links · ' : '') +
            '<a href="app.html?id=' + encodeURIComponent(app.id || '') + '">Open app page</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function boot() {
    var feed = document.getElementById('feed');
    if (!feed) return;

    var name = document.getElementById('chName');
    if (name) name.textContent = SITE.name || 'aryanmods';

    var avatar = document.getElementById('chAvatar');
    if (avatar) avatar.textContent = SITE.brandMark || 'A';

    var apps = APPS.slice().sort(function (a, b) {
      return new Date(b.updated || 0) - new Date(a.updated || 0);
    });

    var sub = document.getElementById('chSub');
    if (sub) {
      var latest = apps.length ? prettyDate(apps[0].updated) : '';
      sub.textContent = apps.length + (apps.length === 1 ? ' app' : ' apps') +
        (latest ? ' · last post ' + latest : '');
    }

    // Join button only when a real channel is configured.
    var join = document.getElementById('chJoin');
    var link = String(SITE.telegram || '').trim();
    if (join) {
      if (/^https:\/\/t\.me\/[A-Za-z0-9_]{3,}$/.test(link)) {
        join.href = link;
        join.hidden = false;
      } else {
        join.hidden = true;
      }
    }

    if (!apps.length) {
      feed.innerHTML = '<p class="pinned">No posts yet. Add apps in <code>data/apps.js</code> and they appear here.</p>';
      return;
    }

    // Pinned intro, then the posts, with the ad slot kept in the markup below.
    var pinned = document.getElementById('pinned');
    if (pinned) {
      pinned.innerHTML = '<strong>' + esc(SITE.name || 'aryanmods') + '</strong> posts each new release here first. ' +
        'Downloads open in a new tab. Only install apps from sources you trust.';
    }

    feed.innerHTML = apps.map(post).join('');

    // Ad slot sits after the first two posts.
    var ad = document.getElementById('feedAd');
    if (ad && feed.children.length > 1) {
      feed.insertBefore(ad, feed.children[2] || null);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
