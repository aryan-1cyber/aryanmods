/*
 * YOUR APP LIST
 * -------------
 * This is the only file you need to edit to add or change apps.
 * Add one object per app to the array below, separated by commas.
 *
 * Required:  id, name
 * Optional:  category, version, size, updated, icon, description,
 *            developer, requires, screenshots, releases, downloads
 *
 *   id          unique short slug, used in the URL (app.html?id=my-app)
 *   icon        path to a square PNG, e.g. "icons/my-app.png" (128x128 or larger)
 *   updated     "YYYY-MM-DD"
 *   developer   who made it
 *   requires    minimum Android version, e.g. "Android 8.0+"
 *   releases    list of { version, date, notes } - newest first
 *   downloads   list of { label, url } - add as many mirrors as you want
 */
window.APPS = [
  {
    id: "notes-lite",
    name: "Notes Lite",
    category: "Productivity",
    version: "1.4.2",
    size: "6.2 MB",
    updated: "2026-11-02",
    developer: "aryanmods",
    requires: "Android 8.0+",
    icon: "",
    description: "A fast, offline-first notes app with folders, pinning and dark mode. No account, no ads, no sync you did not ask for.",
    screenshots: [],
    releases: [
      { version: "1.4.2", date: "2026-11-02", notes: "Faster search, fixed folder ordering, added Markdown export." },
      { version: "1.4.0", date: "2026-09-14", notes: "New pin-to-top feature and a redesigned editor." },
      { version: "1.0.0", date: "2026-06-30", notes: "First public release." }
    ],
    downloads: [
      { label: "Download APK", url: "https://example.com/notes-lite-1.4.2.apk" },
      { label: "Mirror", url: "https://example.com/mirror/notes-lite-1.4.2.apk" }
    ]
  },
  {
    id: "pixel-paint",
    name: "Pixel Paint",
    category: "Art",
    version: "2.0.0",
    size: "14.8 MB",
    updated: "2026-10-18",
    developer: "aryanmods",
    requires: "Android 7.0+",
    icon: "",
    description: "A lightweight pixel-art editor for phones and tablets. Layers, palettes, onion skinning and GIF export.",
    screenshots: [],
    releases: [
      { version: "2.0.0", date: "2026-10-18", notes: "Complete redesign, layers and onion skinning added." },
      { version: "1.2.0", date: "2026-08-05", notes: "Added palette import and export." }
    ],
    downloads: [
      { label: "Download APK", url: "https://example.com/pixel-paint-2.0.0.apk" }
    ]
  },
  {
    id: "focus-timer",
    name: "Focus Timer",
    category: "Productivity",
    version: "1.1.0",
    size: "3.4 MB",
    updated: "2026-09-27",
    developer: "aryanmods",
    requires: "Android 6.0+",
    icon: "",
    description: "A minimal Pomodoro timer with a persistent notification and weekly stats. Works fully offline.",
    screenshots: [],
    releases: [
      { version: "1.1.0", date: "2026-09-27", notes: "Weekly stats and custom session lengths." },
      { version: "1.0.0", date: "2026-07-19", notes: "First release." }
    ],
    downloads: [
      { label: "Download APK", url: "https://example.com/focus-timer-1.1.0.apk" }
    ]
  }
];
