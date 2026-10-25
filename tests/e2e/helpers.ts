import type { Page } from '@playwright/test';

/** Wait until the service worker has installed, cached the app, and controls the page. */
export async function waitForServiceWorker(page: Page) {
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active !== null && navigator.serviceWorker.controller !== null;
  });
}

/** Wait until the service worker has stored the full map tile file. */
export async function waitForTiles(page: Page) {
  await page.waitForFunction(
    async () => {
      const cache = await caches.open('kokua-tiles');
      return (await cache.keys()).some((r) => r.url.endsWith('tiles/oahu.pmtiles'));
    },
    undefined,
    { timeout: 30_000 },
  );
}
