export interface Sample { t: number; down: number; up: number }

/** Rolling speed samples for one torrent, collected while its detail view is open. */
export class SpeedHistory {
  samples = $state<Sample[]>([]);
  constructor(private max = 150) {}

  push(down: number, up: number, now = Date.now()) {
    const last = this.samples.at(-1);
    if (last && now - last.t < 1000) return; // refresh() bursts shouldn't skew the time axis
    this.samples = [...this.samples, { t: now, down, up }].slice(-this.max);
  }
}
