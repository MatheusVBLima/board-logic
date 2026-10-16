import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenText, Cable, Save, Table2, Trophy } from 'lucide-react';
import { getDict } from '@/lib/i18n/server';
import { BoardPreview } from '@/components/BoardPreview';
import { AccountMenu } from '@/components/AccountMenu';
import { SharedLinkRedirect } from '@/components/SharedLinkRedirect';

export async function generateMetadata({ params }: PageProps<'/[lang]'>): Promise<Metadata> {
  const { t } = await getDict(params);
  return { title: { absolute: `${t.brand} · ${t.landing.title}` }, description: t.meta.description };
}

const ICONS = [Cable, Table2, Trophy, Save];

// Landing page with its own look (scoped under .landing in globals.css), separate from the board's.
export default async function Landing({ params }: PageProps<'/[lang]'>) {
  const { t, locale } = await getDict(params);
  const L = t.landing;
  const board = `/${locale}/board`;
  return (
    <div className="landing min-h-dvh overflow-y-auto" style={{ height: '100dvh' }}>
      <SharedLinkRedirect to={board} />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href={`/${locale}`} className="landing-brand flex items-center gap-2.5">
          <span className="landing-dot" />{t.brand}
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4">
          <Link href={`/${locale}/learn`} className="landing-link max-sm:hidden">{t.nav.learn}</Link>
          <Link href={`/${locale}/challenges`} className="landing-link max-sm:hidden">{t.nav.challenges}</Link>
          <div className="landing-account"><AccountMenu /></div>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-8 pb-16 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <div>
            <p className="landing-eyebrow">{L.eyebrow}</p>
            <h1 className="landing-title mt-4">{L.title}</h1>
            <p className="landing-lead mt-6 max-w-xl">{L.subtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={board} className="landing-btn landing-btn-primary">{L.cta}<ArrowRight className="size-4" /></a>
              <Link href={`/${locale}/learn`} className="landing-btn">{L.secondary}<BookOpenText className="size-4" /></Link>
            </div>
          </div>
          <a href={board} className="landing-stage" aria-label={L.cta}>
            <BoardPreview className="h-full w-full" />
          </a>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
          <div className="grid gap-px overflow-hidden landing-grid sm:grid-cols-2 lg:grid-cols-4">
            {L.features.map((f, i) => {
              const Icon = ICONS[i];
              return (
                <article key={f.title} className="landing-card">
                  <Icon className="size-5 landing-accent" />
                  <h2 className="mt-5 landing-card-title">{f.title}</h2>
                  <p className="mt-2 landing-card-body">{f.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <h2 className="landing-h2">{L.stepsTitle}</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {L.steps.map((s, i) => (
              <li key={s} className="landing-step">
                <span className="landing-step-n">0{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <a href={board} className="landing-btn landing-btn-primary">{L.cta}<ArrowRight className="size-4" /></a>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 sm:px-8">
          <span className="flex items-center gap-2.5"><span className="landing-dot" />{t.brand}</span>
          <span>{L.footer}</span>
        </div>
      </footer>
    </div>
  );
}
