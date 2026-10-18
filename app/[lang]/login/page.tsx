import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getDict } from '@/lib/i18n/server';
import { SiteHeader } from '@/components/SiteHeader';
import { LoginForm } from '@/components/LoginForm';
import { LoginFigure } from '@/components/LoginFigure';

export async function generateMetadata({ params }: PageProps<'/[lang]/login'>): Promise<Metadata> {
  const { t } = await getDict(params);
  return { title: t.meta.loginTitle };
}

export default async function LoginPage({ params }: PageProps<'/[lang]/login'>) {
  const { t } = await getDict(params);
  return (
    <div className="flex min-h-dvh flex-col overflow-y-auto" style={{ height: '100dvh' }}>
      <SiteHeader />
      <main className="grid flex-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* left half: the logic board, large; hidden on small screens so the form comes first */}
        <section className="relative hidden flex-col items-center justify-center border-r border-edge bg-panel px-6 py-10 lg:flex">
          <LoginFigure className="w-full max-w-[900px]" label={t.auth.figureLabel} />
          <p className="mt-4 text-[11px] tracking-[0.16em] text-ink uppercase">{t.auth.figureHint}</p>
        </section>
        <section className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Suspense><LoginForm /></Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
