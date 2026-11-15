import { expect, test } from '@playwright/test';
import { login } from './helpers';

/** `n` fake seeding torrents, merged into the real maindata so the list is long. */
async function mockBigLibrary(page: import('@playwright/test').Page, n: number) {
  await page.route('**/sync/maindata*', async (route) => {
    const res = await route.fetch();
    if (!res.ok()) return route.fulfill({ response: res });
    const j = await res.json();
    if (j.full_update) {
      const torrents: Record<string, unknown> = { ...j.torrents };
      for (let i = 0; i < n; i++) {
        torrents[i.toString(16).padStart(40, '0')] = {
          name: `Book.${String(i).padStart(5, '0')}`, state: 'stalledUP', progress: 1, size: 5e6, total_size: 5e6,
          added_on: 1_700_000_000 + i, category: '', tags: '', dlspeed: 0, upspeed: 0, ratio: 1.2, eta: 8640000,
          num_seeds: 0, num_leechs: 0, save_path: '/books', amount_left: 0, completion_on: 1_700_000_100 + i,
        };
      }
      j.torrents = torrents;
    }
    await route.fulfill({ response: res, json: j });
  });
}

test('tablet: opening a torrent keeps the list scroll position', async ({ page }) => {
  await mockBigLibrary(page, 6000);
  await login(page);
  const scroller = page.locator('aside .overflow-y-auto');
  await expect(page.getByText('Select a torrent')).toBeVisible();

  await scroller.evaluate((el) => { el.scrollTop = 200_000; });
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBe(200_000);

  // a row that is actually on screen (the slice also renders overscan rows above and below)
  const pick = () => scroller.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const btn = [...el.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().top > r.top + 100)[2];
    const q = btn.getBoundingClientRect();
    return { name: btn.textContent!.slice(0, 10), x: q.x + 20, y: q.y + 20 };
  });
  const target = await pick();
  await page.mouse.click(target.x, target.y); // no auto-scroll, like a finger
  await expect(page).toHaveURL(/#\/torrent\//);
  await page.waitForTimeout(2500); // let a couple of polls land
  expect(await scroller.evaluate((el) => el.scrollTop)).toBe(200_000);
});
