import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import zones from '../../../public/data/zones.geojson?raw';
import places from '../../../public/data/places.geojson?raw';
import { LocationProvider } from '../../app/LocationProvider';
import { resetDatasetCache } from '../../data/useDataset';
import en from '../../i18n/locales/en.json';
import { setupTestI18n } from '../../test/i18n';
import { PlacesScreen } from '../places/PlacesScreen';
import { ZoneScreen } from './ZoneScreen';

function mockData() {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const body = String(input).includes('zones') ? zones : places;
    return new Response(body, { status: 200 });
  });
}

async function enterCoords(lat: string, lng: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(en.location.lat), lat);
  await user.type(screen.getByLabelText(en.location.lng), lng);
  await user.click(screen.getByRole('button', { name: en.location.check }));
}

const renderIn = (ui: React.ReactNode) =>
  render(
    <MemoryRouter>
      <LocationProvider>{ui}</LocationProvider>
    </MemoryRouter>,
  );

beforeEach(async () => {
  await setupTestI18n('en');
  resetDatasetCache();
  mockData();
});
afterEach(() => vi.restoreAllMocks());

describe('ZoneScreen', () => {
  it('labels sample data as sample', async () => {
    renderIn(<ZoneScreen />);
    expect(await screen.findByText(en.data.sampleHeading)).toBeInTheDocument();
  });

  it('says you are in a zone for a point inside a sample zone', async () => {
    renderIn(<ZoneScreen />);
    await screen.findByText(en.data.sampleHeading);
    await enterCoords('21.277', '-157.83');
    expect(await screen.findByText(en.screens.zone.inZone)).toBeInTheDocument();
    expect(screen.getByText(en.safety.inZone)).toBeInTheDocument();
  });

  it('says you are outside zones for an inland point', async () => {
    renderIn(<ZoneScreen />);
    await screen.findByText(en.data.sampleHeading);
    await enterCoords('21.45', '-158.0');
    expect(await screen.findByText(en.screens.zone.notInZone)).toBeInTheDocument();
  });

  it('refuses to answer outside the data coverage', async () => {
    renderIn(<ZoneScreen />);
    await screen.findByText(en.data.sampleHeading);
    await enterCoords('19.72', '-155.08'); // Hilo, not covered by the Oʻahu data
    expect(await screen.findByText(en.screens.zone.outsideCoverage)).toBeInTheDocument();
  });

  it('rejects out-of-range coordinates', async () => {
    renderIn(<ZoneScreen />);
    await enterCoords('120', '-157');
    expect(screen.getByText(en.location.invalid)).toBeInTheDocument();
  });

  it('shows an error if the data fails to load', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 404 }));
    renderIn(<ZoneScreen />);
    expect(await screen.findByRole('alert')).toHaveTextContent(en.data.error);
  });
});

describe('PlacesScreen', () => {
  it('lists the nearest places with distance and direction', async () => {
    renderIn(<PlacesScreen />);
    await screen.findByText(en.data.sampleHeading);
    await enterCoords('21.30', '-157.835');
    const list = await screen.findByRole('list', { name: en.screens.places.listLabel });
    const items = list.querySelectorAll('li');
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveTextContent('SAMPLE place A (not real)');
    expect(items[0]).toHaveTextContent(/0\.6 km \(0\.3 mi\) to the north/);
  });
});
