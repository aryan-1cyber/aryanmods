# aryanmods

A static app/APK directory. No server, no database, no build step.

```
apk-site/
├── index.html          home: search, filters, grid/list, latest updates, request form
├── app.html            app page (app.html?id=slug)
├── changelog.html      "What's new" page
├── admin.html          app manager (noindex, not linked from the site)
├── assets/
│   ├── style.css       dark + light theme
│   ├── app.js          rendering, search, theme toggle, form
│   ├── admin.css       admin-only styles
│   ├── admin.js        admin logic + GitHub publishing
│   └── favicon.svg
├── data/
│   ├── site.js         <-- site name, colours, footer, contact settings
│   ├── apps.js         <-- your app list
│   └── updates.js      <-- changelog entries
├── icons/              put 512x512 PNGs here
├── robots.txt          keeps admin.html out of search results
└── .gitignore          ignores APKs and secrets
```

## Change the site name, colours, footer

Open `data/site.js` and edit:

```js
window.SITE = {
  name: "aryanmods",          // shown in the header, browser tab and footer
  brandMark: "A",             // letter/emoji in the logo square
  tagline: "Apps, ready to install",
  heroTitle: "Apps, ready to install",
  heroSubtitle: "Pick an app, hit download.",
  accent: "#4f8cff",          // any CSS colour
  accent2: "#8b5cf6",
  footer: "your footer text",
  formEndpoint: "",           // e.g. "https://formspree.io/f/xxxx"
  contactEmail: "",           // fallback: opens the visitor's mail app
  socials: []                 // e.g. [{ label: "Telegram", url: "https://t.me/x" }]
};
```

No other file needs editing — the whole site picks these up.

## Dark / light theme

Already built in. The button in the header switches instantly, the choice is saved
in the visitor's browser (`localStorage`), and first-time visitors get whatever
their operating system prefers. The default theme comes from the `data-theme`
attribute in each HTML file (`dark` or `light`).

## Add an app

Open `data/apps.js` and add an object to the array:

```js
{
  id: "my-app",                    // unique slug, used in the URL
  name: "My App",
  category: "Tools",               // chips are generated from this
  version: "1.2.0",
  size: "12 MB",
  updated: "2026-11-18",
  developer: "aryanmods",
  requires: "Android 8.0+",
  icon: "icons/my-app.png",
  description: "One or two sentences shown on the card and detail page.",
  screenshots: ["shots/1.png", "shots/2.png"],
  releases: [
    { version: "1.2.0", date: "2026-11-18", notes: "What changed in this version." }
  ],
  downloads: [
    { label: "Download APK", url: "https://your-link-here" },
    { label: "Mirror", url: "https://your-backup-link" }
  ]
}
```

Rules:

- `id` and `name` are required; everything else is optional.
- `id` must be unique. It's the `?id=` value on the app page.
- Leave `icon: ""` to get an auto-generated gradient tile with the app's initials.
- `releases` renders as the "Version history" section on the app page.
- Buttons are generated from `downloads`, so add as many mirrors as you like.

## Add a changelog entry

Open `data/updates.js` and add to the top of the array:

```js
{ date: "2026-11-18", title: "Added Pixel Paint 2.0", body: "New version with layers." }
```

The home page shows the latest 3; `changelog.html` shows all of them.

## App request form

The form on the home page needs one of:

- `formEndpoint` — a Formspree / Basin / Google Forms endpoint (sends silently),
- `contactEmail` — opens the visitor's mail app with the details pre-filled,
- neither — the form explains that no contact channel is set up yet.

## Admin panel

Open `admin.html` in a browser (locally, or on your published site).

What it does:

- lists every app and lets you add, edit, duplicate or delete them with a form
- generates the `apps.js` file for you — copy it or download it
- keeps a working copy in `localStorage`, so a reload or crash does not lose edits
- can publish straight to GitHub (see below)

The ID (URL slug) is generated from the name as you type. It must be unique, and
only lowercase letters, numbers and dashes are allowed.

### Publishing from the admin panel

1. Create a **fine-grained token**: https://github.com/settings/personal-access-tokens/new
   - Repository access: only your site repo
   - Permissions → Contents: **Read and write**
2. Open `admin.html` → *Publish to GitHub*
3. Fill in username, repo, branch (`main`) and path (`data/apps.js`), paste the token
4. *Test connection*, then *Publish changes*

The commit triggers a redeploy on GitHub Pages / Cloudflare Pages automatically.

Your token stays in the browser. Only tick "Remember token" on a computer you
control, and never put the token in a file that gets committed.

## Preview locally

Just double-click `index.html`. It works from `file://` because the data lives in
`.js` files instead of being fetched as JSON.

For an accurate preview:

```powershell
cd C:\Users\Aryan\apk-site
python -m http.server 8000
```

Then open http://localhost:8000

## Deploy (free)

The repo is already initialized and committed locally. Pick one:

### Option A — Netlify Drop (fastest, no account setup)

1. Open https://app.netlify.com/drop
2. Drag the whole `C:\Users\Aryan\apk-site` folder onto the page
3. You get a live URL in seconds; connect a custom domain in Site settings

Note: dropping the folder uploads it once. Re-drop (or connect the repo) after
changes — or use the admin panel's GitHub publishing and connect the repo instead.

### Option B — GitHub Pages

```powershell
cd C:\Users\Aryan\apk-site
git remote add origin https://github.com/YOURNAME/YOURREPO.git
git push -u origin main
```

Then: repo → Settings → Pages → Source: `main` / root. Site appears at
`https://YOURNAME.github.io/YOURREPO/`.

With this option the admin panel's publish button works, because the repo is the
source of truth.

### Option C — Cloudflare Pages

Create a project, connect the repo, no build command, output directory `/`.
Free, fast, supports custom domains and automatic redeploys on push.

## Where to host the actual APK files

Don't put large APKs in the git repo. Use one of these and paste the URL into
`downloads`:

- GitHub Releases on the app's repo (best for open-source apps)
- Cloudflare R2 or Backblaze B2 (cheap object storage)
- Your own hosting

A shortener link works fine as a `downloads` entry *as long as it points at a build
you're allowed to distribute* — your own apps, or open-source APKs whose license
permits redistribution. Shortener links to cracked/re-packaged commercial apps are
both infringing and a fast way to get your domain and shortener account banned.

## Notes

- Search, category chips, sorting and grid/list layout all run client-side.
- All text is escaped before rendering, so quotes and apostrophes are safe.
- Icons and screenshots that fail to load are removed instead of showing a broken
  image.
