import { describe, expect, it } from 'vitest';
import { detectLanguage, isSupportedLanguage, LANGUAGES } from './languages';

describe('detectLanguage', () => {
  it('uses the saved choice first', () => {
    expect(detectLanguage('ja', ['en-US'])).toBe('ja');
  });

  it('ignores a saved language we no longer support', () => {
    expect(detectLanguage('xx', ['ja-JP'])).toBe('ja');
  });

  it('matches a browser region tag to its base language', () => {
    expect(detectLanguage(null, ['ja-JP'])).toBe('ja');
    expect(detectLanguage(null, ['JA'])).toBe('ja');
  });

  it('takes the first supported browser language in order', () => {
    expect(detectLanguage(null, ['fr-FR', 'ja', 'en'])).toBe('ja');
  });

  it('falls back to English', () => {
    expect(detectLanguage(null, [])).toBe('en');
    expect(detectLanguage(null, ['fr', 'de'])).toBe('en');
  });
});

describe('isSupportedLanguage', () => {
  it('accepts known codes only', () => {
    expect(isSupportedLanguage('en')).toBe(true);
    expect(isSupportedLanguage('ja')).toBe(true);
    expect(isSupportedLanguage('ja-JP')).toBe(false);
  });
});

describe('detectLanguage with the M5 languages', () => {
  it('maps Filipino to Tagalog and any Chinese to Traditional Chinese', () => {
    expect(detectLanguage(null, ['fil-PH'])).toBe('tl');
    expect(detectLanguage(null, ['zh-TW'])).toBe('zh-Hant');
    expect(detectLanguage(null, ['zh-CN'])).toBe('zh-Hant');
    expect(detectLanguage(null, ['zh-hant'])).toBe('zh-Hant');
  });

  it('matches three-letter codes', () => {
    expect(detectLanguage(null, ['haw'])).toBe('haw');
    expect(detectLanguage(null, ['ilo-PH'])).toBe('ilo');
  });
});

describe('LANGUAGES', () => {
  const files = Object.keys(import.meta.glob('./locales/*.json')).map((p) =>
    p.replace(/^.*\/|\.json$/g, ''),
  );

  it('has a translation file for every language in the picker, and vice versa', () => {
    expect(LANGUAGES.map((l) => l.code).sort()).toEqual(files.sort());
  });
});
