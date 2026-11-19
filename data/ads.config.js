/*
 * ADVERTISING SETTINGS
 * --------------------
 * Ads are OFF until you fill this in. Nothing loads, no cookies are set and the
 * consent banner stays hidden while `enabled` is false.
 *
 * Steps once AdSense approves you:
 *   1. set enabled: true
 *   2. set client to your publisher id, e.g. "ca-pub-1234567890123456"
 *   3. paste each ad-unit id from AdSense into `slots` (leave one empty to skip it)
 *
 * `preview: true` draws dashed placeholder boxes so you can check the layout
 * before approval. It never loads AdSense and never sets cookies.
 */
window.ADS = {
  enabled: false,
  consentRequired: true,
  preview: false,

  // Google AdSense publisher id
  client: "",

  // Ad unit ids (AdSense → Ads → By ad unit → the number after the slash)
  slots: {
    homeFeed: "",     // home page, between "What's new" and "Support the site"
    appDetail: "",    // bottom of every app page
    changelog: "",    // bottom of the changelog
    channel: ""       // channel.html, after the first two posts
  }
};
