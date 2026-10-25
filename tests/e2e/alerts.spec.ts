import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { waitForServiceWorker } from './helpers';

// A real api.weather.gov response captured on 2026-10-25 (see scripts/data).
const fixture = readFileSync('src/features/alerts/fixtures/nws-active-HI.json', 'utf8');

test('alerts load live, then still show from the saved copy offline', async ({ page, context }) => {
  // Pin the clock before the fixture's alerts expire.
  await page.clock.setFixedTime(new Date('2026-10-25T12:00:00-10:00'));
  await context.route('https://api.weather.gov/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/geo+json', body: fixture }),
  );

  await page.goto('./#/alerts');
  await waitForServiceWorker(page);
  const list = page.getByRole('list', { name: 'Active alerts' });
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await expect(list.getByRole('heading', { name: 'Hydrologic Outlook' }).first()).toBeVisible();

  // Airplane mode. Drop the mock too, since Playwright routes still answer offline.
  await context.unrouteAll();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText(
      "Couldn't reach the National Weather Service. You're seeing the last saved copy.",
    ),
  ).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveCount(2);
});
