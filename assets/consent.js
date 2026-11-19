/*
 * CONSENT
 * -------
 * Stores one choice in localStorage and nothing else:
 *   { choice: "granted" | "denied", at: <ISO date>, v: 1 }
 *
 * The banner only appears when ads are actually configured (ADS.enabled and
 * ADS.client are set), so a site with ads off never nags anyone.
 * "Cookie settings" in the footer re-opens it.
 */
(function () {
  var KEY = 'am-consent-v1';
  var ADS = window.ADS || {};
  var bar = null;

  function stored() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return v && (v.choice === 'granted' || v.choice === 'denied') ? v : null;
    } catch (e) {
      return null;
    }
  }

  function save(choice) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice: choice, at: new Date().toISOString(), v: 1 }));
    } catch (e) {}
    return choice;
  }

  function emit(choice) {
    document.dispatchEvent(new CustomEvent('consent:change', { detail: { choice: choice } }));
  }

  function adsConfigured() {
    return !!(ADS.enabled && ADS.client);
  }

  function build() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'cookie-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie and ads choice');
    bar.hidden = true;
    bar.innerHTML =
      '<div class="cookie-text">' +
      '<strong>Ads keep this site free</strong>' +
      '<p>If you accept, Google may use cookies to show personalised ads. Decline and you get no ads and no ad cookies. ' +
      '<a href="privacy.html">Privacy policy</a></p>' +
      '</div>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn" data-choice="denied">No thanks</button>' +
      '<button type="button" class="btn btn-primary" data-choice="granted">Accept ads</button>' +
      '</div>';

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-choice]');
      if (!btn) return;
      if (btn.dataset.choice === 'granted') Consent.accept();
      else Consent.decline();
    });

    document.body.appendChild(bar);
    return bar;
  }

  function show() {
    build().hidden = false;
  }

  function hide() {
    if (bar) bar.hidden = true;
  }

  var Consent = {
    choice: function () {
      var s = stored();
      return s ? s.choice : null;
    },
    granted: function () {
      return Consent.choice() === 'granted';
    },
    accept: function () {
      save('granted');
      hide();
      emit('granted');
    },
    decline: function () {
      save('denied');
      hide();
      emit('denied');
    },
    open: show,
    reset: function () {
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
      show();
    }
  };

  window.Consent = Consent;

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-cookie-settings]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        show();
      });
    });

    if (adsConfigured() && !stored()) show();
  });
})();
