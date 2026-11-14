# mobileqbt

A mobile-first admin UI for **qBittorrent 5.x**: a Svelte 5 single-page app that talks to qBittorrent's
WebUI API. Phone layout is a native-feeling stack (list → detail, bottom sheets, long-press selection);
tablets and desktops get a list/detail split. Installable as a PWA.

Features: torrent list with live updates, search, status/category/tag filters and sorting, multi-select
actions, add by magnet / URL / `.torrent` upload, per-torrent General, Trackers, Peers, Files (with
priorities) and Speed tabs, alt-speed toggle, light/dark theme.

Targets qBittorrent **5.x only** (uses the `stop`/`start` endpoints). One deployment per qBittorrent server.

## Deploy

Build once:

```sh
npm ci
npm run package      # -> release/mobileqbt-webui/public/ (+ .zip), and dist/
```

### A. As qBittorrent's alternative WebUI (simplest)

1. Copy `release/mobileqbt-webui/` to the machine running qBittorrent (the `.zip` is just for carrying it
   there; unzip it, qBittorrent can't load a zip itself).
2. qBittorrent → *Options → WebUI → Use alternative WebUI* → set **Files location** to that
   `mobileqbt-webui` folder (the one that *contains* `public/`). In a container, mount it and use the
   in-container path.
3. Open qBittorrent's usual WebUI address. The app is served same-origin, so no CORS or proxy setup is
   needed, and it shows its own login screen.

Rolling back: untick the option; the stock WebUI is back.

### B. Behind a reverse proxy

Serve `dist/` as static files and proxy `/api/` to qBittorrent. Example (nginx):

```nginx
server {
  listen 443 ssl;
  server_name qbt.example.com;
  root /srv/mobileqbt/dist;

  location / { try_files $uri /index.html; }

  location /api/ {
    proxy_pass http://127.0.0.1:8080;
    # qBittorrent's CSRF protection compares Host, Origin and Referer. Pass the public host through
    # (and make sure the WebUI's host header validation allows it), or disable it in the WebUI options.
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

If the API lives somewhere other than `/api/v2` relative to the page, set `VITE_API_BASE` at build time
(e.g. `VITE_API_BASE=/qbt/api/v2 npm run package`).

### HTTPS and the installable app

Install-to-home-screen, the service worker and the `magnet:` link handler need a secure context (HTTPS, or
`localhost`). Over plain HTTP the app still works in the browser; it just can't be installed.

## Develop

Needs Node 22+ and Docker.

```sh
docker compose up -d        # dev qBittorrent on http://127.0.0.1:28080 (admin / mobileqbt-dev)
python3 scripts/seed-dev.py # fixture torrents used by the e2e tests
npm install
npm run dev                 # vite on :5173, /api proxied to the dev qBittorrent (QBT_URL to change)
```

First start of the dev container: it generates a random WebUI password. The compose file's config dir
(`dev/qbt/config`) is git-ignored; if you wipe it, set the password to `mobileqbt-dev` again (or change
`tests/helpers.ts`).

| Command | What it does |
|---|---|
| `npm run check` | svelte-check / type-check |
| `npm test` | unit tests (Vitest) |
| `npm run test:e2e` | Playwright against `npm run dev` (phone + tablet viewports) |
| `E2E_BASE_URL=http://localhost:28080 npm run test:e2e` | same suite against a deployed build, e.g. the alt-WebUI one (also covers the service worker) |
| `npm run package` | production build + alt-WebUI layout + zip |
| `node scripts/make-icons.mjs` | re-render PNG icons from `public/icon.svg` |

To try the alt-WebUI build locally, the compose file already mounts `release/mobileqbt-webui` at
`/webui`; run `npm run package`, then set the alternative WebUI path to `/webui` in the dev instance's
options (or via `app/setPreferences`).
