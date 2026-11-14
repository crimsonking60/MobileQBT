import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('magnet handoff opens the add sheet prefilled and cleans the url', async ({ page }) => {
  const magnet = 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&dn=handoff';
  await page.goto(`/?magnet=${encodeURIComponent(magnet)}`);
  await page.getByLabel('Password').fill('mobileqbt-dev');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByLabel(/Magnet links/)).toHaveValue(magnet);
  expect(page.url()).not.toContain('magnet=');
});

test('manifest is valid and its icons load', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  const res = await request.get(new URL(href!, page.url()).href);
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.display).toBe('standalone');
  expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const icon of m.icons) {
    const r = await request.get(new URL(icon.src, new URL(href!, page.url())).href);
    expect(r.ok(), icon.src).toBe(true);
  }
});

// the service worker is only registered in production builds
test('service worker installs and never caches the API', async ({ page }) => {
  test.skip(!process.env.E2E_BASE_URL, 'needs a production build (set E2E_BASE_URL)');
  await login(page);
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/$/);
  await page.reload();
  await expect(page.getByPlaceholder(/Search/)).toBeVisible();
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) urls.push(new URL(r.url).pathname);
    return urls;
  });
  expect(cached.length).toBeGreaterThan(0);
  expect(cached.filter((u) => u.includes('/api/'))).toEqual([]);
});
