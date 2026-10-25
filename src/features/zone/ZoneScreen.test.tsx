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

// MapLibre needs WebGL, which jsdom doesn't have. The map is covered by e2e tests.
vi.mock('../map/ZoneMap', () => ({ default: () => null }));

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
  const ready = () => screen.findByText(/^Zones: Hawaiʻi Statewide GIS Program/);

  it('names the official source of the zone data', async () => {
    renderIn(<ZoneScreen />);
    expect(await ready()).toBeInTheDocument();
    expect(screen.queryByText(en.data.sampleHeading)).not.toBeInTheDocument();
  });

  it('says you are in a zone on Waikīkī Beach', async () => {
    renderIn(<ZoneScreen />);
    await ready();
    await enterCoords('21.2764', '-157.8268');
    expect(
      await screen.findByRole('heading', { name: en.safety.inZoneHeading }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.safety.inZone)).toBeInTheDocument();
    expect(screen.getByText(/Tsunami evacuation zone: Oʻahu/)).toBeInTheDocument();
  });

  it('says you are outside zones in inland Mililani', async () => {
    renderIn(<ZoneScreen />);
    await ready();
    await enterCoords('21.45', '-158.0');
    expect(
      await screen.findByRole('heading', { name: en.safety.notInZoneHeading }),
    ).toBeInTheDocument();
  });

  it('refuses to answer outside the data coverage', async () => {
    renderIn(<ZoneScreen />);
    await ready();
    await enterCoords('34.05', '-118.24'); // Los Angeles
    expect(
      await screen.findByRole('heading', { name: en.safety.outsideCoverageHeading }),
    ).toBeInTheDocument();
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
  const ready = () => screen.findByText(/^Places: City and County of Honolulu/);

  it('lists the five nearest official refuge areas with distance and direction', async () => {
    renderIn(<PlacesScreen />);
    await ready();
    // Moanalua High School's own coordinates, from the Honolulu DEM layer.
    await enterCoords('21.347024', '-157.900103');
    const list = await screen.findByRole('list', { name: en.screens.places.listLabel });
    const items = list.querySelectorAll('li');
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveTextContent('Moanalua High');
    expect(items[0]).toHaveTextContent('2825 Ala Ilima St, Honolulu');
    expect(items[0]).toHaveTextContent(/^.*0 km \(0 mi\) to the north/);
    expect(items[1]).toHaveTextContent(/km \(.* mi\) to the/);
  });

  it('warns that refuge areas are not for tsunamis', async () => {
    renderIn(<PlacesScreen />);
    expect(screen.getByText(en.safety.tsunamiNotRefuge)).toBeInTheDocument();
  });

  it('says so when the location is not on Oʻahu', async () => {
    renderIn(<PlacesScreen />);
    await ready();
    await enterCoords('20.89', '-156.47'); // Maui
    expect(await screen.findByText(en.screens.places.outsideCoverage)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: en.screens.places.listLabel })).toBeNull();
  });
});
