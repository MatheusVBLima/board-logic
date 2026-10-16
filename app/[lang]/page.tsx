import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getDict } from '@/lib/i18n/server';
import { LandingBoard } from '@/components/LandingBoard';
import { AccountMenu } from '@/components/AccountMenu';
import { SharedLinkRedirect } from '@/components/SharedLinkRedirect';
import { Logo } from '@/components/Logo';

export async function generateMetadata({ params }: PageProps<'/[lang]'>): Promise<Metadata> {
  const { t } = await getDict(params);
  return { title: { absolute: `${t.brand} · ${t.landing.title}` }, description: t.meta.description };
}

// Landing page: one dark hero with a live example board. Its look is scoped under .landing in globals.css.
export default async function Landing({ params }: PageProps<'/[lang]'>) {
  const { t, locale } = await getDict(params);
  const L = t.landing;
  const board = `/${locale}/board`;
  const signUp = `/${locale}/login?mode=signup&next=${encodeURIComponent(board)}`;
  return (
    <div className="landing min-h-dvh overflow-y-auto" style={{ height: '100dvh' }}>
      <SharedLinkRedirect to={board} />
      <div className="landing-rails" aria-hidden><span /><span /><span /></div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href={`/${locale}`} className="landing-brand flex items-center gap-2.5">
          <Logo className="size-6" />{t.brand}
        </Link>
        <nav className="flex items-center gap-1 sm:gap-5">
          <Link href={`/${locale}/learn`} className="landing-link max-sm:hidden">{t.nav.learn}</Link>
          <Link href={`/${locale}/challenges`} className="landing-link max-sm:hidden">{t.nav.challenges}</Link>
          <Link href={board} className="landing-link max-sm:hidden">{t.nav.board}</Link>
          <div className="landing-account"><AccountMenu /></div>
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <section className="pt-10 sm:pt-16 lg:pl-[16.5%]">
          <p className="landing-eyebrow"><span className="landing-hatch" aria-hidden />{L.eyebrow}</p>
          <h1 className="landing-title mt-5">{L.title}</h1>
          <p className="landing-lead mt-6 max-w-lg">{L.subtitle}</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href={signUp} className="landing-btn landing-btn-primary">{L.cta}<ArrowRight className="size-4" /></Link>
            <Link href={board} className="landing-btn">{L.secondary}</Link>
          </div>
        </section>

        <section className="mt-14 sm:mt-20">
          <LandingBoard />
        </section>
      </main>

      <footer className="landing-footer relative">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8">
          <span>{t.brand}</span>
          <span>{L.footer}</span>
        </div>
      </footer>
    </div>
  );
}
