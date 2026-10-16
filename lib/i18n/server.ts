import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from './config';
import en, { type Dict } from './en';
import pt from './pt';

const DICTS: Record<Locale, Dict> = { en, pt };

/** Strings for a route's `lang` param; unknown languages are a 404. */
export async function getDict(params: Promise<{ lang: string }>): Promise<{ locale: Locale; t: Dict }> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return { locale: lang, t: DICTS[lang] };
}
