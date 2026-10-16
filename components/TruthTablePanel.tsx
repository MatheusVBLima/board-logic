'use client';

import { useId, useMemo } from 'react';
import { Table2, X } from 'lucide-react';
import { type Circuit } from '@/lib/circuit';
import { useI18n } from '@/lib/i18n/client';
import { MAX_TT_INPUTS, columnExpression, switchesOf, truthTable } from '@/lib/truth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/optics/card';
import { TruthTableMotif } from '@/components/TruthTableMotif';
import { cn } from '@/lib/utils';

const glowText = { color: 'var(--glow)', textShadow: '0 0 8px var(--glow)' };

/** Floating panel with the live truth table and Boolean expression of the circuit. */
export function TruthTablePanel({ circ, onClose }: { circ: Circuit; onClose: () => void }) {
  const { t } = useI18n();
  const panelId = useId();
  const table = useMemo(() => truthTable(circ), [circ]);
  const tooMany = switchesOf(circ).length > MAX_TT_INPUTS;

  return (
    <Card decorations role="region" aria-labelledby={`${panelId}-title`} aria-describedby={`${panelId}-description`} data-truth-panel
      className="absolute top-3 right-3 z-10 flex max-h-[calc(100%-24px)] min-h-0 w-[min(340px,calc(100%-24px))] flex-col gap-0 border border-edge bg-background py-0 ring-0 shadow-xl shadow-black/50">
      <header className="relative shrink-0 overflow-hidden border-b border-edge px-5 py-4">
        <TruthTableMotif className="pointer-events-none absolute -top-3 right-3 h-36 w-44 text-ink/25 opacity-60" />
        <div className="relative flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 text-[10px] tracking-[0.13em] text-ink">
            <Table2 className="size-3.5 shrink-0 text-glow" />
            {table && <span className="truncate">{table.inputs.map(input => input.label).join(', ')}<span className="px-2 text-ink/40">→</span>{table.outputs.map(output => output.label).join(', ')}</span>}
          </p>
          <Button variant="ghost" size="icon-sm" className="-mr-2 text-ink" onClick={onClose} aria-label={t.truth.close}><X /></Button>
        </div>
        <h2 id={`${panelId}-title`} className="relative mt-1 max-w-[245px] text-[19px] leading-snug tracking-[-0.03em] text-ink-hi">{t.truth.title}</h2>
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4 text-[12px]">
        <p id={`${panelId}-description`} className="mb-4 leading-relaxed text-ink">{t.truth.desc}</p>
        {!table ? (
          <p className="rounded-lg border border-edge bg-panel px-3 py-3 leading-relaxed text-ink-hi">{tooMany ? t.truth.tooMany(MAX_TT_INPUTS) : t.truth.needInputs}</p>
        ) : (
          <>
            {table.sequential && <p className="mb-4 border-l-2 border-glow/40 pl-3 leading-relaxed text-ink-hi/80">{t.truth.sequential}</p>}
            <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center tabular-nums">
              <caption className="sr-only">{t.truth.title}</caption>
              <thead>
                <tr className="border-b border-edge text-ink">
                  {table.inputs.map(i => <th key={i.id} scope="col" className="min-w-8 px-2 pb-2 font-normal">{i.label}</th>)}
                  {table.outputs.map((o, j) => (
                    <th key={o.id} scope="col" className={cn('min-w-8 px-2 pb-2 font-normal text-ink-hi', j === 0 && 'border-l border-edge')}>{o.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, m) => (
                  <tr key={m} className="border-b border-edge/40 last:border-0 hover:bg-panel">
                    {r.ins.map((v, j) => <td key={j} className="px-2 py-1.5 text-ink">{v}</td>)}
                    {r.outs.map((v, j) => (
                      <td key={`o${j}`} className={cn('px-2 py-1.5', j === 0 && 'border-l border-edge', r.unstable ? 'text-destructive' : 'text-ink-hi')}
                        style={!r.unstable && table.outputs[j].kind === 'led' && v ? glowText : undefined}>
                        {r.unstable ? '~' : table.outputs[j].kind === 'seg7' ? v.toString(16).toUpperCase() : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {table.outputs.some(o => o.kind === 'led') && (
              <section className="mt-4 border-t border-edge pt-4" aria-labelledby={`${panelId}-expression`}>
                <h3 id={`${panelId}-expression`} className="challenge-caption mb-2">{t.truth.expression}</h3>
                <div className="space-y-2">
                {table.outputs.map((o, j) => {
                  if (o.kind !== 'led') return null;
                  const e = columnExpression(table, j);
                  return (
                    <div key={o.id} className="rounded-md border border-edge bg-panel px-3 py-2 leading-relaxed break-words text-ink-hi">
                      <span className="text-ink">{o.label} = </span>
                      {e === null ? <span className="text-destructive">{t.truth.unstable}</span>
                        : e === '0' ? <span className="text-ink">0 <span className="text-[11px]">({t.truth.alwaysZero})</span></span>
                        : e === '1' ? <span>1 <span className="text-[11px] text-ink">({t.truth.alwaysOne})</span></span>
                        : e}
                    </div>
                  );
                })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
