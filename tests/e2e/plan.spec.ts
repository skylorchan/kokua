import { expect, test } from '@playwright/test';
import { waitForServiceWorker } from './helpers';

test('the family plan is saved on the device and survives an offline restart', async ({
  page,
  context,
}) => {
  await page.goto('./#/plan');
  await waitForServiceWorker(page);

  await page.getByLabel('Near home').fill('Mailbox on the corner');
  await page.getByLabel('Name', { exact: true }).fill('Auntie Lei');
  await page.getByLabel('Phone', { exact: true }).fill('808-555-0100');
  await page.getByRole('button', { name: 'Add contact' }).click();
  await page.getByLabel(/^Water:/).check();

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByLabel('Near home')).toHaveValue('Mailbox on the corner');
  await expect(page.getByRole('link', { name: '808-555-0100' })).toBeVisible();
  await expect(page.getByLabel(/^Water:/)).toBeChecked();

  await page.getByRole('button', { name: 'Show QR code' }).click();
  await expect(
    page.getByRole('img', { name: 'QR code with your meeting places and emergency contacts' }),
  ).toBeVisible();
});
