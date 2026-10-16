import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getDict } from '@/lib/i18n/server';
import { SiteHeader } from '@/components/SiteHeader';
import { LoginForm } from '@/components/LoginForm';

export async function generateMetadata({ params }: PageProps<'/[lang]/login'>): Promise<Metadata> {
  const { t } = await getDict(params);
  return { title: t.meta.loginTitle };
}

export default async function LoginPage({ params }: PageProps<'/[lang]/login'>) {
  const { t } = await getDict(params);
  return (
    <div className="min-h-dvh overflow-y-auto" style={{ height: '100dvh' }}>
      <SiteHeader title={t.brand} />
      <main className="mx-auto flex max-w-sm flex-col px-4 py-12 sm:py-20">
        <Suspense><LoginForm /></Suspense>
      </main>
    </div>
  );
}
