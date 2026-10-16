'use client';

import { useEffect, useMemo, useState } from 'react';
import { SPECS, routeWire, type Circuit } from '@/lib/circuit';
import { EXAMPLES } from '@/lib/examples';
import { makeProj } from '@/lib/iso';
import { simulate } from '@/lib/sim';
import { Box, Pads, Part, leadPaths } from '@/components/Part';

const pr = makeProj(true, 20);
const STEPS = [[0, 0], [1, 0], [1, 1], [0, 1]];

/** The half adder on a small iso board, flipping its switches by itself (landing page). */
export function BoardPreview({ className }: { className?: string }) {
  const base = useMemo(() => EXAMPLES[0].make(), []);
  const [step, setStep] = useState(1);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setStep(s => (s + 1) % STEPS.length), 1600);
    return () => clearInterval(id);
  }, []);

  const circ: Circuit = useMemo(() => {
    const [a, b] = STEPS[step];
    return { ...base, comps: base.comps.map(c => (c.id === 'a' ? { ...c, on: !!a } : c.id === 'b' ? { ...c, on: !!b } : c)) };
  }, [base, step]);
  const sim = useMemo(() => simulate(circ, { pressed: new Set(), clocks: {} }, {}), [circ]);
  const st = (id: string) => ({ ins: sim.inp[id] ?? [], outs: sim.out[id] ?? [] });
  const w = circ.w!, h = circ.h!;
  const pts = [[-2.6, -2.6], [w + 2.6, -2.6], [-2.6, h + 3.6], [w + 2.6, h + 3.6]].flatMap(([x, y]) => [pr.P(x, y, -1), pr.P(x, y, 1)]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const vb = `${Math.min(...xs) - 10} ${Math.min(...ys) - 10} ${Math.max(...xs) - Math.min(...xs) + 20} ${Math.max(...ys) - Math.min(...ys) + 20}`;
  const TOP0 = pr.TOP(0, 0, 0);
  const sorted = [...circ.comps].sort((p, q) => p.x + p.y + (SPECS[p.kind].w + SPECS[p.kind].d) / 2 - (q.x + q.y + (SPECS[q.kind].w + SPECS[q.kind].d) / 2));
  const wires = circ.wires.map(wi => ({ id: wi.id, d: routeWire(circ, wi), on: !!sim.out[wi.from.c]?.[wi.from.p] }));
  const leads = circ.comps.flatMap(c => leadPaths(c, st(c.id)));

  return (
    <svg viewBox={vb} className={`board-svg ${className ?? ''}`} role="img" aria-label="Half adder">
      <Box pr={pr} x={-2.6} y={-2.6} z={-0.95} w={w + 5.2} d={h + 6.2} h={0.45} r={1.1} cls="plate" />
      <Box pr={pr} x={-1.5} y={-2} z={-0.5} w={w + 3} d={h + 4} h={0.5} r={0.35} />
      <g transform={pr.TOP(-1.5, -2, 0)}>
        <rect className="detail" x={0.2} y={0.2} width={w + 2.6} height={h + 3.6} rx={0.22} />
      </g>
      <g transform={TOP0}>
        {leads.filter(l => !l.on).map(l => <path key={l.key} className="wire" d={l.d} />)}
        {wires.filter(x => !x.on).map(x => <g key={x.id}><path className="wire-under" d={x.d} /><path className="wire" d={x.d} /></g>)}
      </g>
      <g filter="url(#soft)"><g transform={TOP0}>
        {leads.filter(l => l.on).map(l => <path key={l.key} className="wire hot" d={l.d} />)}
        {wires.filter(x => x.on).map(x => <g key={x.id}><path className="wire-under" d={x.d} /><path className="wire hot" d={x.d} /></g>)}
      </g></g>
      <g transform={TOP0}>{circ.comps.map(c => <Pads key={c.id} c={c} st={st(c.id)} />)}</g>
      {sorted.map(c => <Part key={c.id} pr={pr} c={c} st={st(c.id)} tag={c.id === 'a' ? 'A' : c.id === 'b' ? 'B' : undefined} />)}
    </svg>
  );
}
