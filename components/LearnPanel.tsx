import Link from 'next/link';
import { ArrowUpRight, BookOpenText, Plus, Trophy, X } from 'lucide-react';
import { type Kind } from '@/lib/circuit';
import { useI18n } from '@/lib/i18n/client';
import { GROUPS, getLearn } from '@/lib/learn';
import { PartIcon } from '@/components/PartIcon';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const W = 288;

/** Compact left sidebar: one line per part, with a link to the full guide. */
export function LearnPanel({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (k: Kind) => void }) {
  const { t, locale, href } = useI18n();
  const L = getLearn(locale);
  return (
    <div
      className={cn(
        // mobile: slides over the board; desktop: takes room in the layout and animates its width
        'fixed inset-y-3 left-3 z-30 transition-[transform,opacity] duration-300 ease-out',
        'md:static md:inset-auto md:z-auto md:shrink-0 md:overflow-hidden md:transition-[width,margin,opacity]',
        open ? 'translate-x-0 opacity-100 md:w-[288px]' : 'pointer-events-none -translate-x-[calc(100%+24px)] opacity-0 md:-mr-3 md:w-0 md:translate-x-0',
      )}
      aria-hidden={!open} inert={!open}>
      <aside aria-label={t.nav.learn}
        className="flex h-full max-w-[calc(100vw-24px)] flex-col rounded-[22px] border border-edge bg-panel shadow-2xl shadow-black/60 md:shadow-none"
        style={{ width: W }}>
        <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
          <span className="text-[13px] tracking-[0.14em] text-ink-hi uppercase">{t.nav.learn}</span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t.learn.close}><X /></Button>
        </div>
        <div className="flex flex-col gap-1.5 px-3 pb-2">
          <Button asChild variant="outline" size="sm" className="w-full justify-between border-edge text-ink-hi">
            <Link href={href('/learn')}><span className="flex items-center gap-2"><BookOpenText />{t.learn.fullGuide}</span><ArrowUpRight /></Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full justify-between border-edge text-ink-hi">
            <Link href={href('/challenges')}><span className="flex items-center gap-2"><Trophy />{t.nav.challenges}</span><ArrowUpRight /></Link>
          </Button>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-3 px-2 pb-3">
            {GROUPS.map(g => (
              <section key={g} className="flex flex-col">
                <h3 className="px-2 pb-1 text-[10.5px] tracking-[0.14em] uppercase" style={{ color: 'var(--line)' }}>{L.groupNames[g]}</h3>
                {L.lessons.filter(l => l.group === g).map(l => (
                  <div key={l.kind} className="group flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-accent">
                    <PartIcon kind={l.kind} className="h-[30px] w-[46px] shrink-0" />
                    <Link href={`${href('/learn')}#${l.kind}`} className="min-w-0 flex-1">
                      <div className="text-[12px] tracking-[0.06em] text-ink-hi uppercase">{t.parts[l.kind]}</div>
                      <div className="text-[11px] leading-snug text-ink">{l.summary}</div>
                    </Link>
                    <Button variant="ghost" size="icon-sm" className="shrink-0 opacity-70 group-hover:opacity-100"
                      onClick={() => onAdd(l.kind)} aria-label={t.learn.placeNamed(t.parts[l.kind])} title={t.learn.placeOnBoard}>
                      <Plus />
                    </Button>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
}
