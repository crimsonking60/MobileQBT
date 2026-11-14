/** True on tablet-and-up widths, where list and detail show side by side. */
class Media {
  wide = $state(false);

  constructor() {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(min-width: 768px)');
    this.wide = mq.matches;
    mq.addEventListener('change', (e) => (this.wide = e.matches));
  }
}

export const media = new Media();
