import { expect, test, type Page } from '@playwright/test';
import { login, openMenuItem, SHOTS } from './helpers';

// The dev qBittorrent's search subsystem is not usable offline, so the search API is mocked here;
// scripts/search-fixture holds a plugin for trying the screens against a qBittorrent that can run one.

const result = (i: number, extra = {}) => ({
  fileName: `Paul Halpern - Book ${i}`, fileUrl: `magnet:?xt=urn:btih:${String(i).repeat(40).slice(0, 40)}`,
  fileSize: i * 10_000_000, nbSeeders: 100 - i * 10, nbLeechers: i, siteUrl: 'http://books.example', descrLink: `http://books.example/${i}`,
  pubDate: 1_700_000_000 + i * 86400, ...extra,
});

async function mockSearch(page: Page) {
  const calls: { path: string; body: string }[] = [];
  let plugins = [{
    name: 'books', fullName: 'Books Site', enabled: true, version: '1.2', url: 'http://books.example',
    supportedCategories: [{ id: 'all', name: 'All categories' }, { id: 'books', name: 'Books' }],
  }];
  let polls = 0;

  await page.route('**/api/v2/search/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^.*\/search\//, '');
    const body = req.postData() ?? '';
    calls.push({ path, body });
    const params = new URLSearchParams(body);
    switch (path) {
      case 'plugins': return route.fulfill({ json: plugins });
      case 'status': return route.fulfill({ json: [] });
      case 'start': return route.fulfill({ json: { id: 7 } });
      case 'results': {
        // first poll: the search is still running and has found two; second: finished with four
        polls++;
        const all = [1, 2, 3, 4].map((i) => result(i));
        if (polls === 1) return route.fulfill({ json: { results: all.slice(0, 2), status: 'Running', total: 2 } });
        const offset = Number(new URL(req.url()).searchParams.get('offset'));
        return route.fulfill({ json: { results: all.slice(offset), status: 'Stopped', total: 4 } });
      }
      case 'enablePlugin':
        plugins = plugins.map((p) => (params.get('names') === p.name ? { ...p, enabled: params.get('enable') === 'true' } : p));
        return route.fulfill({ body: '' });
      case 'installPlugin':
        plugins = [...plugins, { name: 'more', fullName: 'More Site', enabled: true, version: '1.0', url: 'http://more.example', supportedCategories: [{ id: 'all', name: 'All categories' }, { id: 'movies', name: 'Movies' }] }];
        return route.fulfill({ body: '' });
      case 'uninstallPlugin':
        plugins = plugins.filter((p) => p.name !== params.get('names'));
        return route.fulfill({ body: '' });
      default: return route.fulfill({ body: '' });
    }
  });
  return calls;
}

test('search: results arrive, can be filtered, sorted and added', async ({ page }) => {
  const calls = await mockSearch(page);
  await login(page);
  await openMenuItem(page, 'Search');
  await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();
  await expect(page.getByText('Type something to look for.')).toBeVisible();

  await page.getByLabel('Search query').fill('paul halpern');
  await page.getByLabel('Category').selectOption('books');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  // started with what was typed, then the partial and the final results show up
  await expect(page.getByText('Paul Halpern - Book 4')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('4 results for “paul halpern”')).toBeVisible();
  const start = new URLSearchParams(calls.find((c) => c.path === 'start')!.body);
  expect(Object.fromEntries(start)).toEqual({ pattern: 'paul halpern', category: 'books', plugins: 'enabled' });
  await page.screenshot({ path: `${SHOTS}/search.png` });

  // most seeders first; the job is released on the server once it is done
  const names = () => page.locator('li button .line-clamp-2').allTextContents();
  expect(await names()).toEqual(['Paul Halpern - Book 1', 'Paul Halpern - Book 2', 'Paul Halpern - Book 3', 'Paul Halpern - Book 4']);
  await expect.poll(() => calls.some((c) => c.path === 'delete' && c.body.includes('id=7'))).toBe(true);

  await page.getByRole('button', { name: 'Size' }).click();
  expect((await names())[0]).toBe('Paul Halpern - Book 4');
  await page.getByRole('button', { name: 'Descending' }).click();
  expect((await names())[0]).toBe('Paul Halpern - Book 1');

  await page.getByLabel('Filter results').fill('book 3');
  expect(await names()).toEqual(['Paul Halpern - Book 3']);

  // a result opens its details, and a magnet goes to the add sheet
  await page.getByText('Paul Halpern - Book 3').click();
  const dlg = page.getByRole('dialog');
  await expect(dlg.getByText('Seeders')).toBeVisible();
  await expect(dlg.getByRole('link', { name: 'Open on the site' })).toHaveAttribute('href', 'http://books.example/3');
  await dlg.getByRole('button', { name: 'Add torrent…' }).click();
  await expect(page.getByLabel('Magnet links or URLs (one per line)')).toHaveValue(/^magnet:\?xt=urn:btih:3{40}/);
});

test('search: plugins can be enabled, installed and removed', async ({ page }) => {
  const calls = await mockSearch(page);
  await login(page);
  await openMenuItem(page, 'Search');
  await page.getByRole('tab', { name: 'Plugins' }).click();
  await expect(page.getByText('Books Site')).toBeVisible();

  await page.getByRole('switch', { name: 'Enable Books Site' }).uncheck();
  await expect.poll(() => calls.find((c) => c.path === 'enablePlugin')?.body).toContain('enable=false');

  await page.getByRole('button', { name: 'Install plugin' }).click();
  await page.getByLabel('Plugin sources').fill('https://example.com/more.py');
  await page.getByRole('dialog').getByRole('button', { name: 'Install', exact: true }).click();
  await expect(page.getByText('More Site')).toBeVisible();
  expect(new URLSearchParams(calls.find((c) => c.path === 'installPlugin')!.body).get('sources')).toBe('https://example.com/more.py');

  await page.getByRole('button', { name: 'Uninstall More Site' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByText('More Site', { exact: true })).toBeHidden();

  // back goes to the list
  await page.getByRole('button', { name: 'Back to torrents' }).click();
  await expect(page.getByPlaceholder(/Search \d+ torrents/)).toBeVisible();
});
