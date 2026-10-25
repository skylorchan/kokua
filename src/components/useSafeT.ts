import { useTranslation } from 'react-i18next';
import { isReviewed, type SafetyKey } from '../i18n/translationStatus';

/**
 * For safety text that can't be a standalone <SafeText> block (list items, labels).
 * Returns the reviewed translation, or the English original with lang="en". The caller
 * shows the "not reviewed" note once for the whole group via `anyUnreviewed`.
 */
export function useSafeT() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const safeT = (k: SafetyKey, options?: Record<string, unknown>) =>
    isReviewed(lang, k)
      ? { text: t(k, options) as string, lang: undefined }
      : { text: t(k, { ...options, lng: 'en' }) as string, lang: 'en' as const };
  const anyUnreviewed = (keys: SafetyKey[]) => keys.some((k) => !isReviewed(lang, k));
  return { safeT, anyUnreviewed };
}
