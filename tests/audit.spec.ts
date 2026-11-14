import { expect, test, type Page } from '@playwright/test';
import { login, mockActivity, openMenuItem, SAMPLE } from './helpers';

// Not part of the normal run: AUDIT=1 npx playwright test audit
// Writes test-results/audit/<project>-<scheme>/NN-name.png for eyeballing every screen.
test.skip(!process.env.AUDIT, 'visual audit only');

const FEED = 'http://rss-fixture/feed.xml';

for (const scheme of ['light', 'dark'] as const) {
  test.describe(scheme, () => {
    test.use({ colorScheme: scheme });

    test(`audit ${scheme}`, async ({ page, request }, info) => {
      test.setTimeout(90_000);
      const dir = `test-results/audit/${info.project.name}-${scheme}`;
      let n = 0;
      const shot = async (name: string) => {
        await page.waitForTimeout(350); // let sheet/transition animations settle
        await page.screenshot({ path: `${dir}/${String(++n).padStart(2, '0')}-${name}.png` });
      };
      const wide = () => (page.viewportSize()?.width ?? 0) >= 768;
      const closeSheet = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); };

      await mockActivity(page);
      await page.goto('/');
      await shot('login');
      await login(page);
      await expect(page.getByText('Sample.Show.S01').first()).toBeVisible();
      await shot('list');

      // selection mode via long press
      const row = page.getByText('Partial.Pack').first();
      const box = (await row.boundingBox())!;
      await page.mouse.move(box.x + 20, box.y + 5);
      await page.mouse.down();
      await page.waitForTimeout(600);
      await page.mouse.up();
      await shot('selection');
      await page.getByRole('button', { name: 'More' }).click();
      await shot('selection-more');
      await closeSheet();
      await page.getByRole('button', { name: 'Cancel selection' }).click();

      await page.getByRole('button', { name: 'Filter and sort' }).click();
      await shot('filter');
      await page.getByRole('button', { name: /Manage categories/ }).click();
      await shot('manage');
      await closeSheet(); await closeSheet();

      await page.getByRole('button', { name: 'Menu' }).click();
      await shot('menu');
      await page.getByRole('dialog').last().getByRole('button', { name: 'Settings', exact: true }).click();
      await expect(page.getByLabel('Download limit', { exact: true })).toBeVisible();
      await shot('settings');
      await page.getByRole('dialog').last().getByLabel('Enable schedule').check().catch(() => {});
      await page.getByRole('dialog').last().evaluate((el) => el.querySelector('.overflow-y-auto')?.scrollTo(0, 99999));
      await shot('settings-bottom');
      await closeSheet();

      await page.getByRole('button', { name: 'Add torrent' }).click();
      await shot('add');
      await closeSheet();

      if (wide()) {
        await page.keyboard.press('?');
        await shot('shortcuts');
        await closeSheet();
      }

      // detail
      await page.goto(`/#/torrent/${SAMPLE}/general`);
      await page.waitForTimeout(800);
      await shot('detail-general');
      for (const tab of ['Trackers', 'Peers', 'Files']) {
        await page.getByRole('tab', { name: tab }).click();
        await page.waitForTimeout(500);
        await shot(`detail-${tab.toLowerCase()}`);
      }
      await page.getByRole('tab', { name: 'Speed' }).click();
      await page.waitForTimeout(6000);
      await shot('detail-speed');
      await page.getByRole('tab', { name: 'General' }).click();
      await page.getByRole('button', { name: 'Edit category' }).click();
      await shot('detail-category');
      await closeSheet();
      await page.getByRole('button', { name: 'More actions' }).click();
      await shot('detail-more');
      await closeSheet();
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await shot('detail-delete');
      await closeSheet();

      // rss (needs the rss-fixture service)
      const name = `audit-${scheme}`;
      await page.goto('/');
      await expect(page.getByPlaceholder(/Search/)).toBeVisible();
      await openMenuItem(page, 'RSS');
      await page.getByRole('tab', { name: 'Feeds' }).click();
      await page.getByRole('button', { name: 'Add feed' }).first().click();
      await page.getByRole('dialog').last().getByLabel('Feed URL').fill(FEED);
      await page.getByRole('dialog').last().getByLabel('Feed name').fill(name);
      await shot('rss-add-feed');
      await page.getByRole('dialog').last().getByRole('button', { name: 'Add feed' }).click();
      await expect(page.getByRole('button', { name: `Edit feed ${name}` })).toBeVisible();
      await shot('rss-feeds');
      await page.getByRole('tab', { name: /Articles/ }).click();
      await expect(page.getByText('Show.Alpha.S01E01.1080p.WEB-DL')).toBeVisible({ timeout: 15000 });
      await shot('rss-articles');
      await page.getByText('Show.Beta.S02E05.720p.HDTV').click();
      await shot('rss-article');
      await closeSheet();
      await page.getByRole('tab', { name: 'Rules' }).click();
      await page.getByRole('button', { name: 'Add rule' }).click();
      const rule = page.getByRole('dialog').last();
      await rule.getByLabel('Rule name').fill(`${name}-rule`);
      await rule.getByLabel('Must contain').fill('Alpha');
      await rule.getByRole('checkbox', { name }).check();
      await rule.getByRole('button', { name: 'Preview matches' }).click();
      await expect(rule.getByText('2 matching articles')).toBeVisible();
      await shot('rss-rule');
      await rule.getByRole('button', { name: 'Save', exact: true }).click();
      await shot('rss-rules');

      // cleanup
      await cleanup(page, name);
    });
  });
}

async function cleanup(page: Page, name: string) {
  for (const [path, body] of [
    ['rss/removeRule', { ruleName: `${name}-rule` }],
    ['rss/removeItem', { path: name }],
  ] as const) {
    await page.evaluate(([p, b]) => fetch(`api/v2/${p}`, { method: 'POST', body: new URLSearchParams(b) }), [path, body] as [string, Record<string, string>]);
  }
}
