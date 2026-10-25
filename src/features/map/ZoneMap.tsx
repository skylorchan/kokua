import { layers, namedFlavor } from '@protomaps/basemaps';
import {
  addProtocol,
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
  type GeoJSONSourceSpecification,
  type MapMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../../app/location';
import type { PlaceCollection } from '../../geo/nearest';
import type { ZoneCollection } from '../../geo/zoneLookup';

// MapLibre loads its worker from a computed URL that Vite can't see, so hand it the
// bundled file directly. The PMTiles protocol reads tiles out of one file with HTTP
// range requests, which the service worker answers from its cache when offline.
setWorkerUrl(workerUrl);
const protocol = new Protocol();
addProtocol('pmtiles', protocol.tile);

const abs = (path: string) => new URL(`${import.meta.env.BASE_URL}${path}`, location.href).href;
const OAHU: [[number, number], [number, number]] = [
  [-158.3, 21.24],
  [-157.63, 21.72],
];
const ZONE_COLORS = { tsunami: '#d7301f', extreme: '#fd8d3c' } as const;

function buildStyle(zones: ZoneCollection, places: PlaceCollection | null): StyleSpecification {
  return {
    version: 8,
    // Placeholders appended after URL resolution, which would percent-encode the braces.
    glyphs: `${abs('map/fonts/')}{fontstack}/{range}.pbf`,
    sprite: abs('map/sprites/light'),
    sources: {
      protomaps: {
        type: 'vector',
        url: `pmtiles://${abs('tiles/oahu.pmtiles')}`,
        attribution:
          '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, <a href="https://protomaps.com">Protomaps</a>',
      },
      zones: { type: 'geojson', data: zones as unknown as GeoJSONSourceSpecification['data'] },
      places: {
        type: 'geojson',
        data: (places ?? {
          type: 'FeatureCollection',
          features: [],
        }) as unknown as GeoJSONSourceSpecification['data'],
      },
      me: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    },
    layers: [
      ...layers('protomaps', namedFlavor('light'), { lang: 'en' }),
      // Extreme zones first so the regular zone draws on top where they overlap.
      {
        id: 'zone-extreme',
        type: 'fill',
        source: 'zones',
        filter: ['==', ['get', 'kind'], 'extreme-tsunami'],
        paint: { 'fill-color': ZONE_COLORS.extreme, 'fill-opacity': 0.3 },
      },
      {
        id: 'zone-tsunami',
        type: 'fill',
        source: 'zones',
        filter: ['==', ['get', 'kind'], 'tsunami'],
        paint: { 'fill-color': ZONE_COLORS.tsunami, 'fill-opacity': 0.35 },
      },
      {
        id: 'zone-outline',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': [
            'match',
            ['get', 'kind'],
            'tsunami',
            ZONE_COLORS.tsunami,
            ZONE_COLORS.extreme,
          ],
          'line-width': 1,
        },
      },
      {
        id: 'places',
        type: 'circle',
        source: 'places',
        paint: {
          'circle-radius': 6,
          'circle-color': '#0b4f6c',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      },
      {
        id: 'me',
        type: 'circle',
        source: 'me',
        paint: {
          'circle-radius': 8,
          'circle-color': '#1a73e8',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      },
    ],
  };
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

type Props = { zones: ZoneCollection; places: PlaceCollection | null };

/** Map of Oʻahu with the evacuation zones. Tapping it checks that spot. */
export default function ZoneMap({ zones, places }: Props) {
  const { t } = useTranslation();
  const { location, setLocation } = useLocation();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [failed] = useState(() => !hasWebGL());

  useEffect(() => {
    if (!container.current || failed) return;
    let m: MapLibreMap;
    try {
      m = new MapLibreMap({
        container: container.current,
        style: buildStyle(zones, places),
        bounds: OAHU,
        minZoom: 6,
        maxZoom: 17,
        attributionControl: { compact: true },
        cooperativeGestures: true, // one finger scrolls the page; two fingers move the map
      });
    } catch {
      return; // WebGL context creation can still fail (e.g. GPU blocklisted)
    }
    m.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    m.on('click', (e: MapMouseEvent) =>
      setLocation({ position: [e.lngLat.lng, e.lngLat.lat], source: 'map' }),
    );
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, [zones, places, failed, setLocation]);

  // Show the chosen spot and keep it in view.
  useEffect(() => {
    const m = map.current;
    if (!m || !location) return;
    const show = () => {
      (m.getSource('me') as GeoJSONSource | undefined)?.setData({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: location.position },
        properties: {},
      });
      if (location.source !== 'map') m.easeTo({ center: location.position, zoom: 14 });
    };
    if (m.isStyleLoaded()) show();
    else m.once('load', show);
  }, [location]);

  if (failed) return <p className="card">{t('map.unavailable')}</p>;

  return (
    <figure className="map-figure">
      <div
        ref={container}
        className="map"
        role="region"
        aria-label={t('map.label')}
        aria-describedby="map-help"
      />
      <figcaption id="map-help">
        <ul className="map-legend">
          <li>
            <span className="swatch" style={{ background: ZONE_COLORS.tsunami }} />
            {t('zoneKind.tsunami')}
          </li>
          <li>
            <span className="swatch" style={{ background: ZONE_COLORS.extreme }} />
            {t('zoneKind.extreme')}
          </li>
          {places && (
            <li>
              <span className="swatch swatch-dot" />
              {t('placeKind.hurricane-refuge')}
            </li>
          )}
        </ul>
        <p className="source">{t('map.help')}</p>
      </figcaption>
    </figure>
  );
}
