import { expect, test } from '@playwright/test';
import { login, mockActivity, SAMPLE, SHOTS } from './helpers';

test.use({ colorScheme: 'dark' });

// not an assertion-heavy test: it produces screenshots for eyeballing dark mode
test('dark mode renders', async ({ page }) => {
  await mockActivity(page);
  await login(page);
  await expect(page.getByText('Sample.Show.S01').first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/dark-list.png` });
  await page.getByRole('button', { name: 'Add torrent' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/dark-add.png` });
  await page.keyboard.press('Escape');
  await page.goto(`/#/torrent/${SAMPLE}/speed`);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${SHOTS}/dark-speed.png` });
  await page.getByRole('tab', { name: 'Files' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/dark-files.png` });
});
