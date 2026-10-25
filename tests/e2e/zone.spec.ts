import { expect, test } from '@playwright/test';

// A point inside "SAMPLE coastal zone 1" in public/data/zones.geojson (demo data).
const IN_SAMPLE_ZONE = { latitude: 21.277, longitude: -157.83 };

test('zone check and nearest places work from GPS in airplane mode', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation(IN_SAMPLE_ZONE);

  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Demo data only' })).toBeVisible();
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active !== null && navigator.serviceWorker.controller !== null;
  });

  await context.setOffline(true);
  await page.reload();

  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(
    page.getByRole('heading', { name: 'You are in a tsunami evacuation zone' }),
  ).toBeVisible();

  // The location carries over to the Safe places tab.
  await page.getByRole('link', { name: 'Safe places' }).click();
  const list = page.getByRole('list', { name: 'Nearest places' });
  await expect(list.getByRole('listitem')).toHaveCount(5);
  await expect(list.getByRole('listitem').first()).toContainText('SAMPLE place A');
});

test('no screen is wider than the phone', async ({ page }) => {
  for (const path of ['./', './#/places', './#/alerts', './#/plan']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBe(0);
  }
});
