import { useTranslation } from 'react-i18next';
import { useLocation } from '../../app/location';
import { LocationPicker } from '../../components/LocationPicker';
import { Page } from '../../components/Page';
import { SafeText } from '../../components/SafeText';
import { SampleDataNotice } from '../../components/SampleDataNotice';
import { useDataset } from '../../data/useDataset';
import { nearestPlaces } from '../../geo/nearest';
import { inCoverage } from '../../geo/zoneLookup';

const METERS_PER_MILE = 1609.344;

export function PlacesScreen() {
  const { t, i18n } = useTranslation();
  const { location } = useLocation();
  const places = useDataset('places');
  const number = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 1 });

  const covered =
    places.status === 'ready' && location
      ? inCoverage(location.position, places.data.metadata)
      : null;
  const nearby =
    places.status === 'ready' && location && covered
      ? nearestPlaces(location.position, places.data.features, 5)
      : [];

  return (
    <Page title={t('screens.places.title')}>
      <p>{t('screens.places.body')}</p>
      {places.status === 'ready' && (
        <SampleDataNotice meta={places.data.metadata} label="data.sourcePlaces" />
      )}
      <section className="card card-warning">
        <SafeText k="safety.tsunamiNotRefuge" />
      </section>
      <SafeText k="safety.refugeInfo" />
      <SafeText k="safety.placesDisclaimer" />
      <LocationPicker />
      {places.status === 'loading' && <p>{t('data.loading')}</p>}
      {places.status === 'error' && <p role="alert">{t('data.error')}</p>}
      {covered === false && <p className="card">{t('screens.places.outsideCoverage')}</p>}
      {nearby.length > 0 && (
        <ol className="place-list" aria-label={t('screens.places.listLabel')}>
          {nearby.map(({ place, meters, direction }) => (
            <li key={place.id} className="card">
              <h2>{place.name}</h2>
              <p>
                {t(`placeKind.${place.kind}`)}
                {place.address && (
                  <>
                    <br />
                    {place.address}
                  </>
                )}
              </p>
              <p className="place-distance">
                {t('screens.places.distance', {
                  km: number.format(meters / 1000),
                  mi: number.format(meters / METERS_PER_MILE),
                  dir: t(`compass.${direction}`),
                })}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Page>
  );
}
