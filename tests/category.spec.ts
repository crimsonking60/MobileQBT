import { expect, test } from '@playwright/test';
import { login, SAMPLE, SHOTS } from './helpers';

test('set category and tag from the General tab', async ({ page }) => {
  await login(page, `/#/torrent/${SAMPLE}/general`);
  await page.getByRole('button', { name: 'Edit category' }).click();
  const dlg = page.getByRole('dialog').last();

  // start from a known state
  await dlg.getByRole('button', { name: 'None', exact: true }).click();
  await expect(dlg.getByRole('button', { name: 'None', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await dlg.getByRole('button', { name: 'tv', exact: true }).click();
  await expect(dlg.getByRole('button', { name: 'tv', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Category: tv')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/category-sheet.png` });

  // the sheet stays open and the row behind it updates
  await expect(dlg).toBeVisible();
  await dlg.getByLabel('New tag').fill('e2e-tag');
  await dlg.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(dlg.getByRole('button', { name: 'e2e-tag' })).toHaveAttribute('aria-pressed', 'true');
  await dlg.getByRole('button', { name: 'e2e-tag' }).click();
  await expect(dlg.getByRole('button', { name: 'e2e-tag' })).toHaveAttribute('aria-pressed', 'false');

  await dlg.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: 'Edit category' })).toContainText('tv');

  // the tag stays defined after being removed from the torrent; clean it up
  await page.evaluate(() => fetch('api/v2/torrents/deleteTags', { method: 'POST', body: new URLSearchParams({ tags: 'e2e-tag' }) }));
});
