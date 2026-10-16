import { Plus, X } from 'lucide-react';
import { SPECS, type Kind } from '@/lib/circuit';
import { LESSONS } from '@/lib/learn';
import { PartIcon } from '@/components/PartIcon';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const GROUPS = ['Entradas', 'Portas lógicas', 'Memória', 'Saídas'] as const;

/** Left sidebar explaining every part, with truth tables and a button to drop it on the board. */
export function LearnPanel({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (k: Kind) => void }) {
  return (
    <aside aria-label="Aprender" aria-hidden={!open}
      className={cn(
        'z-30 flex min-h-0 flex-col rounded-[22px] border border-edge bg-panel',
        'fixed inset-y-3 left-3 w-[min(360px,calc(100vw-24px))] shadow-2xl shadow-black/60 transition-transform duration-200',
        'md:static md:inset-auto md:w-[340px] md:shrink-0 md:shadow-none md:transition-none',
        open ? 'translate-x-0' : '-translate-x-[calc(100%+24px)] md:hidden',
      )}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="text-[13px] tracking-[0.14em] text-ink-hi uppercase">Aprender</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar"><X /></Button>
      </div>
      <p className="px-5 pb-3 text-xs leading-relaxed text-ink">
        Cada peça recebe e manda sinais de 0 (desligado) ou 1 (ligado). Os fios levam o sinal de uma saída
        (à direita da peça) para uma entrada (à esquerda) e acendem quando estão em 1.
      </p>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 px-3 pb-4">
          {GROUPS.map(g => (
            <section key={g} className="flex flex-col gap-2">
              <h3 className="px-2 text-[11px] tracking-[0.14em] uppercase" style={{ color: 'var(--line)' }}>{g}</h3>
              {LESSONS.filter(l => l.group === g).map(l => (
                <article key={l.kind} className="rounded-xl border border-edge bg-background/60 p-3">
                  <div className="flex items-center gap-3">
                    <PartIcon kind={l.kind} className="h-[44px] w-[68px] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] tracking-[0.08em] text-ink-hi uppercase">{SPECS[l.kind].name}</div>
                      {SPECS[l.kind].part && <div className="text-[11px] text-ink">chip {SPECS[l.kind].part}</div>}
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => onAdd(l.kind)} aria-label={`Colocar ${SPECS[l.kind].name} no board`} title="Colocar no board">
                      <Plus />
                    </Button>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-hi/90">{l.what}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink">{l.use}</p>
                  {l.table && (
                    <table className="mt-2.5 w-full border-collapse text-center text-xs">
                      <thead>
                        <tr>{l.table.head.map(h => <th key={h} className="border-b border-edge pb-1 font-normal text-ink">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {l.table.rows.map((r, i) => (
                          <tr key={i}>
                            {r.map((v, j) => (
                              <td key={j} className={cn('py-0.5 tabular-nums',
                                j === r.length - 1 ? (v === '1' ? 'text-glow' : 'text-ink-hi') : 'text-ink')}>{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </article>
              ))}
            </section>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
