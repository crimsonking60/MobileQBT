import { expect, test } from '@playwright/test';
import { login, openMenuItem, SHOTS } from './helpers';

// needs the rss-fixture service from docker-compose.yml (http://rss-fixture/feed.xml)
const FEED = 'http://rss-fixture/feed.xml';
const NAME = 'e2e-feed';
const RULE = 'e2e-rule';

test.describe.configure({ mode: 'serial' });

test.afterAll(async ({ request }) => {
  // best effort cleanup in case a step failed midway; needs a session
  await request.post('/api/v2/auth/login', { form: { username: 'admin', password: 'mobileqbt-dev' } });
  await request.post('/api/v2/rss/removeItem', { form: { path: NAME } });
  await request.post('/api/v2/rss/removeRule', { form: { ruleName: RULE } });
  await request.post('/api/v2/rss/removeRule', { form: { ruleName: `${RULE}-renamed` } });
});

test('feeds, articles and rules', async ({ page }) => {
  await login(page);
  await openMenuItem(page, 'RSS');
  await expect(page.getByRole('heading', { name: 'RSS' })).toBeVisible();

  // add a feed
  await page.getByRole('tab', { name: 'Feeds' }).click();
  await page.getByRole('button', { name: 'Add feed' }).first().click();
  const dlg = page.getByRole('dialog').last();
  await dlg.getByLabel('Feed URL').fill(FEED);
  await dlg.getByLabel('Feed name').fill(NAME);
  await dlg.getByRole('button', { name: 'Add feed' }).click();
  await expect(page.getByRole('button', { name: `Edit feed ${NAME}` })).toBeVisible();

  // articles arrive after qBittorrent fetches the feed
  await page.getByRole('tab', { name: /Articles/ }).click();
  await expect(page.getByText('Show.Alpha.S01E01.1080p.WEB-DL')).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: `${SHOTS}/rss-articles.png` });

  // opening an article shows details and marks it read; Download opens the add sheet prefilled
  await page.getByText('Show.Beta.S02E05.720p.HDTV').click();
  const art = page.getByRole('dialog').last();
  await expect(art.getByText('Description for Show.Beta.S02E05.720p.HDTV')).toBeVisible();
  await art.getByRole('button', { name: 'Download…' }).click();
  await expect(page.getByLabel(/Magnet links/)).toHaveValue(/btih:b5b5/);
  await page.keyboard.press('Escape');

  // mark all read
  await page.getByRole('button', { name: 'Mark all read' }).click();
  await expect(page.getByRole('button', { name: 'Mark all read' })).toBeDisabled();

  // rule: create, preview, rename, toggle, delete
  await page.getByRole('tab', { name: 'Rules' }).click();
  await page.getByRole('button', { name: 'Add rule' }).click();
  const rule = page.getByRole('dialog').last();
  await rule.getByLabel('Rule name').fill(RULE);
  await rule.getByLabel('Must contain').fill('Alpha');
  await rule.getByRole('checkbox', { name: NAME }).check();
  await rule.getByRole('button', { name: 'Preview matches' }).click();
  await expect(rule.getByText('2 matching articles')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/rss-rule.png` });
  await rule.getByLabel('Rule name').fill(`${RULE}-renamed`);
  await rule.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: `Edit rule ${RULE}-renamed` })).toBeVisible();

  const sw = page.getByRole('switch', { name: `Enable ${RULE}-renamed` });
  await expect(sw).toBeChecked();
  await sw.uncheck();
  await expect(sw).not.toBeChecked();

  await page.getByRole('button', { name: `Edit rule ${RULE}-renamed` }).click();
  await page.getByRole('dialog').last().getByRole('button', { name: 'Delete rule…' }).click();
  await page.getByRole('dialog').last().getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('button', { name: `Edit rule ${RULE}-renamed` })).toBeHidden();

  // remove the feed
  await page.getByRole('tab', { name: 'Feeds' }).click();
  await page.getByRole('button', { name: `Edit feed ${NAME}` }).click();
  await page.getByRole('dialog').last().getByRole('button', { name: 'Remove feed…' }).click();
  await page.getByRole('dialog').last().getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByRole('button', { name: `Edit feed ${NAME}` })).toBeHidden();

  // back to the list
  await page.getByRole('button', { name: 'Back to torrents' }).click();
  await expect(page.getByPlaceholder(/Search/)).toBeVisible();
});
