'use client';

import { useCallback, useState } from 'react';
import { BoardPreview, type PreviewState } from '@/components/BoardPreview';
import { useI18n } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';

const ROWS = [[0, 0], [0, 1], [1, 0], [1, 1]];

/** The landing's framed example: the half adder, its inputs, outputs and live truth table. Toggle only. */
export function LandingBoard() {
  const { t } = useI18n();
  const L = t.landing;
  const [ins, setIns] = useState<{ a: boolean; b: boolean } | null>(null);
  const [s, setS] = useState<PreviewState>({ a: true, b: false, sum: true, carry: false });
  const onState = useCallback((x: PreviewState) => setS(x), []);
  const toggle = (id: 'a' | 'b') => setIns(cur => {
    const now = cur ?? { a: s.a, b: s.b };
    return { ...now, [id]: !now[id] };
  });

  return (
    <div className="lb-frame">
      <span className="lb-corner lb-corner-tl" aria-hidden /><span className="lb-corner lb-corner-br" aria-hidden />

      <div className="lb-toolbar">
        <span className="lb-chip lb-chip-solid">{L.example}</span>
        <span className="lb-chip">{L.exampleName}</span>
        <span className="lb-chip lb-chip-opt">{L.readOnly}</span>
        <span className="ml-auto flex items-center gap-2 lb-label">
          <span className={cn('lb-led', ins && 'lb-led-on')} />{ins ? L.yours : L.playing}
        </span>
      </div>

      <div className="lb-body">
        <aside className="lb-side">
          <p className="lb-label">{L.inputs}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(['a', 'b'] as const).map(id => (
              <button key={id} type="button" className={cn('lb-key', s[id] && 'lb-key-on')} aria-pressed={s[id]} onClick={() => toggle(id)}>
                <span>{id.toUpperCase()}</span><span className="lb-bit">{+s[id]}</span>
              </button>
            ))}
          </div>

          <p className="lb-label mt-6">{L.outputs}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {([['S', L.sum, s.sum], ['C', L.carry, s.carry]] as const).map(([k, name, on]) => (
              <div key={k} className={cn('lb-out', on && 'lb-out-on')}>
                <span className="lb-led" /><span>{k}</span><span className="lb-sub">{name}</span>
              </div>
            ))}
          </div>

          <p className="lb-label mt-6">{L.truthTable}</p>
          <table className="lb-table mt-3">
            <thead><tr><th>A</th><th>B</th><th>S</th><th>C</th></tr></thead>
            <tbody>
              {ROWS.map(([a, b]) => (
                <tr key={`${a}${b}`} className={cn(+s.a === a && +s.b === b && 'lb-row-on')}>
                  <td>{a}</td><td>{b}</td><td>{a ^ b}</td><td>{a & b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>

        <div className="lb-canvas">
          <BoardPreview className="h-full w-full" ins={ins ?? undefined} onToggle={toggle} onState={onState} label={L.exampleName} />
          <p className="lb-hint">{L.hint}</p>
        </div>
      </div>
    </div>
  );
}
