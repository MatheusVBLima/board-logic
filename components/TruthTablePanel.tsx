'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { type Circuit } from '@/lib/circuit';
import { useI18n } from '@/lib/i18n/client';
import { MAX_TT_INPUTS, columnExpression, switchesOf, truthTable } from '@/lib/truth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const glowText = { color: 'var(--glow)', textShadow: '0 0 8px var(--glow)' };

/** Floating panel with the live truth table and Boolean expression of the circuit. */
export function TruthTablePanel({ circ, onClose }: { circ: Circuit; onClose: () => void }) {
  const { t } = useI18n();
  const table = useMemo(() => truthTable(circ), [circ]);
  const tooMany = switchesOf(circ).length > MAX_TT_INPUTS;

  return (
    <section aria-label={t.truth.title}
      className="absolute top-3 right-3 z-10 flex max-h-[calc(100%-24px)] w-[min(340px,calc(100%-24px))] flex-col rounded-xl border border-edge bg-panel/95 shadow-xl shadow-black/50 backdrop-blur">
      <header className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <h2 className="text-[12px] tracking-[0.14em] text-ink-hi uppercase">{t.truth.title}</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t.truth.close}><X /></Button>
      </header>
      <div className="min-h-0 overflow-y-auto px-3 pb-3 text-[12px]">
        {!table ? (
          <p className="leading-relaxed text-ink">{tooMany ? t.truth.tooMany(MAX_TT_INPUTS) : t.truth.needInputs}</p>
        ) : (
          <>
            <p className="mb-2 leading-relaxed text-ink">{t.truth.desc}</p>
            {table.sequential && <p className="mb-2 leading-relaxed text-ink-hi/80">{t.truth.sequential}</p>}
            <table className="w-full border-collapse text-center tabular-nums">
              <thead>
                <tr className="border-b border-edge text-ink">
                  {table.inputs.map(i => <th key={i.id} className="px-1 pb-1 font-normal">{i.label}</th>)}
                  {table.outputs.map((o, j) => (
                    <th key={o.id} className={cn('px-1 pb-1 font-normal text-ink-hi', j === 0 && 'border-l border-edge')}>{o.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, m) => (
                  <tr key={m} className="border-b border-edge/40 last:border-0">
                    {r.ins.map((v, j) => <td key={j} className="py-0.5 text-ink">{v}</td>)}
                    {r.outs.map((v, j) => (
                      <td key={`o${j}`} className={cn('py-0.5', j === 0 && 'border-l border-edge', r.unstable ? 'text-destructive' : 'text-ink-hi')}
                        style={!r.unstable && table.outputs[j].kind === 'led' && v ? glowText : undefined}>
                        {r.unstable ? '~' : table.outputs[j].kind === 'seg7' ? v.toString(16).toUpperCase() : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {table.outputs.some(o => o.kind === 'led') && (
              <div className="mt-3 border-t border-edge pt-2">
                <div className="mb-1 text-[10.5px] tracking-[0.14em] uppercase" style={{ color: 'var(--line)' }}>{t.truth.expression}</div>
                {table.outputs.map((o, j) => {
                  if (o.kind !== 'led') return null;
                  const e = columnExpression(table, j);
                  return (
                    <div key={o.id} className="py-0.5 leading-relaxed break-words text-ink-hi">
                      <span className="text-ink">{o.label} = </span>
                      {e === null ? <span className="text-destructive">{t.truth.unstable}</span>
                        : e === '0' ? <span className="text-ink">0 <span className="text-[11px]">({t.truth.alwaysZero})</span></span>
                        : e === '1' ? <span>1 <span className="text-[11px] text-ink">({t.truth.alwaysOne})</span></span>
                        : e}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
