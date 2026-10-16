'use client';

import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';

/** Public destinations stay visible independently of the account state. */
export function PrimaryNav({ className }: { className?: string }) {
  const { t, href } = useI18n();
  const pathname = usePathname();
  const links = [
    { path: '/board', label: t.nav.board },
    { path: '/learn', label: t.nav.guide },
    { path: '/challenges', label: t.nav.challenges },
  ];

  return (
    <nav aria-label={t.nav.mainNavigation} className={cn('flex min-w-0 items-center gap-1', className)}>
      {links.map(link => {
        const target = href(link.path);
        const active = pathname === target || pathname?.startsWith(`${target}/`);
        return (
          <a key={link.path} href={target} aria-current={active ? 'page' : undefined}
            className={cn('flex min-h-8 flex-1 items-center justify-center rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-accent hover:text-ink-hi focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow lg:flex-none',
              active ? 'bg-accent text-ink-hi shadow-[inset_0_-2px_0_var(--glow)]' : 'text-ink')}>
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
