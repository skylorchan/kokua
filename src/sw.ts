/// <reference lib="webworker" />
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
  type PrecacheEntry,
} from 'workbox-precaching';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
  // Filled in at build time by vite-plugin-pwa with every file in dist/ (plus a hash
  // of each), so the whole app shell is downloaded and stored on first visit.
  __WB_MANIFEST: Array<PrecacheEntry | string>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Any page navigation (e.g. opening the installed app with no signal) gets the cached
// index.html, so the app opens even in airplane mode.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Map tiles: one ~5 MB PMTiles file that the map reads in small byte ranges. Precaching
// can't answer range requests, so we download the whole file once at install, keep it in
// its own cache, and slice ranges out of it (RangeRequestsPlugin).
const TILE_CACHE = 'kokua-tiles';
const TILES = new URL('tiles/oahu.pmtiles', self.registration.scope).href;
const TILES_META = new URL('tiles/oahu.json', self.registration.scope).href;

async function cacheTiles() {
  const cache = await caches.open(TILE_CACHE);
  try {
    const meta = await fetch(TILES_META, { cache: 'no-cache' });
    if (!meta.ok) return;
    const fresh = await meta.clone().text();
    const cached = await cache.match(TILES_META);
    // Skip the download if this exact tile build is already stored.
    if (cached && (await cached.text()) === fresh && (await cache.match(TILES))) return;
    const tiles = await fetch(TILES, { cache: 'no-cache' });
    if (tiles.status !== 200) return;
    await cache.put(TILES, tiles);
    await cache.put(TILES_META, meta);
  } catch {
    // Offline during install: the map works online and retries on the next update.
  }
}
self.addEventListener('install', (event) => event.waitUntil(cacheTiles()));

registerRoute(
  ({ url }) => url.href === TILES,
  new CacheFirst({
    cacheName: TILE_CACHE,
    plugins: [
      // Only a full 200 copy is ever stored; partial (206) network replies are passed through.
      new CacheableResponsePlugin({ statuses: [200] }),
      new RangeRequestsPlugin(),
    ],
  }),
);

// Take control of open tabs on first install so the page works offline right away.
clientsClaim();

// The "Reload" button in UpdatePrompt sends this to activate a waiting new version.
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});
