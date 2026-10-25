import { useTranslation } from 'react-i18next';
import { isReviewed, type SafetyKey } from '../i18n/translationStatus';

type Props = { k: SafetyKey; as?: 'p' | 'h2' };

/**
 * Renders a safety-critical instruction. If the current language's translation has not
 * been reviewed by a human, we show the English original instead (marked lang="en" so
 * screen readers switch voice) plus a note explaining why. Unreviewed machine
 * translation of safety instructions is never shown as if it were authoritative.
 */
export function SafeText({ k, as: Tag = 'p' }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const className = Tag === 'p' ? 'safety-text' : undefined;

  if (isReviewed(lang, k)) return <Tag className={className}>{t(k)}</Tag>;

  return (
    <div className="safety-fallback">
      <Tag className={className} lang="en">
        {t(k, { lng: 'en' })}
      </Tag>
      <p className="safety-note">{t('i18n.unreviewed')}</p>
    </div>
  );
}
