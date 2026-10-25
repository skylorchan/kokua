import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../app/location';

type GpsState = 'idle' | 'locating' | 'denied' | 'unavailable' | 'unsupported';

/** "Use my location" plus a manual coordinate form, which also works with GPS off. */
export function LocationPicker() {
  const { t } = useTranslation();
  const { location, setLocation } = useLocation();
  const [gps, setGps] = useState<GpsState>('idle');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [invalid, setInvalid] = useState(false);
  const latId = useId();
  const lngId = useId();
  const errorId = useId();

  function useGps() {
    if (!('geolocation' in navigator)) return setGps('unsupported');
    setGps('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGps('idle');
        setLocation({
          position: [coords.longitude, coords.latitude],
          source: 'gps',
          accuracyM: coords.accuracy,
        });
      },
      (err) => setGps(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      // GPS can be slow to lock on with no data connection; accept a fix up to 1 min old.
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const la = Number(lat);
    const ln = Number(lng);
    const ok = lat.trim() !== '' && lng.trim() !== '' && Math.abs(la) <= 90 && Math.abs(ln) <= 180;
    setInvalid(!ok);
    if (ok) setLocation({ position: [ln, la], source: 'manual' });
  }

  const fmt = (n: number) => n.toFixed(5);

  return (
    <section className="card" aria-label={t('location.heading')}>
      <button type="button" onClick={useGps} disabled={gps === 'locating'}>
        {gps === 'locating' ? t('location.locating') : t('location.useMine')}
      </button>
      <div role="status" className="location-status">
        {gps === 'denied' && <p>{t('location.denied')}</p>}
        {gps === 'unavailable' && <p>{t('location.unavailable')}</p>}
        {gps === 'unsupported' && <p>{t('location.unsupported')}</p>}
        {location && (
          <p>
            {t('location.current', {
              lat: fmt(location.position[1]),
              lng: fmt(location.position[0]),
            })}
          </p>
        )}
      </div>

      <form className="coords-form" onSubmit={submit} noValidate>
        <h2>{t('location.manualHeading')}</h2>
        <div className="coords-fields">
          <label htmlFor={latId}>
            {t('location.lat')}
            <input
              id={latId}
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="21.2793"
              aria-describedby={invalid ? errorId : undefined}
              aria-invalid={invalid}
            />
          </label>
          <label htmlFor={lngId}>
            {t('location.lng')}
            <input
              id={lngId}
              inputMode="decimal"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="-157.8292"
              aria-describedby={invalid ? errorId : undefined}
              aria-invalid={invalid}
            />
          </label>
        </div>
        {invalid && (
          <p id={errorId} className="form-error">
            {t('location.invalid')}
          </p>
        )}
        <button type="submit" className="button-secondary">
          {t('location.check')}
        </button>
      </form>
    </section>
  );
}
