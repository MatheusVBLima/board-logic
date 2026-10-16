import type { Metadata } from 'next';
import { Suspense } from 'react';
import Simulator from '@/components/Simulator';
import { getDict } from '@/lib/i18n/server';

export async function generateMetadata({ params }: PageProps<'/[lang]/board'>): Promise<Metadata> {
  const { t } = await getDict(params);
  return { title: t.meta.boardTitle };
}

export default function BoardPage() {
  return <Suspense><Simulator /></Suspense>;
}
