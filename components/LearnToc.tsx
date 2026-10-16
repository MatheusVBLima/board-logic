'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TocGroup { title: string; items: { id: string; label: string }[] }

/** Index of the guide; the entry for the section on screen is highlighted (scroll-spy). */
export function LearnToc({ groups, label }: { groups: TocGroup[]; label: string }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ids = groups.flatMap(g => g.items.map(i => i.id));
    const els = ids.map(id => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const visible = new Set<string>();
    const pick = () => {
      // the first section (in page order) inside the reading band wins
      const first = ids.find(id => visible.has(id));
      if (first) setActive(first);
    };
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id); else visible.delete(e.target.id);
      }
      pick();
    }, { rootMargin: '-80px 0px -55% 0px' });
    els.forEach(el => io.observe(el));
    if (location.hash) setActive(location.hash.slice(1));
    return () => io.disconnect();
  }, [groups]);

  return (
    <nav aria-label={label} className="sticky top-20 hidden max-h-[calc(100dvh-96px)] w-56 shrink-0 flex-col gap-4 overflow-y-auto pb-4 text-[12.5px] lg:flex">
      {groups.map(g => (
        <div key={g.title}>
          <div className="mb-1.5 text-[10.5px] tracking-[0.14em] uppercase" style={{ color: 'var(--line)' }}>{g.title}</div>
          {g.items.map(i => {
            const on = active === i.id;
            return (
              <a key={i.id} href={`#${i.id}`} aria-current={on ? 'location' : undefined}
                onClick={() => setActive(i.id)}
                className={cn('relative block py-0.5 pl-3 transition-colors', on ? 'text-ink-hi' : 'text-ink hover:text-ink-hi')}>
                <span className={cn('absolute top-1/2 left-0 size-1.5 -translate-y-1/2 rounded-full transition-opacity', on ? 'opacity-100' : 'opacity-0')}
                  style={{ background: 'var(--glow)', boxShadow: '0 0 8px var(--glow)' }} />
                {i.label}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
