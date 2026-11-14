import { expect, test } from '@playwright/test';
import { login, SAMPLE, SHOTS } from './helpers';

test('tablet: list and detail side by side', async ({ page }) => {
  await login(page);
  await expect(page.getByText('Select a torrent')).toBeVisible();
  await expect(page.getByText('Sample.Show.S01').first()).toBeVisible();
  await page.getByText('Sample.Show.S01').first().click();
  await expect(page.getByRole('tab', { name: 'General', selected: true })).toBeVisible();
  // the list stays visible and keeps its search box
  await expect(page.getByPlaceholder(/Search/)).toBeVisible();
  await expect(page).toHaveURL(new RegExp(SAMPLE));
  await page.screenshot({ path: `${SHOTS}/wide.png` });
});
