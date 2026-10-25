import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../../app/location';
import { LocationPicker } from '../../components/LocationPicker';
import { Page } from '../../components/Page';
import { SafeText } from '../../components/SafeText';
import { SampleDataNotice } from '../../components/SampleDataNotice';
import { useDataset } from '../../data/useDataset';
import { lookupZone, type ZoneCollection } from '../../geo/zoneLookup';
import type { Position } from '../../geo/types';

// MapLibre is large; load it only when this screen renders. It is still precached.
const ZoneMap = lazy(() => import('../map/ZoneMap'));

function ZoneResultCard({ position, zones }: { position: Position; zones: ZoneCollection }) {
  const { t } = useTranslation();
  const result = lookupZone(position, zones);

  if (result.status === 'outside-coverage') {
    return (
      <section className="card" aria-live="polite">
        <SafeText k="safety.outsideCoverageHeading" as="h2" />
      </section>
    );
  }
  if (result.status === 'not-in-zone') {
    return (
      <section className="card card-ok" aria-live="polite">
        <SafeText k="safety.notInZoneHeading" as="h2" />
        <SafeText k="safety.notInZone" />
      </section>
    );
  }
  // The regular zone means "leave for any tsunami warning"; the extreme zone only for an
  // Extreme Tsunami Warning. If both apply, the stricter (regular) instruction wins.
  const inRegular = result.zones.some((z) => z.kind === 'tsunami');
  return (
    <section className="card card-danger" aria-live="polite">
      <SafeText k={inRegular ? 'safety.inZoneHeading' : 'safety.inExtremeHeading'} as="h2" />
      <ul>
        {result.zones.map((z) => (
          <li key={z.id}>
            {t(z.kind === 'tsunami' ? 'zoneKind.tsunami' : 'zoneKind.extreme')}: {z.name}
          </li>
        ))}
      </ul>
      <SafeText k={inRegular ? 'safety.inZone' : 'safety.inExtremeZone'} />
    </section>
  );
}

export function ZoneScreen() {
  const { t } = useTranslation();
  const { location } = useLocation();
  const zones = useDataset('zones');
  const places = useDataset('places');

  return (
    <Page title={t('screens.zone.title')}>
      <p>{t('screens.zone.body')}</p>
      {zones.status === 'ready' && (
        <SampleDataNotice meta={zones.data.metadata} label="data.sourceZones" />
      )}
      {zones.status === 'ready' && (
        <Suspense fallback={<p>{t('map.loading')}</p>}>
          <ZoneMap zones={zones.data} places={places.status === 'ready' ? places.data : null} />
        </Suspense>
      )}
      <LocationPicker />
      {zones.status === 'loading' && <p>{t('data.loading')}</p>}
      {zones.status === 'error' && <p role="alert">{t('data.error')}</p>}
      {zones.status === 'ready' && location && (
        <ZoneResultCard position={location.position} zones={zones.data} />
      )}
      <section className="card card-warning" aria-labelledby="natural-warning">
        <h2 id="natural-warning">{t('screens.zone.naturalWarningHeading')}</h2>
        <SafeText k="safety.naturalWarning" />
        <p className="source">
          <a href="https://www.weather.gov/safety/tsunami" target="_blank" rel="noreferrer">
            {t('screens.zone.naturalWarningSource')}
          </a>
        </p>
      </section>
    </Page>
  );
}
