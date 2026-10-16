import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { SvgFilters } from '@/components/SvgFilters';
import { I18nProvider } from '@/lib/i18n/client';
import { HTML_LANG, LOCALES } from '@/lib/i18n/config';
import { getDict } from '@/lib/i18n/server';

export function generateStaticParams() {
  return LOCALES.map(lang => ({ lang }));
}

// Absolute base for share-image URLs; previews point at their own deployment.
const SITE_URL = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL
  ? `https://${process.env.VERCEL_BRANCH_URL}`
  : 'https://board-logic.vercel.app';

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { t, locale } = await getDict(params);
  return {
    metadataBase: new URL(SITE_URL),
    title: t.meta.title,
    description: t.meta.description,
    alternates: { languages: { en: '/en', 'pt-BR': '/pt' } },
    openGraph: { type: 'website', siteName: t.brand, title: t.meta.title, description: t.meta.description, locale: locale === 'pt' ? 'pt_BR' : 'en_US' },
    twitter: { card: 'summary_large_image', title: t.meta.title, description: t.meta.description },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0c0d0e',
};

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { locale } = await getDict(params);
  return (
    <html lang={HTML_LANG[locale]} className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif&display=swap" />
      </head>
      <body><SvgFilters /><I18nProvider locale={locale}>{children}</I18nProvider></body>
    </html>
  );
}
