# Changelog

All notable changes to MobileQBT. Versions are calendar based (`YYYY.MM.N`); the image for each is
`ghcr.io/crimsonking60/mobileqbt:<version>`. The format follows [Keep a Changelog](https://keepachangelog.com).

Entries under **Unreleased** are added with each change; the release workflow turns them into the next
version's section and uses them as the GitHub release notes.

## Unreleased

### Added
- Session and all-time downloaded/uploaded totals and the global ratio, at the bottom of the menu.

## 2026.11.8 - 2026-11-15

### Added
- Search: qBittorrent's search plugins from the Menu. Results stream in, can be filtered and sorted, and are added
  through the usual add sheet. A Plugins tab enables, installs, updates and removes plugins.

## 2026.11.7 - 2026-11-15

### Added
- MIT license.
- Documentation site for Read the Docs (MkDocs), built from `docs/` and the changelog.

## 2026.11.6 - 2026-11-15

### Added
- [User guide](docs/guide.md): Docker setup, authentication, HTTPS, all features, troubleshooting.
- This changelog.

## 2026.11.5 - 2026-11-15

### Fixed
- List search matches by words, in any order, and ignores punctuation, quotes, case and accents.
  `"Paul Halpern - The Allure of the Multiverse"` now finds the torrent however its name is punctuated.

## 2026.11.4 - 2026-11-15

### Fixed
- On iPad and iPhone, opening a torrent from an empty detail pane no longer reloads the list and jumps it
  back to the top.

## 2026.11.3 - 2026-11-14

### Added
- Dependabot updates for npm packages, GitHub Actions and the Docker base images.
- CI checks (type-check, unit tests, build) on every pull request.

## 2026.11.2 - 2026-11-14

### Fixed
- Release notes name the image in lowercase so the pull command works as written.

## 2026.11.1 - 2026-11-14

First release.

### Added
- Torrent list with live updates, search, status, category and tag filters, sorting, and multi-select actions
  (start, stop, delete, force start, recheck, reannounce, queue position, rename).
- Add torrents by magnet link, URL or `.torrent` upload, with category, tags, save path and options.
- Torrent detail with General, Trackers, Peers, Files (with priorities) and Speed tabs.
- Category and tag management, editable from the detail view.
- RSS: feeds, articles with a download handoff, and auto-download rules with match preview.
- Settings: speed limits, alt-speed schedule, paths, connections and queueing.
- Status bar with connection state, speeds, free space and the alt-speed toggle.
- Tablet and desktop split layout with a resizable, remembered divider.
- Keyboard shortcuts with an in-app help sheet.
- Notifications for finished and failed downloads (in-app, and system notifications while the app is alive).
- Light and dark theme, installable as a PWA, and keyboard-free touch gestures (long-press to select).
- Docker image (nginx plus an API proxy to `QBT_URL`), multi-arch (amd64, arm64), published to ghcr.io.
- Optional packaging as qBittorrent's alternative WebUI.
