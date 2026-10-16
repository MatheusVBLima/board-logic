import { useMemo } from 'react';
import { SPECS, newComp, type Kind } from '@/lib/circuit';
import { makeProj } from '@/lib/iso';
import { Pads, Part, leadPaths, type PartState } from '@/components/Part';
import { cn } from '@/lib/utils';

const iconProj = makeProj(true, 20);

/** A small drawing of a part, used in the dock and the learning panel. */
export function PartIcon({ kind, className }: { kind: Kind; className?: string }) {
  const c = useMemo(() => {
    const k = newComp(kind, 0, 0);
    k.id = 'icon-' + kind;
    if (kind === 'switch') k.on = true;
    return k;
  }, [kind]);
  const s = SPECS[kind];
  const pts = [[-1.2, 0], [s.w + 1.2, 0], [-1.2, s.d], [s.w + 1.2, s.d]]
    .flatMap(([x, y]) => [iconProj.P(x, y, 0), iconProj.P(x, y, 0.9)]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
  const on = kind === 'switch' || kind === 'const';
  const st: PartState = { ins: kind === 'led' ? [1] : s.ins.map(() => 0), outs: s.outs.map(() => (on ? 1 : 0)) };
  return (
    <svg viewBox={`${x0 - 4} ${y0 - 4} ${w + 8} ${h + 8}`} className={cn('board-svg pointer-events-none h-[50px] w-[80px]', className)} aria-hidden>
      <g transform={iconProj.TOP(0, 0, 0)}>
        {leadPaths(c, st).map(l => <path key={l.key} className={cn('wire', l.on && 'hot')} d={l.d} />)}
        <Pads c={c} st={st} />
      </g>
      <Part pr={iconProj} c={c} st={st} tag={kind === 'switch' ? 'A' : undefined} />
    </svg>
  );
}
