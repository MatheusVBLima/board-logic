'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { AccountMenu } from '@/components/AccountMenu';
import { useI18n } from '@/lib/i18n/client';

/** Sticky top bar of the guide, challenges, projects and login pages: breadcrumb on the left, account menu on the right. */
export function SiteHeader({ title }: { title: string }) {
  const { t, href } = useI18n();
  return (
    <header className="sticky top-0 z-10 border-b border-edge bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-2 text-[13px] tracking-[0.14em] uppercase">
            <li>
              <Link href={href('/')} className="flex items-center gap-3 text-ink transition-colors hover:text-ink-hi">
                <Logo />
                <span className="whitespace-nowrap max-sm:sr-only">{t.brand}</span>
              </Link>
            </li>
            <li aria-hidden className="text-ink/60"><ChevronRight className="size-3.5" /></li>
            <li aria-current="page" className="truncate text-ink-hi">{title}</li>
          </ol>
        </nav>
        <AccountMenu showLearn showBoard />
      </div>
    </header>
  );
}
