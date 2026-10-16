export const LOCALES = ['en', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', pt: 'Português' };
export const HTML_LANG: Record<Locale, string> = { en: 'en', pt: 'pt-BR' };

export const hasLocale = (l: string | undefined | null): l is Locale => !!l && (LOCALES as readonly string[]).includes(l);
