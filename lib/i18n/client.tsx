'use client';

import { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { LOCALE_COOKIE, type Locale } from './config';
import en, { type Dict } from './en';
import pt from './pt';

const DICTS: Record<Locale, Dict> = { en, pt };

const I18nContext = createContext<{ locale: Locale; t: Dict }>({ locale: 'en', t: en });

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: DICTS[locale] }}>{children}</I18nContext.Provider>;
}

/** Current locale, its strings, and `href` to build links inside that locale. */
export function useI18n() {
  const { locale, t } = useContext(I18nContext);
  const href = (path: string) => `/${locale}${path === '/' ? '' : path}`;
  return { locale, t, href };
}

/** Same page in another language; also remembers the choice for the next visit to "/". */
export function useSwitchLocale() {
  const pathname = usePathname() ?? '/';
  return (to: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${to}; path=/; max-age=31536000; samesite=lax`;
    const rest = pathname.replace(/^\/(en|pt)(?=\/|$)/, '');
    return `/${to}${rest}${location.search}${location.hash}`;
  };
}
