import { expect, type Page } from '@playwright/test';

export const SHOTS = process.env.SHOTS ?? 'test-results/shots';

/** Infohash of the seeded fixture torrent "Sample.Show.S01" (created by scripts/seed-dev.py). */
export const SAMPLE = 'a6b4d2642db91e8751d0a8a1b6951778bea22421';

export async function login(page: Page, path = '/') {
  await page.goto(path);
  await page.getByLabel('Password').fill('mobileqbt-dev');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByLabel('Password')).toBeHidden();
}

/** Fake a busy swarm: a moving speed for the sample torrent, plus two peers. */
export async function mockActivity(page: Page) {
  await page.route('**/sync/maindata*', async (route) => {
    const res = await route.fetch();
    if (!res.ok()) return route.fulfill({ response: res }); // e.g. 401 before login
    const j = await res.json();
    const t = Date.now() / 1000;
    j.torrents = {
      ...(j.torrents ?? {}),
      [SAMPLE]: {
        ...(j.torrents?.[SAMPLE] ?? {}),
        dlspeed: Math.round(900_000 + 600_000 * Math.sin(t / 3)),
        upspeed: Math.round(250_000 + 150_000 * Math.sin(t / 2 + 1)),
      },
    };
    await route.fulfill({ response: res, json: j });
  });
  await page.route('**/sync/torrentPeers*', (route) =>
    route.fulfill({
      json: {
        rid: 1, full_update: true, show_flags: true,
        peers: {
          '203.0.113.7:51413': {
            client: 'qBittorrent/5.0.1', connection: 'BT', country: 'Sweden', country_code: 'SE',
            dl_speed: 420_000, up_speed: 12_000, downloaded: 52_000_000, uploaded: 1_200_000,
            flags: 'D K E I', flags_desc: '', files: '', ip: '203.0.113.7', port: 51413, progress: 1, relevance: 1,
          },
          '2001:db8::5:6881': {
            client: 'Transmission 4.0.5', connection: 'uTP', country: 'Germany', country_code: 'DE',
            dl_speed: 0, up_speed: 88_000, downloaded: 0, uploaded: 9_000_000,
            flags: 'U', flags_desc: '', files: '', ip: '2001:db8::5', port: 6881, progress: 0.42, relevance: 0.4,
          },
        },
      },
    }),
  );
}
