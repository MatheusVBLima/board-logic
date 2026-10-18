import type { Metadata } from 'next';
import { getDict } from '@/lib/i18n/server';
import { SiteHeader } from '@/components/SiteHeader';
import { Explorer } from '@/components/inside/Explorer';

export async function generateMetadata({ params }: PageProps<'/[lang]/inside'>): Promise<Metadata> {
  const { t } = await getDict(params);
  return { title: t.meta.insideTitle, description: t.meta.insideDescription };
}

export default async function InsidePage({ params }: PageProps<'/[lang]/inside'>) {
  const { t } = await getDict(params);
  return (
    <div className="min-h-dvh overflow-y-auto" style={{ height: '100dvh' }}>
      <SiteHeader title={t.nav.inside} />
      <main className="pb-16"><Explorer /></main>
    </div>
  );
}
