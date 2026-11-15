# mobileqbt

A mobile-first admin UI for **qBittorrent 5.x**: a Svelte 5 single-page app that talks to qBittorrent's
WebUI API. Phone layout is a native-feeling stack (list → detail, bottom sheets, long-press selection);
tablets and desktops get a list/detail split. Installable as a PWA.

Features: torrent list with live updates, search, status/category/tag filters and sorting, multi-select
actions, add by magnet / URL / `.torrent` upload, per-torrent General, Trackers, Peers, Files (with
priorities) and Speed tabs, alt-speed toggle, RSS (feeds, articles, auto-download rules with match preview), settings, category/tag
management, keyboard shortcuts, notifications, light/dark theme.

See the **[user guide](docs/guide.md)** for Docker setup, authentication, HTTPS and all features.

Targets qBittorrent **5.x only** (uses the `stop`/`start` endpoints). One deployment per qBittorrent server.

## Deploy

MobileQBT is a static app plus a thin proxy to qBittorrent's API, run as its **own service** next to (or
away from) qBittorrent. The built-in WebUI stays untouched on its own port, so you keep the desktop UI for
the heavy stuff and use this one on phones and tablets.

### Docker (recommended)

Every change merged to `main` is released automatically (see [Releases](#releases)); pull the image:

```sh
docker run -d --name mobileqbt -p 8081:80 -e QBT_URL=http://qbittorrent:8080 \
  ghcr.io/crimsonking60/mobileqbt:latest
```

Pin a version (`ghcr.io/crimsonking60/mobileqbt:2026.11.1`) if you'd rather upgrade deliberately. Images are
`linux/amd64` and `linux/arm64`, and public, so no login is needed to pull. To build locally instead:
`docker build -t mobileqbt .`.

or use [`compose.example.yml`](compose.example.yml). `QBT_URL` is your qBittorrent WebUI's address as seen
from the container (origin only, no path; `https://` works too). Open `http://<host>:8081` and sign in with
your normal qBittorrent credentials.

What the container does: serves the app and proxies `/api/` to `QBT_URL`, rewriting `Host`, `Origin` and
`Referer` to qBittorrent's own address, so qBittorrent's CSRF and host-header checks pass without changing
any qBittorrent setting. Requests carry `X-Forwarded-For`; enable *Reverse proxy support* in qBittorrent
(and list this container's address as trusted) if you want its failed-login bans to apply per client
instead of to the proxy.

If qBittorrent runs in another compose project, join the container to the same Docker network (or use a
published host port and an address the container can reach).

### Without Docker

```sh
npm ci && npx vite build   # -> dist/
```

Serve `dist/` as static files and proxy `/api/` to qBittorrent; [`docker/default.conf.template`](docker/default.conf.template)
is a complete nginx config to copy (substitute `${QBT_URL}`). If the API isn't at `/api/v2` relative to the
page, set `VITE_API_BASE` at build time (e.g. `VITE_API_BASE=/qbt/api/v2`).

### Optional: as qBittorrent's alternative WebUI

Not recommended, since it *replaces* the built-in UI on that port, but it works: `npm run package`, unzip
`release/mobileqbt-webui` on the qBittorrent host (qBittorrent can't load the zip itself) and set
*Options → WebUI → Use alternative WebUI → Files location* to the folder that contains `public/`. To roll
back, untick the option, or `app/setPreferences` with `{"alternative_webui_enabled": false}`.

### HTTPS: what you get without it

Over plain HTTP (e.g. on your LAN) the app works fully in the browser, and iOS/iPadOS can still *Add to
Home Screen* and open it standalone. HTTPS with a **trusted** certificate additionally enables the service
worker (instant start, offline app shell), notifications, the `magnet:` link handler and a proper install on
Android Chrome. A self-signed certificate only helps if each device trusts its CA (e.g. via `mkcert`);
otherwise browsers treat the site as untrusted and keep those features off. Tailscale's `tailscale serve`
is an easy way to get a trusted certificate without opening any ports.

## Releases

What changed in each version is in [CHANGELOG.md](CHANGELOG.md) and on the
[Releases page](https://github.com/crimsonking60/MobileQBT/releases). When changing the app, add a line under
`## Unreleased` in the changelog; the workflow stamps it with the version and uses it as the release notes.

Versions are calendar based, `YYYY.MM.N`, where N counts releases within the month (`2026.11.1`,
`2026.11.2`, then `2026.12.1`). The [release workflow](.github/workflows/release.yml) runs on every push to
`main` (except changes that only touch docs, Markdown files or tests): it type-checks and runs the unit tests, builds the multi-arch
image, pushes it to `ghcr.io` as both the version and `latest`, then tags that commit and creates a GitHub
release with generated notes. Nothing is tagged if the checks or the build fail. It can also be started by
hand from the Actions tab.

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
| `E2E_BASE_URL=http://localhost:28080 npm run test:e2e` | same suite against a deployed build, e.g. the Docker image: `docker run -p 127.0.0.1:28090:80 -e QBT_URL=… mobileqbt` then `E2E_BASE_URL=http://127.0.0.1:28090` (also covers the service worker) |
| `npm run package` | production build + alt-WebUI layout + zip (only for the optional alt-WebUI mode) |
| `node scripts/make-icons.mjs` | re-render PNG icons from `public/icon.svg` |

To try the alt-WebUI build locally, the compose file already mounts `release/mobileqbt-webui` at
`/webui`; run `npm run package`, then set the alternative WebUI path to `/webui` in the dev instance's
options (or via `app/setPreferences`).
