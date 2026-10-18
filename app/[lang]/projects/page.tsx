import type { Metadata } from 'next';
import { getDict } from '@/lib/i18n/server';
import { SiteHeader } from '@/components/SiteHeader';
import { ProjectList } from '@/components/ProjectList';

export async function generateMetadata({ params }: PageProps<'/[lang]/projects'>): Promise<Metadata> {
  const { t } = await getDict(params);
  return { title: t.meta.projectsTitle };
}

export default function ProjectsPage() {
  return (
    <div className="min-h-dvh overflow-y-auto" style={{ height: '100dvh' }}>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6">
        <ProjectList />
      </main>
    </div>
  );
}
