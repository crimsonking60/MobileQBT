# MobileQBT user guide

MobileQBT is a phone- and tablet-friendly web UI for **qBittorrent 5.x**. It runs as its own small web
service, talks to your qBittorrent through the WebUI API, and leaves qBittorrent's built-in WebUI untouched.
Use the built-in UI for desktop-level administration and MobileQBT for everyday use on small screens.

**Contents**

1. [How it fits together](#1-how-it-fits-together)
2. [Docker setup](#2-docker-setup)
3. [Authentication](#3-authentication)
4. [HTTPS and installing as an app](#4-https-and-installing-as-an-app)
5. [Using the app](#5-using-the-app)
6. [Keyboard shortcuts](#6-keyboard-shortcuts)
7. [Notifications](#7-notifications)
8. [Updating, versions and rollback](#8-updating-versions-and-rollback)
9. [Troubleshooting](#9-troubleshooting)
10. [Limits](#10-limits)

---

## 1. How it fits together

```
 phone / tablet / browser ──►  MobileQBT container  ──►  qBittorrent WebUI
                               (nginx: app + /api/ proxy)   (e.g. http://qbittorrent:8080)
```

- The container serves the app (static files) and forwards everything under `/api/` to qBittorrent.
- Your browser only ever talks to MobileQBT. The proxy rewrites the `Host`, `Origin` and `Referer`
  headers to qBittorrent's own address, so qBittorrent's CSRF and host-header protection accept the
  requests **without you changing any qBittorrent setting**.
- One MobileQBT deployment points at **one** qBittorrent. For a second server, run a second container.
- MobileQBT has **no accounts and no database**. Sign-in uses your qBittorrent credentials (see
  [Authentication](#3-authentication)).
- It targets qBittorrent **5.x only**. Older 4.x versions use different start/stop endpoints and will not work.

## 2. Docker setup

### Quick start

```sh
docker run -d --name mobileqbt --restart unless-stopped \
  -p 8081:80 \
  -e QBT_URL=http://qbittorrent:8080 \
  ghcr.io/crimsonking60/mobileqbt:latest
```

Open `http://<docker-host>:8081` and sign in with your qBittorrent username and password.

The image is public (no `docker login` needed) and built for `linux/amd64` and `linux/arm64`, so it runs
on a normal server and on a Raspberry Pi or other ARM NAS.

### Docker Compose

```yaml
services:
  mobileqbt:
    image: ghcr.io/crimsonking60/mobileqbt:latest   # or pin, e.g. :2026.11.5
    restart: unless-stopped
    environment:
      QBT_URL: http://qbittorrent:8080
    ports:
      - "8081:80"
```

A ready-to-copy file is in the repository root as [`compose.example.yml`](https://github.com/crimsonking60/MobileQBT/blob/main/compose.example.yml).

### The one setting: `QBT_URL`

`QBT_URL` is the address of qBittorrent's WebUI **as seen from inside the MobileQBT container**.

| Rule | Example |
|---|---|
| Origin only: scheme, host, port. No path, no trailing slash needed. | `http://qbittorrent:8080` |
| `https://` works too. | `https://qbt.example.com` |
| It is required. The container refuses to start without it and prints a message saying so. | |
| A trailing `/` is stripped automatically. | `http://nas:8080/` is fine |

The value is read **at container start**, so changing it means recreating the container
(`docker compose up -d` after editing the file).

### Reaching qBittorrent from the container

What to put in `QBT_URL` depends on where qBittorrent runs:

| qBittorrent runs… | Use |
|---|---|
| In the **same Compose project** | The service name: `http://qbittorrent:8080`. |
| In a **different Compose project** or `docker run` | Attach both to one shared network (`docker network create qbt`, then add `networks:` to both) and use the container name. |
| **Directly on the Docker host** | `http://host.docker.internal:8080`. On Linux add `extra_hosts: ["host.docker.internal:host-gateway"]` to the service. Or use the host's LAN IP. |
| On **another machine** | That machine's address, e.g. `http://192.168.1.20:8080`. The port must be reachable from the Docker host. |
| Behind its **own HTTPS proxy** | The public URL, e.g. `https://qbt.example.com`. The certificate must be trusted by the container (a self-signed one will fail). |

Example with an existing qBittorrent in another project:

```yaml
services:
  mobileqbt:
    image: ghcr.io/crimsonking60/mobileqbt:latest
    environment:
      QBT_URL: http://qbittorrent:8080
    ports: ["8081:80"]
    networks: [default, qbt]

networks:
  qbt:
    external: true       # created with: docker network create qbt
```

### Ports and exposure

- Inside the container nginx listens on **port 80**. Map it to whatever you like (`8081:80` above).
- To keep it off the network and put a reverse proxy in front, bind to localhost: `127.0.0.1:8081:80`.
- MobileQBT adds nothing to what qBittorrent already exposes: everything under `/api/` still needs a valid
  qBittorrent session. But the **sign-in page is public** to anyone who can reach the port, and anyone
  can try passwords there. Don't expose it to the internet without HTTPS and, ideally, a VPN or an
  authenticating proxy in front. See [Authentication](#3-authentication).

### Uploads

`.torrent` uploads of up to **64 MB** are accepted by the proxy. This is more than enough for any
`.torrent` file.

### Behind your own reverse proxy

Point Traefik, Caddy, nginx Proxy Manager or similar at the container's port 80. No special settings are
needed. Terminate HTTPS at the proxy and forward everything, including `/api/`, to MobileQBT. Do not strip
cookies or rewrite paths. If you serve the app under a sub-path (such as `/qbt/`), you must rebuild the
image with a matching `VITE_API_BASE`; the published image assumes the app is at the root of its origin.

### Building from source instead

```sh
git clone https://github.com/crimsonking60/MobileQBT.git && cd MobileQBT
docker build -t mobileqbt .
docker run -d -p 8081:80 -e QBT_URL=http://qbittorrent:8080 mobileqbt
```

### Without Docker

Build with `npm ci && npx vite build`, serve `dist/` as static files, and proxy `/api/` to qBittorrent.
[`docker/default.conf.template`](https://github.com/crimsonking60/MobileQBT/blob/main/docker/default.conf.template) is a complete nginx config to copy;
substitute your qBittorrent address for `${QBT_URL}`.

## 3. Authentication

### Whose credentials?

**Your qBittorrent's.** MobileQBT has no user database of its own. The username and password you type on
its sign-in page are sent through the proxy to qBittorrent's `auth/login`, and qBittorrent decides. That means:

- Change the password in qBittorrent (*Options → WebUI → Authentication*), and MobileQBT follows at once.
- Anyone who can sign in to qBittorrent can sign in to MobileQBT, and has the same rights. There are no roles.
- MobileQBT never stores your password. The browser keeps only qBittorrent's session cookie.

### The session

- After a successful sign-in, qBittorrent sets a session cookie named `QBT_SID_<port>`. The browser keeps it
  and sends it with every request.
- Sessions expire after qBittorrent's **session timeout** (*Options → WebUI → Web UI session timeout*,
  default 3600 s). The timer is refreshed by activity, and the app polls every few seconds while open, so
  an open app stays signed in.
- If the session is lost (timeout, qBittorrent restart, you signed out in another tab), the app notices on
  its next poll and shows the sign-in page again.
- The cookie is kept per origin. Signing in to `http://host:8081` and `https://qbt.example.com` are
  separate sessions.
- There is currently **no "Sign out" button** in the app. To end a session, clear the site's cookies in
  the browser, or wait for the timeout.

### What qBittorrent settings matter

You don't need to change any, but these interact with MobileQBT:

| qBittorrent setting | Effect |
|---|---|
| **Ban client after consecutive failures** (default 5 attempts, 1 hour) | Failed sign-ins through MobileQBT count against the *proxy's* address unless you enable reverse-proxy support (below). Five typos can lock out every MobileQBT user for the ban period. |
| **Enable reverse proxy support** + trusted proxies | MobileQBT sends `X-Forwarded-For` with the real client address. Enable this and list the MobileQBT container's address as a trusted proxy, and bans apply per client instead of to everyone. |
| **Bypass authentication for clients on localhost / in whitelisted subnets** | Requests from MobileQBT come from the container's address, not the browser's. Whitelisting that address would let **anyone who can reach MobileQBT** skip sign-in. Leave this off for the proxy. |
| **Enable cookie Secure flag** | Requires HTTPS. If you turn this on and open MobileQBT over plain HTTP, the browser will not keep the cookie and sign-in will appear to succeed and then fail immediately. Use it only when MobileQBT is served over HTTPS. |
| **CSRF protection / host header validation** | Leave on. The proxy already presents the headers qBittorrent expects. |
| **Use alternative WebUI** | Not needed. MobileQBT is a separate service and works with the stock UI. |

### Sign-in messages

| You see | Meaning |
|---|---|
| *Wrong username or password* | qBittorrent rejected the credentials. |
| *Can't reach qBittorrent* | The container can't connect to `QBT_URL`. See [Troubleshooting](#9-troubleshooting). |
| Sign-in works, then you are sent back to sign-in | Almost always the cookie Secure flag over HTTP (above), or a clock/timeout issue. |
| Sign-in is refused for everyone | The proxy's address is banned after failed attempts. Wait out the ban or restart qBittorrent. |

### Hardening

- Use a **strong unique password** in qBittorrent. It is the only gate.
- Put HTTPS in front before exposing the app beyond your LAN; credentials and the session cookie otherwise
  travel in clear text.
- Better still, don't expose it at all: reach it over a VPN such as Tailscale or WireGuard.
- Enable reverse-proxy support in qBittorrent, as above, so brute-force bans work per client.

## 4. HTTPS and installing as an app

### Plain HTTP

Over HTTP on your LAN the app works fully in the browser, and **iPhone and iPad can still use Add to Home
Screen** and open it as a standalone app.

### What HTTPS adds

With a **trusted** certificate:

- the **service worker** (instant start and an offline app shell: the interface loads without a network, but
  torrent data always needs qBittorrent),
- **notifications** ([section 7](#7-notifications)),
- the `magnet:` link handler,
- a proper install prompt on Android Chrome.

A self-signed certificate only helps if each device trusts it (for example a local CA made with `mkcert`
and installed on the device). Otherwise browsers treat the site as untrusted and keep these features off.

Easy ways to get a trusted certificate without opening any port to the internet:

- **Tailscale**: `tailscale serve --bg 8081` publishes it at `https://<machine>.<tailnet>.ts.net` with a
  real certificate, reachable only from your devices.
- **A reverse proxy with Let's Encrypt** (Caddy, Traefik, nginx Proxy Manager) and a domain name. Use the
  DNS challenge if the server isn't publicly reachable.

### Installing

- **iPhone / iPad (Safari):** Share → *Add to Home Screen*.
- **Android (Chrome):** menu → *Install app* (needs HTTPS) or *Add to Home screen*.
- **Desktop Chrome / Edge:** the install icon in the address bar (needs HTTPS).

## 5. Using the app

### Layouts

| Screen | Layout |
|---|---|
| **Phone** | Full-screen list. Tapping a torrent opens its detail full-screen; the back button or a swipe-back returns to the list at the same scroll position. |
| **Tablet / desktop** (≥ 768 px wide) | **Split view**: list on the left, detail on the right. Drag the divider to resize (the width is remembered), use ← → on the focused divider for fine control, or double-click it to reset. Tapping a torrent shows it on the right; ✕ closes it. |

The theme follows your device's light/dark setting.

### The torrent list

- Each row shows the name, a progress bar, state, percent, size, live speeds, ETA (while downloading) and
  ratio (when idle and complete). The list updates every couple of seconds and is smooth with thousands of
  torrents.
- **Search**: the box at the top filters by name as you type. Every word you type must appear in the name,
  in any order, and punctuation, quotes, case and accents are ignored. `paul halpern` finds
  `Halpern, Paul - The Allure…` and `Paul.Halpern_-_The.Allure`.
- **Filter & sort** (the funnel button; a blue dot means a filter is active):
  - *Status*: All, Downloading, Seeding, Completed, Stopped, Active, Inactive, Stalled, Errored.
  - *Category* and *Tag*: pick one, or "uncategorized".
  - *Sort by*: date added, name, progress, download speed, upload speed, size, ratio, ETA. The
    **Descending / Ascending** button below flips the direction.
  - **Manage categories & tags…** at the bottom of the sheet creates, renames (edits) and deletes them.
- The count in the search placeholder is the total number of torrents on the server.

### Status bar

Under the search box: connection state (green connected, amber firewalled, red disconnected), current
download and upload speed, free disk space (on wider screens), and the **Alt speed** button, which toggles
qBittorrent's alternative speed limits (it turns amber while on).

### Selecting and acting

- **Long-press** a row (or press `x` / Space on a keyboard) to start selecting. Tap more rows to add them,
  **Select all** to take everything currently shown, ✕ to cancel.
- The action bar then offers **Start**, **Stop**, **Delete** and **More**.
- **Delete** asks for confirmation and has an *Also delete downloaded files* checkbox.
- **More** has Force start, Recheck, Reannounce, Move to top/bottom of queue, Category & tags, and
  Rename (when exactly one torrent is selected).
- The same actions are in the detail header (start/stop, delete, more) for the open torrent.

### Adding torrents

The **+** button opens *Add torrents*:

- Paste one or more **magnet links or HTTP(S) URLs**, one per line.
- And/or choose one or more **.torrent files** (multiple at once is fine).
- Optional **category**, **tags** and **save path** (leave the path empty to use qBittorrent's default, which is shown as the placeholder).
- Switches: *Start torrent*, *Download in sequential order*, *Download first and last pieces first*.

The sheet also opens from RSS articles (Download…) with the link filled in.

### Torrent detail

Five tabs (keys `1`–`5`):

| Tab | What it shows |
|---|---|
| **General** | Progress, state, sizes, downloaded/uploaded, ratio, ETA, seeds and peers (with swarm totals), connections, average speeds, wasted data, save path, category, tags, tracker, pieces, private flag, info hash (tap to copy), added/completed dates, active and seeding time, creator and comment. **Category** and **Tags** rows are tappable to change them. |
| **Trackers** | Every tracker with its status, seed, peer, leech and download counts and any message, plus a **Reannounce** button. |
| **Peers** | Connected peers with country flag, address, progress, client, connection type, flags and speeds. |
| **Files** | The file tree with sizes and progress. Tap a file's or folder's priority to set *Skip*, *Normal*, *High* or *Maximum*. |
| **Speed** | A live chart of download and upload speed since you opened the page (it only collects samples while open), with peak values, a hover/touch crosshair and a data table underneath. |

The detail link is a normal URL (`#/torrent/<hash>/<tab>`), so you can bookmark or share one.

### Categories and tags

Reachable from *Filter & sort → Manage categories & tags…*. Create, edit and delete. Categories can have a
save path. Assign them to torrents from the detail's General tab, from *More → Category &
tags…* or with the `t` key. Changes show a confirmation message and the sheet stays open so you can make
several edits.

### RSS

Menu (the ⋮ button next to the filter button) → **RSS**. Three tabs:

- **Articles**: all articles from all feeds, newest first. Filter by feed with the chips at the top, show
  *Unread only*, or *Mark all read*. Tap an article to read its description and press **Download…** to open the
  add sheet with its link filled in.
- **Feeds**: add a feed by URL (it is refreshed immediately so articles appear), edit its name and URL,
  refresh, or remove it (with confirmation).
- **Rules**: auto-download rules. Each has a name, an enable switch, *Must contain* and *Must not contain*
  patterns (with an option to use regular expressions), an episode filter and smart episode filter, the feeds
  it applies to, category, save path, *Add stopped* and *Ignore matches for (days)*. **Preview matches** saves the rule and shows which existing articles it would pick up, so you
  can tune it before it downloads anything.

RSS processing itself (fetching on a schedule and applying rules) is done by qBittorrent; *Options → RSS* in
qBittorrent controls the refresh interval and whether RSS is enabled at all.

### Settings

Menu → **Settings** (or `,`). Only the values you change are written to qBittorrent.

- **Notifications** (this device only; see [section 7](#7-notifications)).
- **Speed limits**: global download/upload in KiB/s, and the alternative limits (0 = unlimited).
- **Alt-speed schedule**: enable, start and end time, and which days.
- **Paths**: default save path, and an optional separate temporary path for incomplete downloads.
- **Connections**: global and per-torrent connection and upload-slot limits (-1 = unlimited).
- **Queueing**: enable, and the limits for active downloads, uploads and total torrents.

Anything not listed (ports, encryption, BitTorrent protocol options, search plugins, WebUI settings) is
managed in qBittorrent's own WebUI.

## 6. Keyboard shortcuts

Meant for tablets with a keyboard and for desktop use. Shortcuts pause while you type in a field or while a
dialog is open. `?` shows this list in the app.

| Key | Action |
|---|---|
| `j` / `↓` | Next torrent |
| `k` / `↑` | Previous torrent |
| `Enter` / `o` | Open torrent |
| `x` / `Space` | Select or deselect |
| `Ctrl` / `⌘` + `A` | Select all |
| `Esc` | Clear selection, or close the open torrent |
| `/` | Focus the search box |
| `s` / `p` | Start / stop |
| `Delete` | Delete… |
| `m` | More actions… |
| `t` | Category & tags… |
| `1`–`5` | Switch detail tab |
| `n` | Add torrent |
| `,` | Settings |
| `?` | Show the shortcuts |

Actions apply to the selected torrents, or if nothing is selected, to the torrent under the cursor (the
ringed row), which follows whichever torrent is open.

## 7. Notifications

Settings → Notifications → **Notify on finish or error**. You get a message when a torrent finishes
downloading or enters an error state.

- When the app is **visible**, you get an in-app message at the top of the screen.
- When it is **in the background but still alive**, you get a system notification, and tapping it opens that
  torrent. In that case the app keeps checking every 15 seconds.
- It needs **HTTPS** (a trusted certificate) and your permission. If the browser has blocked the site, the
  settings sheet says so; allow it in the browser's site settings.
- The setting is per device and browser.
- **Limit:** a *closed* app cannot be notified. Real push notifications need a push server, which MobileQBT
  doesn't have. On iOS the app must be installed to the Home Screen, and the system may suspend it in the
  background, so treat notifications as a convenience, not a guarantee.

## 8. Updating, versions and rollback

Every change to the app that lands on `main` is released automatically with a calendar version
`YYYY.MM.N` (for example `2026.11.5`; N counts within the month). The image is published to
`ghcr.io/crimsonking60/mobileqbt` under both that version and `latest`. Documentation- and test-only
changes don't create a release.

```sh
docker compose pull && docker compose up -d      # follow latest
```

- **Pin a version** (`image: ghcr.io/crimsonking60/mobileqbt:2026.11.5`) if you prefer to upgrade
  deliberately; the [Releases page](https://github.com/crimsonking60/MobileQBT/releases) lists what
  changed.
- **Roll back** by pinning the previous version and running `docker compose up -d` again.
- After an update, **reload the page** (twice if the old version seems to stick) so the browser picks up the
  new app files. The service worker may serve the previous shell once.
- Nothing is stored in the container, so updating and rolling back lose nothing. Your torrents and settings
  live in qBittorrent.
- Browser-local preferences (split width, notifications opt-in) live in the browser's local storage.

## 9. Troubleshooting

| Symptom | Check |
|---|---|
| Container exits immediately with *set QBT_URL…* | You didn't set `QBT_URL`. See [section 2](#2-docker-setup). |
| Page shows *Can't reach qBittorrent* or requests fail with 502/504 | From the Docker host run `docker exec mobileqbt wget -qO- $QBT_URL/api/v2/app/webapiVersion` (it should answer 403 or a version, not time out). Check the network, the port, firewalls, and that `QBT_URL` is reachable *from the container* (`localhost` inside the container means the container itself). |
| Wrong username or password for correct credentials | The proxy may be banned: too many failed attempts. Wait, or restart qBittorrent. |
| Signs in, then bounces back to sign-in | Cookie Secure flag enabled in qBittorrent while using HTTP, or a very short session timeout. |
| Everything signed out at once | qBittorrent restarted, or its session timed out. Sign in again. |
| Torrents never appear, just *Loading…* | Open the browser's network tab: `/api/v2/sync/maindata` should return JSON. A 403 means not signed in; a 404 means the proxy isn't pointing at a qBittorrent WebUI. |
| Works on the LAN, not over the internet | Port forwarding, firewall, or HTTPS misconfiguration at your reverse proxy. |
| No notifications | HTTPS trusted? Permission granted? On iOS, installed to the Home Screen? See [section 7](#7-notifications). |
| Old version after an update | Reload twice; make sure you pulled and recreated the container. |
| Start/stop does nothing or errors | You are on qBittorrent 4.x. MobileQBT needs 5.x. |
| `.torrent` upload fails | Over 64 MB, or the file isn't a valid torrent. |

To see what the container is doing: `docker logs mobileqbt`.

## 10. Limits

- qBittorrent **5.x only**; one qBittorrent per deployment.
- No sign-out button; no multiple users or roles.
- No search-plugin UI. Use qBittorrent's built-in WebUI for that, and for advanced options.
- Notifications require HTTPS and an alive app; there is no push backend.
- The Speed tab charts only the time the page has been open.
