import type { Metadata } from 'next';
import { getDict } from '@/lib/i18n/server';
import { SiteHeader } from '@/components/SiteHeader';
import { ChallengeList } from '@/components/ChallengeList';

export async function generateMetadata({ params }: PageProps<'/[lang]/challenges'>): Promise<Metadata> {
  const { t } = await getDict(params);
  return { title: t.meta.challengesTitle };
}

export default async function ChallengesPage({ params }: PageProps<'/[lang]/challenges'>) {
  const { t } = await getDict(params);
  return (
    <div className="min-h-dvh overflow-y-auto" style={{ height: '100dvh' }}>
      <SiteHeader title={t.nav.challenges} />
      <main className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6">
        <h1 className="text-2xl tracking-[0.06em] text-ink-hi">{t.challengesPage.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink">{t.challengesPage.intro}</p>
        <ChallengeList />
      </main>
    </div>
  );
}
