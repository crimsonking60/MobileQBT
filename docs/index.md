# MobileQBT

A mobile-first admin UI for **qBittorrent 5.x**. It runs as its own small service next to your
qBittorrent, works on phones, tablets and desktops, and installs as an app.

- Torrent list with live updates, search, filters, sorting and multi-select actions
- Add by magnet link, URL or `.torrent` upload
- Per-torrent General, Trackers, Peers, Files and Speed tabs
- Torrent search through qBittorrent's search plugins
- RSS feeds and auto-download rules, settings, categories and tags
- Split layout on tablets, keyboard shortcuts, notifications, light and dark theme

## Get started

```sh
docker run -d --name mobileqbt -p 8081:80 \
  -e QBT_URL=http://qbittorrent:8080 \
  ghcr.io/crimsonking60/mobileqbt:latest
```

Open `http://<docker-host>:8081` and sign in with your qBittorrent credentials.

Next: the [user guide](guide.md) covers Docker setup, authentication, HTTPS and every feature, and the
[changelog](changelog.md) lists what each release contains.

Documentation: [mobileqbt.readthedocs.io](https://mobileqbt.readthedocs.io/). Source and issues: [github.com/crimsonking60/MobileQBT](https://github.com/crimsonking60/MobileQBT).
