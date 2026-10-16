import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALE_COOKIE, hasLocale } from '@/lib/i18n/config';

// Every page lives under /en or /pt. A path without a language goes to the one the
// visitor picked before (cookie), else English.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (/^\/(en|pt)(\/|$)/.test(pathname)) return;
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(saved) ? saved : DEFAULT_LOCALE;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|auth|api|.*\\..*).*)'],
};
