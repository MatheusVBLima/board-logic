'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AccountMenu } from '@/components/AccountMenu';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/client';

/** Sticky top bar of the guide, challenges, projects and login pages. */
export function SiteHeader({ title }: { title: string }) {
  const { t, href } = useI18n();
  return (
    <header className="sticky top-0 z-10 border-b border-edge bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={href('/')} className="flex items-center gap-3 text-[13px] tracking-[0.14em] text-ink-hi uppercase">
          <span className="inline-block size-1.5 rounded-full" style={{ background: 'var(--glow)', boxShadow: '0 0 8px var(--glow)' }} />
          <span>{title}</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="text-ink hover:text-ink-hi">
            <Link href={href('/board')}><ArrowLeft /><span className="max-sm:hidden">{t.nav.backToBoard}</span><span className="sm:hidden">{t.nav.board}</span></Link>
          </Button>
          <AccountMenu showLearn />
        </div>
      </div>
    </header>
  );
}
