import { useTranslation } from 'react-i18next';
import { useNow } from '../../app/useNow';
import { Page } from '../../components/Page';
import { SafeText } from '../../components/SafeText';
import type { Alert } from './parseAlerts';
import { formatAge, freshness, isExpired } from './staleness';
import { useAlerts } from './useAlerts';

function useHawaiiTime() {
  const { i18n } = useTranslation();
  const fmt = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    timeZone: 'Pacific/Honolulu',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  return (d: Date) => fmt.format(d);
}

function AlertCard({ alert }: { alert: Alert }) {
  const { t } = useTranslation();
  const time = useHawaiiTime();
  const until = alert.ends ?? alert.expires;
  return (
    <li className={`card alert alert-${alert.severity.toLowerCase()}`}>
      {/* NWS text is English only; lang="en" makes screen readers switch voice. */}
      <h2 lang="en">{alert.event}</h2>
      <p className="alert-meta">
        <span className="badge">{t(`alerts.severity.${alert.severity}`)}</span>
        {until && <span>{t('alerts.until', { time: time(until) })}</span>}
      </p>
      {alert.headline && <p lang="en">{alert.headline}</p>}
      <p className="source">
        {t('alerts.issued', { time: time(alert.sent), sender: alert.senderName })}
      </p>
      <p className="source" lang="en">
        {alert.areaDesc}
      </p>
      {alert.instruction && (
        <details open>
          <summary>{t('alerts.instructions')}</summary>
          <p lang="en" className="alert-text">
            {alert.instruction}
          </p>
        </details>
      )}
      {alert.description && (
        <details>
          <summary>{t('alerts.details')}</summary>
          <p lang="en" className="alert-text">
            {alert.description}
          </p>
        </details>
      )}
    </li>
  );
}

export function AlertsScreen() {
  const { t, i18n } = useTranslation();
  const { alerts, fetchedAt, source, loading, failed, refresh } = useAlerts();
  const now = useNow();
  const time = useHawaiiTime();
  const lang = i18n.resolvedLanguage ?? 'en';

  const current = alerts.filter((a) => !isExpired(a, now));
  const fresh = fetchedAt ? freshness(fetchedAt, now) : null;
  const age = fetchedAt ? formatAge(fetchedAt, now, lang) : null;

  return (
    <Page title={t('screens.alerts.title')}>
      <p>{t('screens.alerts.body')}</p>
      {lang !== 'en' && <p className="source">{t('alerts.englishOnly')}</p>}

      <div className="alerts-status" role="status">
        {age && (
          <p className={fresh === 'fresh' ? undefined : 'alerts-age-warning'}>
            {t('alerts.updated', { age })}
          </p>
        )}
        {failed && source === 'cache' && <p>{t('alerts.offlineCached')}</p>}
        {failed && source === 'none' && <p>{t('alerts.neverLoaded')}</p>}
      </div>
      <button type="button" onClick={refresh} disabled={loading}>
        {loading ? t('alerts.refreshing') : t('alerts.refresh')}
      </button>

      {fresh === 'stale' && (
        <section className="card card-warning">
          <SafeText k="safety.alertsStale" />
        </section>
      )}

      {fetchedAt && current.length === 0 && (
        <p className="card">{t('alerts.none', { time: time(fetchedAt) })}</p>
      )}
      {current.length > 0 && (
        <ul className="alert-list" aria-label={t('alerts.listLabel')}>
          {current.map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </ul>
      )}
      <p className="source">
        <a href="https://www.weather.gov/hfo/" target="_blank" rel="noreferrer">
          {t('alerts.sourceLink')}
        </a>
      </p>
    </Page>
  );
}
