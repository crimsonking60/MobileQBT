import { expect, test } from '@playwright/test';
import { login, mockActivity, SAMPLE, SHOTS } from './helpers';

test('detail view: tabs, file priority, back', async ({ page }) => {
  await mockActivity(page);
  await login(page);
  await expect(page.getByText('Sample.Show.S01').first()).toBeVisible();
  await page.getByText('Sample.Show.S01').first().click();
  await expect(page).toHaveURL(new RegExp(`#/torrent/${SAMPLE}/general`));
  await expect(page.getByText('/downloads/fixtures')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/detail-general.png` });

  await page.getByRole('tab', { name: 'Trackers' }).click();
  await expect(page.getByText('http://tracker.invalid/announce')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/detail-trackers.png` });

  await page.getByRole('tab', { name: 'Peers' }).click();
  await expect(page.getByText('203.0.113.7:51413')).toBeVisible();
  await expect(page.getByText('[2001:db8::5]:6881')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/detail-peers.png` });

  await page.getByRole('tab', { name: 'Files' }).click();
  await expect(page.getByText('e01.mkv')).toBeVisible(); // lone root folder auto-expanded
  await page.getByText('Extras').click();
  await expect(page.getByText('behind-the-scenes.mkv')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/detail-files.png` });

  const prio = page.getByRole('button', { name: 'Priority of readme.txt' });
  await prio.click();
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(prio).toHaveText('Skip');
  await prio.click();
  await page.getByRole('button', { name: /^Normal/ }).click(); // leave the fixture as we found it
  await expect(prio).toHaveText('Normal');

  await page.getByRole('tab', { name: 'Speed' }).click();
  await expect(page.getByText('Collecting samples')).toBeHidden({ timeout: 10_000 });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${SHOTS}/detail-speed.png` });

  await page.getByRole('button', { name: 'Back to list' }).click();
  await expect(page).not.toHaveURL(/torrent/);
  await expect(page.getByPlaceholder(/Search/)).toBeVisible();
});

test('deep link opens the detail view and Back falls to the list', async ({ page }) => {
  await login(page, `/#/torrent/${SAMPLE}/files`);
  await expect(page.getByRole('tab', { name: 'Files', selected: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to list' }).click();
  await expect(page.getByPlaceholder(/Search/)).toBeVisible();
});

test('unknown torrent shows a message', async ({ page }) => {
  await login(page, '/#/torrent/ffffffffffffffffffffffffffffffffffffffff');
  await expect(page.getByText('no longer exists')).toBeVisible();
});
