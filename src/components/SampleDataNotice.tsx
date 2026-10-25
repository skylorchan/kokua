import { useTranslation } from 'react-i18next';
import type { DatasetMeta } from '../geo/types';

type Label = 'data.sourceZones' | 'data.sourcePlaces';

/**
 * Says where a dataset came from and when it was downloaded. If it is made-up demo
 * data, says that loudly instead.
 */
export function SampleDataNotice({ meta, label }: { meta: DatasetMeta; label: Label }) {
  const { t } = useTranslation();
  if (!meta.sample) {
    return <p className="source">{t(label, { source: meta.source, date: meta.retrieved })}</p>;
  }
  return (
    <section className="card card-sample" aria-labelledby="sample-data">
      <h2 id="sample-data">{t('data.sampleHeading')}</h2>
      <p>{t('data.sampleBody')}</p>
    </section>
  );
}
