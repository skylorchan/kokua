// Languages the UI can be shown in, all widely spoken in Hawaiʻi homes. Every
// non-English file is a machine draft until a native speaker reviews it; see
// translation-status.json. Chuukese (chk) and Marshallese (mh) are planned but need a
// human translator first; see docs/TRANSLATING.md. Spanish and Samoan are also common.
export const LANGUAGES = [
  { code: 'en', nativeName: 'English' },
  { code: 'haw', nativeName: 'ʻŌlelo Hawaiʻi' },
  { code: 'ilo', nativeName: 'Ilokano' },
  { code: 'tl', nativeName: 'Tagalog' },
  { code: 'ja', nativeName: '日本語' },
  { code: 'zh-Hant', nativeName: '繁體中文' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'vi', nativeName: 'Tiếng Việt' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
export const DEFAULT_LANGUAGE: LanguageCode = 'en';

// Browser tags that should map to one of ours: Filipino is set as "fil", and any
// Chinese gets Traditional, which most Chinese readers in Hawaiʻi use.
const ALIASES: Record<string, LanguageCode> = { fil: 'tl', zh: 'zh-Hant' };

export function isSupportedLanguage(code: string): code is LanguageCode {
  return LANGUAGES.some((l) => l.code === code);
}

/**
 * Pick the starting language: the user's saved choice wins, then the first browser
 * language we support (matching "ja-JP" to "ja"), then English.
 */
export function detectLanguage(
  saved: string | null,
  browserLanguages: readonly string[],
): LanguageCode {
  if (saved && isSupportedLanguage(saved)) return saved;
  for (const tag of browserLanguages) {
    const exact = LANGUAGES.find((l) => l.code.toLowerCase() === tag.toLowerCase());
    if (exact) return exact.code;
    const base = tag.toLowerCase().split('-')[0] ?? '';
    if (isSupportedLanguage(base)) return base;
    if (ALIASES[base]) return ALIASES[base];
  }
  return DEFAULT_LANGUAGE;
}
