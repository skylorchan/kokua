import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../data/db';
import en from '../../i18n/locales/en.json';
import { setupTestI18n } from '../../test/i18n';
import { AlertsScreen } from './AlertsScreen';
import active from './fixtures/nws-active-HI.json';

const body = JSON.stringify(active);
// The fixture's alerts expire 2026-10-26 06:15 HST; pin the clock before that.
const NOW = new Date('2026-10-25T12:00:00-10:00');

const renderScreen = () =>
  render(
    <MemoryRouter>
      <AlertsScreen />
    </MemoryRouter>,
  );

beforeEach(async () => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  await setupTestI18n('en');
  await db.alerts.clear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('AlertsScreen', () => {
  it('shows live NWS alerts and saves a copy', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status: 200 }));
    renderScreen();
    const list = await screen.findByRole('list', { name: en.alerts.listLabel });
    expect(list.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getAllByRole('heading', { name: 'Hydrologic Outlook' })[0]).toHaveAttribute(
      'lang',
      'en',
    );
    expect(screen.getByText('Updated 1 minute ago')).toBeInTheDocument();
    await waitFor(async () => expect(await db.alerts.get('HI')).toBeDefined());
  });

  it('falls back to the saved copy when offline, with its age', async () => {
    const twoHoursAgo = new Date(NOW.getTime() - 2 * 3_600_000).toISOString();
    await db.alerts.put({ area: 'HI', fetchedAt: twoHoursAgo, body });
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    renderScreen();
    expect(await screen.findByText(en.alerts.offlineCached)).toBeInTheDocument();
    expect(screen.getByText('Updated 2 hours ago')).toBeInTheDocument();
    expect(screen.getByText(en.safety.alertsStale)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: en.alerts.listLabel })).toBeInTheDocument();
  });

  it('says nothing is saved yet on a first offline visit', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    renderScreen();
    expect(await screen.findByText(en.alerts.neverLoaded)).toBeInTheDocument();
    expect(screen.queryByText(/No active alerts/)).not.toBeInTheDocument();
  });

  it('only says "no active alerts" with the time it was checked', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), { status: 200 }),
    );
    renderScreen();
    expect(await screen.findByText(/No active alerts for Hawaiʻi as of .*HST/)).toBeInTheDocument();
  });
});
