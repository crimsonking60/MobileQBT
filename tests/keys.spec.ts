import { expect, test } from '@playwright/test';
import { login, SHOTS } from './helpers';

test.use({ hasTouch: false });

test('keyboard: navigate, select, open, tabs, help', async ({ page }) => {
  await login(page);
  await page.keyboard.press('j');
  await page.keyboard.press('j');
  // second row (Sample.Show.S01 sorted by date added desc may vary) - just assert one ring exists and moves
  const rows = page.locator('button.ring-2');
  await expect(rows).toHaveCount(1);
  const first = await rows.innerText();
  await page.keyboard.press('j');
  expect(await rows.innerText()).not.toBe(first);
  await page.keyboard.press('k');
  expect(await rows.innerText()).toBe(first);

  await page.keyboard.press('x');
  await expect(page.getByText('1 selected')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('1 selected')).toBeHidden();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab', { name: 'General', selected: true })).toBeVisible();
  await page.keyboard.press('4');
  await expect(page.getByRole('tab', { name: 'Files', selected: true })).toBeVisible();

  await page.keyboard.press('t');
  await expect(page.getByRole('dialog').last().getByText('Category & tags')).toBeVisible();
  await page.keyboard.press('Escape'); // dialog open: shortcuts are suspended, the sheet closes itself
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Files', selected: true })).toBeVisible(); // detail stayed open

  await page.keyboard.press('?');
  await expect(page.getByRole('dialog').last().getByText('Keyboard shortcuts')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/shortcuts-help.png` });
});

test('keyboard: typing in search does not trigger shortcuts', async ({ page }) => {
  await login(page);
  await page.keyboard.press('/');
  await page.keyboard.type('sjxn');
  await expect(page.getByPlaceholder(/Search/)).toHaveValue('sjxn');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
