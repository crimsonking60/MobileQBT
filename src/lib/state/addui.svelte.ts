/** Global state for the add-torrent sheet, so a magnet: handoff can open it from anywhere. */
class AddUi {
  open = $state(false);
  /**
   * The URL box content lives here, not in the sheet: the sheet is unmounted while the login
   * screen shows, and a magnet: handoff has to survive that.
   */
  urls = $state('');

  show(prefill = '') {
    if (prefill) this.urls = this.urls ? `${this.urls}\n${prefill}` : prefill;
    this.open = true;
  }
}

export const addUi = new AddUi();

/** Pull `?magnet=...` (from the manifest's magnet: protocol handler) out of the URL. */
export function takeMagnetFromUrl(loc: Location, replace: (url: string) => void): string | null {
  const params = new URLSearchParams(loc.search);
  const magnet = params.get('magnet');
  if (magnet === null) return null;
  params.delete('magnet');
  const qs = params.toString();
  replace(loc.pathname + (qs ? `?${qs}` : '') + loc.hash);
  return magnet;
}
