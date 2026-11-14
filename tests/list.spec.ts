import { expect, test } from '@playwright/test';

test('login, list, select', async ({ page }, info) => {
  await page.goto('/');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText(/Wrong username/);

  await page.getByLabel('Password').fill('mobileqbt-dev');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Test.Torrent.Number.1')).toBeVisible();
  await page.screenshot({ path: process.env.SHOTS + '/list.png' });

  // search narrows the list
  await page.getByPlaceholder(/Search/).fill('Number.3');
  await expect(page.getByText('Test.Torrent.Number.1')).toBeHidden();
  await page.getByPlaceholder(/Search/).fill('');

  // long-press enters selection mode
  const row = page.getByText('Test.Torrent.Number.2');
  const box = (await row.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 5);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.up();
  await expect(page.getByText('1 selected').first()).toBeVisible();
  await page.screenshot({ path: process.env.SHOTS + '/select.png' });

  await page.getByRole('button', { name: /Filter/ }).isHidden();
  await page.getByRole('button', { name: 'Cancel selection' }).click();
  await page.getByRole('button', { name: 'Filter and sort' }).click();
  await page.getByRole('button', { name: /^tv/ }).click();
  await page.screenshot({ path: process.env.SHOTS + '/filter.png' });
});
