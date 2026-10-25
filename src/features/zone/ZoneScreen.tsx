import { useTranslation } from 'react-i18next';
import { useLocation } from '../../app/location';
import { LocationPicker } from '../../components/LocationPicker';
import { Page } from '../../components/Page';
import { SafeText } from '../../components/SafeText';
import { SampleDataNotice } from '../../components/SampleDataNotice';
import { useDataset } from '../../data/useDataset';
import { lookupZone, type ZoneCollection } from '../../geo/zoneLookup';
import type { Position } from '../../geo/types';

function ZoneResultCard({ position, zones }: { position: Position; zones: ZoneCollection }) {
  const { t } = useTranslation();
  const result = lookupZone(position, zones);

  if (result.status === 'outside-coverage') {
    return (
      <section className="card" aria-live="polite">
        <h2>{t('screens.zone.outsideCoverage')}</h2>
      </section>
    );
  }
  if (result.status === 'not-in-zone') {
    return (
      <section className="card card-ok" aria-live="polite">
        <h2>{t('screens.zone.notInZone')}</h2>
        <SafeText k="safety.notInZone" />
      </section>
    );
  }
  return (
    <section className="card card-danger" aria-live="polite">
      <h2>{t('screens.zone.inZone')}</h2>
      <ul>
        {result.zones.map((z) => (
          <li key={z.id}>
            {z.name} ({t(z.kind === 'tsunami' ? 'zoneKind.tsunami' : 'zoneKind.extreme')})
          </li>
        ))}
      </ul>
      <SafeText k="safety.inZone" />
    </section>
  );
}

export function ZoneScreen() {
  const { t } = useTranslation();
  const { location } = useLocation();
  const zones = useDataset('zones');

  return (
    <Page title={t('screens.zone.title')}>
      <p>{t('screens.zone.body')}</p>
      {zones.status === 'ready' && <SampleDataNotice meta={zones.data.metadata} />}
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
