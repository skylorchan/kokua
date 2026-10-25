import { useTranslation } from 'react-i18next';
import type { DatasetMeta } from '../geo/types';

/** Shown whenever a screen is using made-up demo data instead of an official dataset. */
export function SampleDataNotice({ meta }: { meta: DatasetMeta }) {
  const { t } = useTranslation();
  if (!meta.sample) {
    return (
      <p className="source">{t('data.source', { source: meta.source, date: meta.retrieved })}</p>
    );
  }
  return (
    <section className="card card-sample" aria-labelledby="sample-data">
      <h2 id="sample-data">{t('data.sampleHeading')}</h2>
      <p>{t('data.sampleBody')}</p>
    </section>
  );
}
