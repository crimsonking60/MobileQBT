import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('edit and restore a speed limit', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  const dlg = page.getByRole('dialog').last();
  const field = dlg.getByLabel('Download limit', { exact: true });
  await expect(field).toBeVisible();
  const before = await field.inputValue();
  const save = dlg.getByRole('button', { name: 'Save' });
  await expect(save).toBeDisabled();

  await field.fill('1234');
  await save.click();
  await expect(page.getByText('Settings saved')).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  const again = page.getByRole('dialog').last().getByLabel('Download limit', { exact: true });
  await expect(again).toHaveValue('1234');
  await again.fill(before);
  await page.getByRole('dialog').last().getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Settings saved')).toBeVisible();
});
