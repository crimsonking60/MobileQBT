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

test('tablet: the split can be resized and the width is remembered', async ({ page }) => {
  await login(page);
  const list = page.locator('aside');
  const handle = page.getByRole('separator', { name: 'Resize list' });
  const width = async () => (await list.boundingBox())!.width;

  const before = await width();
  const box = (await handle.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(before + 150, y, { steps: 5 });
  await page.mouse.up();
  expect(await width()).toBeGreaterThan(before + 100);

  // keyboard
  const afterDrag = await width();
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  expect(await width()).toBeLessThan(afterDrag);

  // clamped: dragging far left stops at the minimum
  const b2 = (await handle.boundingBox())!;
  await page.mouse.move(b2.x + b2.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(10, y, { steps: 5 });
  await page.mouse.up();
  expect(await width()).toBe(320);

  // survives a reload; double-click resets
  await page.reload();
  await expect(page.getByPlaceholder(/Search/)).toBeVisible();
  expect(await width()).toBe(320);
  await handle.dblclick();
  expect(await width()).toBe(416);
  await page.screenshot({ path: `${SHOTS}/split-reset.png` });
});
