import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('create, edit and delete a category and a tag', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: /filter/i }).click();
  await page.getByRole('button', { name: /manage categories/i }).click();
  const dlg = page.getByRole('dialog').last();

  await dlg.getByLabel('Category name').fill('e2e-cat');
  await dlg.getByLabel('Category save path').fill('/downloads/e2e');
  await dlg.getByRole('button', { name: 'Add category' }).click();
  await expect(dlg.getByText('/downloads/e2e')).toBeVisible();

  await dlg.getByRole('button', { name: 'Edit e2e-cat' }).click();
  await dlg.getByLabel('Category save path').fill('/downloads/e2e2');
  await dlg.getByRole('button', { name: 'Save category' }).click();
  await expect(dlg.getByText('/downloads/e2e2')).toBeVisible();

  await dlg.getByRole('button', { name: 'Delete category e2e-cat' }).click();
  await expect(dlg.getByText('e2e-cat')).toBeHidden();

  await dlg.getByLabel('New tag').fill('e2e-tag');
  await dlg.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(dlg.getByText('e2e-tag')).toBeVisible();
  await dlg.getByRole('button', { name: 'Delete tag e2e-tag' }).click();
  await expect(dlg.getByText('e2e-tag')).toBeHidden();
});
