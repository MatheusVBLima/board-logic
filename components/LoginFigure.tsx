'use client';

import { useEffect, useMemo, useState } from 'react';
import { SPECS, newComp, routeWire, type Circuit, type Comp, type Kind } from '@/lib/circuit';
import { makeProj } from '@/lib/iso';
import { simulate } from '@/lib/sim';
import { Box, Pads, Part, leadPaths } from '@/components/Part';

const pr = makeProj(true, 20);
const KEYS = ['a', 'b', 'c'] as const;
type Key = (typeof KEYS)[number];

/** Three switches feed AND, OR, XOR and NAND; each gate lights its LED and one bit of the display. */
function makeCircuit(): Circuit {
  const parts: [string, Kind, number, number][] = [
    ['a', 'switch', 1, 3], ['b', 'switch', 1, 8], ['c', 'switch', 1, 13],
    ['and', 'and', 7, 1], ['or', 'or', 7, 5], ['xor', 'xor', 7, 10], ['nand', 'nand', 7, 14],
    ['and-l', 'led', 13, 1], ['or-l', 'led', 13, 5], ['xor-l', 'led', 13, 10], ['nand-l', 'led', 13, 14],
    ['hex', 'seg7', 19, 6],
  ];
  const links: [string, number, string, number, number?][] = [
    ['a', 0, 'and', 0], ['b', 0, 'and', 1],
    ['a', 0, 'or', 0], ['b', 0, 'or', 1],
    ['b', 0, 'xor', 0], ['c', 0, 'xor', 1],
    ['b', 0, 'nand', 0], ['c', 0, 'nand', 1],
    ['and', 0, 'and-l', 0], ['or', 0, 'or-l', 0], ['xor', 0, 'xor-l', 0], ['nand', 0, 'nand-l', 0],
    ['and', 0, 'hex', 0, 1], ['or', 0, 'hex', 1, 1], ['xor', 0, 'hex', 2, 1], ['nand', 0, 'hex', 3, 1],
  ];
  const comps: Comp[] = parts.map(([id, kind, x, y]) => ({ ...newComp(kind, x, y), id }));
  return {
    comps, w: 23, h: 17,
    wires: links.map(([from, p, to, q, bend], i) => ({ id: `w${i}`, from: { c: from, p }, to: { c: to, p: q }, ...(bend ? { bend } : {}) })),
  };
}

/** Big iso logic board beside the sign-in form. It counts through A B C by itself until a switch is clicked. */
export function LoginFigure({ className, label }: { className?: string; label: string }) {
  const base = useMemo(makeCircuit, []);
  const [auto, setAuto] = useState(true);
  const [ins, setIns] = useState<Record<Key, boolean>>({ a: true, b: false, c: true });
  useEffect(() => {
    if (!auto || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setIns(s => {
      const n = ((+s.a << 2) | (+s.b << 1) | +s.c) + 1;
      return { a: !!(n & 4), b: !!(n & 2), c: !!(n & 1) };
    }), 1800);
    return () => clearInterval(id);
  }, [auto]);
  const toggle = (k: Key) => { setAuto(false); setIns(s => ({ ...s, [k]: !s[k] })); };

  const circ: Circuit = useMemo(
    () => ({ ...base, comps: base.comps.map(c => (c.id in ins ? { ...c, on: ins[c.id as Key] } : c)) }),
    [base, ins],
  );
  const sim = useMemo(() => simulate(circ, { pressed: new Set(), clocks: {} }, {}), [circ]);
  const st = (id: string) => ({ ins: sim.inp[id] ?? [], outs: sim.out[id] ?? [] });

  const ox = 0.5, oy = 0.5, w = circ.w! - 1, h = circ.h! - 1;
  const pts = [[ox - 2.6, oy - 2.6], [ox + w + 2.6, oy - 2.6], [ox - 2.6, oy + h + 3.6], [ox + w + 2.6, oy + h + 3.6]].flatMap(([x, y]) => [pr.P(x, y, -1), pr.P(x, y, 1)]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const vb = `${Math.min(...xs) - 10} ${Math.min(...ys) - 10} ${Math.max(...xs) - Math.min(...xs) + 20} ${Math.max(...ys) - Math.min(...ys) + 20}`;
  const TOP0 = pr.TOP(0, 0, 0);
  const sorted = [...circ.comps].sort((p, q) => p.x + p.y + (SPECS[p.kind].w + SPECS[p.kind].d) / 2 - (q.x + q.y + (SPECS[q.kind].w + SPECS[q.kind].d) / 2));
  const wires = circ.wires.map(wi => ({ id: wi.id, d: routeWire(circ, wi), on: !!sim.out[wi.from.c]?.[wi.from.p] }));
  const leads = circ.comps.flatMap(c => leadPaths(c, st(c.id)));

  return (
    <svg viewBox={vb} className={`board-svg ${className ?? ''}`} role="img" aria-label={label}>
      <Box pr={pr} x={ox - 2.6} y={oy - 2.6} z={-0.95} w={w + 5.2} d={h + 6.2} h={0.45} r={1.1} cls="plate" />
      <Box pr={pr} x={ox - 1.5} y={oy - 2} z={-0.5} w={w + 3} d={h + 4} h={0.5} r={0.35} />
      <g transform={pr.TOP(ox - 1.5, oy - 2, 0)}>
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
      {sorted.map(c => {
        if (!(c.id in ins)) return <Part key={c.id} pr={pr} c={c} st={st(c.id)} />;
        const k = c.id as Key;
        return (
          <g key={c.id} className="preview-switch" onClick={() => toggle(k)}>
            <Part pr={pr} c={c} st={st(c.id)} tag={k.toUpperCase()} />
            <g transform={pr.TOP(c.x - 0.3, c.y + 0.1, 0.4)}><rect className="preview-hit" width={2.6} height={2} rx={0.4} /></g>
          </g>
        );
      })}
    </svg>
  );
}
