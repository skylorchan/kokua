import { expect, test } from '@playwright/test';
import { waitForServiceWorker, waitForTiles } from './helpers';

// Waikīkī Beach, inside the official Oʻahu tsunami evacuation zone.
const WAIKIKI = { latitude: 21.2764, longitude: -157.8268 };

test('zone check and refuge areas work from GPS in airplane mode', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation(WAIKIKI);

  await page.goto('./');
  await expect(page.getByText(/^Zones: Hawaiʻi Statewide GIS Program/)).toBeVisible();
  await waitForServiceWorker(page);

  await context.setOffline(true);
  await page.reload();

  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(
    page.getByRole('heading', { name: 'You are in a tsunami evacuation zone' }),
  ).toBeVisible();

  // The location carries over to the refuge areas tab.
  await page.getByRole('link', { name: 'Refuge areas' }).click();
  const list = page.getByRole('list', { name: 'Nearest places' });
  await expect(list.getByRole('listitem')).toHaveCount(5);
  await expect(list.getByRole('listitem').first()).toContainText('Hurricane refuge area');
});

test('map tiles are served from the device in airplane mode', async ({ page, context }) => {
  await page.goto('./');
  await waitForServiceWorker(page);
  await waitForTiles(page);

  await context.setOffline(true);
  await page.reload();

  // PMTiles reads byte ranges; the service worker must answer them from its cache.
  const res = await page.evaluate(async () => {
    const r = await fetch('tiles/oahu.pmtiles', { headers: { Range: 'bytes=0-6' } });
    return { status: r.status, magic: new TextDecoder().decode(await r.arrayBuffer()) };
  });
  expect(res).toEqual({ status: 206, magic: 'PMTiles' });

  // Tapping the map checks that spot. The map opens framed on all of Oʻahu, so its
  // centre is inland, outside every zone.
  const map = page.getByRole('region', { name: /Map of evacuation zones/ });
  await expect(map.locator('canvas')).toBeVisible();
  await page.waitForTimeout(1000); // let the style finish loading
  await map.click();
  await expect(page.getByText(/^Checking 21\.\d+, -15[78]\.\d+$/)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'You are outside the mapped tsunami evacuation zones' }),
  ).toBeVisible();
});

const LANGS = ['en', 'haw', 'ilo', 'tl', 'ja', 'zh-Hant', 'ko', 'vi'];

test('no screen is wider than the phone, in any language', async ({ page }) => {
  for (const lang of LANGS) {
    await page.addInitScript((l) => localStorage.setItem('kokua.language', l), lang);
    for (const path of ['./', './#/places', './#/alerts', './#/plan']) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForTimeout(200);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${lang} ${path}`).toBe(0);
    }
  }
});
