import { createHash, randomBytes } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { login, SHOTS } from './helpers';

/** Minimal single-file .torrent with random content so every run is a new torrent. */
function makeTorrent(name: string): Buffer {
  const data = randomBytes(20_000);
  const pieces = Buffer.concat([0, 16384].map((o) => createHash('sha1').update(data.subarray(o, o + 16384)).digest()));
  const b = (s: string | Buffer) => Buffer.concat([Buffer.from(`${Buffer.byteLength(s)}:`), Buffer.from(s)]);
  return Buffer.concat([
    Buffer.from('d8:announce'), b('http://tracker.invalid/announce'),
    Buffer.from('4:infod6:lengthi20000e4:name'), b(name),
    Buffer.from('12:piece lengthi16384e6:pieces'), b(pieces), Buffer.from('ee'),
  ]);
}

test('add a magnet link and a .torrent file', async ({ page }) => {
  const id = randomBytes(4).toString('hex');
  const fileName = `e2e-file-${id}`;
  const magnetName = `e2e-magnet-${id}`;
  const magnet = `magnet:?xt=urn:btih:${randomBytes(20).toString('hex')}&dn=${magnetName}`;

  await login(page);
  await page.getByRole('button', { name: 'Add torrent' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add torrents' });
  const submit = dialog.getByRole('button', { name: /^Add (\d+ )?torrents?$/ });
  await expect(submit).toBeDisabled(); // nothing to add yet

  await page.getByLabel(/Magnet links/).fill(magnet);
  await page.getByLabel('Torrent files').setInputFiles({
    name: `${fileName}.torrent`, mimeType: 'application/x-bittorrent', buffer: makeTorrent(fileName),
  });
  await page.getByLabel('Category').selectOption('tv');
  await expect(dialog.getByRole('button', { name: 'Add 2 torrents' })).toBeEnabled();
  await page.waitForTimeout(400); // let the sheet finish sliding in
  await page.screenshot({ path: `${SHOTS}/add.png` });
  await dialog.getByRole('button', { name: 'Add 2 torrents' }).click();

  await expect(page.getByRole('status')).toHaveText('Added 2 torrents');
  await expect(page.getByText(fileName).first()).toBeVisible();
  await expect(page.getByText(magnetName).first()).toBeVisible();

  // clean up the torrents we created
  const info = await (await page.request.get('/api/v2/torrents/info')).json();
  const mine = info.filter((t: { name: string }) => t.name.includes(id)).map((t: { hash: string }) => t.hash);
  expect(mine).toHaveLength(2);
  await page.request.post('/api/v2/torrents/delete', { form: { hashes: mine.join('|'), deleteFiles: 'true' } });
});

test('a bad magnet shows an error and keeps the sheet open', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Add torrent' }).click();
  await page.getByLabel(/Magnet links/).fill('definitely not a magnet');
  await page.getByRole('dialog').getByRole('button', { name: 'Add torrent', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByLabel(/Magnet links/)).toBeVisible();
});
