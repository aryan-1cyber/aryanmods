/*
 * ADS
 * ----
 * Renders every <aside data-ad-slot="key"> on the page, but only when all of
 * these are true:
 *
 *   1. ADS.enabled is true and ADS.client is set   (data/ads.config.js)
 *   2. the visitor accepted ads                    (assets/consent.js)
 *   3. the slot key has a unit id in ADS.slots
 *
 * Otherwise the slot stays hidden: no script, no cookies, no empty boxes.
 * ADS.preview paints placeholders instead, for checking layout pre-approval.
 */
(function () {
  var CFG = window.ADS || {};
  var scriptAdded = false;

  function configured() {
    return !!(CFG.enabled && CFG.client);
  }

  function consented() {
    return !CFG.consentRequired || (window.Consent && window.Consent.granted());
  }

  function addScript() {
    if (scriptAdded) return;
    scriptAdded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
      encodeURIComponent(CFG.client);
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  function bodyOf(slot) {
    return slot.querySelector('.ad-body') || slot;
  }

  function previewSlot(slot) {
    if (slot.dataset.adFilled) return;
    slot.dataset.adFilled = '1';
    slot.hidden = false;
    slot.classList.add('is-preview');
    bodyOf(slot).innerHTML =
      '<span class="ad-ph">Ad slot &ldquo;' + slot.getAttribute('data-ad-slot') + '&rdquo;</span>';
  }

  function fillSlot(slot) {
    var key = slot.getAttribute('data-ad-slot');
    var unit = (CFG.slots || {})[key];
    if (slot.dataset.adFilled || !unit) return;
    slot.dataset.adFilled = '1';

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', CFG.client);
    ins.setAttribute('data-ad-slot', unit);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    bodyOf(slot).appendChild(ins);
    slot.hidden = false;
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  function run() {
    // `.ad-slot` matters: AdSense puts data-ad-slot on its own <ins>, and that
    // must never be treated as one of our slots.
    var slots = Array.prototype.slice.call(document.querySelectorAll('.ad-slot[data-ad-slot]'));
    if (!slots.length) return;

    if (CFG.preview) {
      slots.forEach(previewSlot);
      return;
    }
    if (!configured() || !consented()) return;

    addScript();
    slots.forEach(fillSlot);
  }

  window.Ads = { refresh: run };

  document.addEventListener('consent:change', function (e) {
    if (e.detail && e.detail.choice === 'granted') run();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
