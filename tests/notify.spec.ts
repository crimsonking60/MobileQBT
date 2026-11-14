import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('enabling notifications announces a finished download', async ({ page, context }) => {
  // headless Chromium reports 'denied' regardless of grants, so fake a granted permission
  await context.addInitScript(() => {
    Object.defineProperty(Notification, 'permission', { get: () => 'granted' });
  });
  let hash = '';
  let finish = false;
  await page.route('**/sync/maindata*', async (route) => {
    const res = await route.fetch();
    if (!res.ok()) return route.fulfill({ response: res });
    const j = await res.json();
    for (const [h, t] of Object.entries<{ name?: string }>(j.torrents ?? {})) if (t.name === 'Partial.Pack') hash = h;
    if (finish && hash) j.torrents = { ...(j.torrents ?? {}), [hash]: { ...(j.torrents?.[hash] ?? {}), progress: 1 } };
    await route.fulfill({ response: res, json: j });
  });

  await login(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  const box = page.getByRole('dialog').last().getByLabel('Notify on finish or error');
  await box.check();
  await expect(box).toBeChecked();
  await page.keyboard.press('Escape');

  finish = true;
  await expect(page.getByText('Download complete: Partial.Pack')).toBeVisible({ timeout: 8000 });

  // turn it back off so later tests start clean
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('dialog').last().getByLabel('Notify on finish or error').uncheck();
});
