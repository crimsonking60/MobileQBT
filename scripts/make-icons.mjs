// Renders public/icon.svg to the PNG icons the manifest needs. Run: node scripts/make-icons.mjs
// (uses Playwright's Chromium; the PNGs are committed, so this only reruns if the icon changes)
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync('public/icon.svg', 'utf8');
const square = svg.replace(' rx="112"', ''); // maskable / apple-touch: full-bleed, the OS applies the shape
const jobs = [
  ['public/icons/icon-192.png', svg, 192],
  ['public/icons/icon-512.png', svg, 512],
  ['public/icons/icon-maskable-512.png', square, 512],
  ['public/icons/apple-touch-icon.png', square, 180],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [out, markup, size] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0">${markup.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
  await page.screenshot({ path: out, omitBackground: true });
  console.log('wrote', out);
}
await browser.close();
