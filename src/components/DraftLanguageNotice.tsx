import { useTranslation } from 'react-i18next';
import { isDraftLanguage } from '../i18n/translationStatus';

/**
 * Tells readers when the whole UI is a machine draft. Also shown in English, because the
 * draft translation of this very notice could be wrong.
 */
export function DraftLanguageNotice() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  if (!isDraftLanguage(lang)) return null;
  return (
    <div className="banner banner-draft">
      <p>{t('i18n.draftLanguage')}</p>
      <p lang="en">{t('i18n.draftLanguage', { lng: 'en' })}</p>
    </div>
  );
}
