'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { AccountMenu } from '@/components/AccountMenu';
import { PrimaryNav } from '@/components/PrimaryNav';
import { useI18n } from '@/lib/i18n/client';

/** Shared header: the logo home link, public navigation and account controls. */
export function SiteHeader() {
  const { t, href } = useI18n();
  return (
    <header className="sticky top-0 z-10 border-b border-edge bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <Link href={href('/')} aria-label={t.brand} className="inline-flex items-center gap-3 text-[13px] tracking-[0.14em] text-ink uppercase transition-colors hover:text-ink-hi">
            <Logo />
            <span className="whitespace-nowrap max-sm:sr-only">{t.brand}</span>
          </Link>
        </div>
        <PrimaryNav className="order-last w-full lg:order-none lg:w-auto" />
        <AccountMenu />
      </div>
    </header>
  );
}
