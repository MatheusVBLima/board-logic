'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { SPECS, routeWire, type Circuit } from '@/lib/circuit';
import { makeProj } from '@/lib/iso';
import type { SimResult } from '@/lib/sim';
import { Box, Pads, Part, leadPaths } from '@/components/Part';

const pr = makeProj(true, 20);

export type OpenHandler = (id: string, el: Element) => void;

/** Lets a drawn group act as a button: click, Enter or Space. */
export function pressable(label: string, onPress: (el: Element) => void, target?: string) {
  return {
    role: 'button', tabIndex: 0, 'aria-label': label, 'data-open': target,
    onClick: (e: MouseEvent<SVGGElement>) => onPress(e.currentTarget),
    onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPress(e.currentTarget); }
    },
  };
}

/**
 * A circuit level on a small iso board: its switches toggle, and the parts that hold
 * another level (or lead to a gate's lesson) glow on hover and open on click.
 */
export function CircuitView({ circ, sim, tags, openable, onToggle, onOpen, label }: {
  circ: Circuit;
  sim: SimResult;
  tags: Record<string, string>;
  openable: Record<string, string>;   // part id → accessible name of what it opens
  onToggle: (id: string) => void;
  onOpen: OpenHandler;
  label: string;
}) {
  const st = (id: string) => ({ ins: sim.inp[id] ?? [], outs: sim.out[id] ?? [] });
  // crop the board to the parts, so a small circuit still fills the stage
  const x0 = Math.min(...circ.comps.map(c => c.x)) - 1.6, y0 = Math.min(...circ.comps.map(c => c.y)) - 0.8;
  const x1 = Math.max(...circ.comps.map(c => c.x + SPECS[c.kind].w)) + 1.6, y1 = Math.max(...circ.comps.map(c => c.y + SPECS[c.kind].d)) + 0.8;
  const pts = [[x0 - 0.6, y0 - 0.6], [x1 + 0.6, y0 - 0.6], [x0 - 0.6, y1 + 0.6], [x1 + 0.6, y1 + 0.6]].flatMap(([x, y]) => [pr.P(x, y, -1), pr.P(x, y, 1.2)]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const vb = `${Math.min(...xs) - 6} ${Math.min(...ys) - 6} ${Math.max(...xs) - Math.min(...xs) + 12} ${Math.max(...ys) - Math.min(...ys) + 12}`;
  const TOP0 = pr.TOP(0, 0, 0);
  const depth = (k: Circuit['comps'][number]) => k.x + k.y + (SPECS[k.kind].w + SPECS[k.kind].d) / 2;
  const sorted = [...circ.comps].sort((p, q) => depth(p) - depth(q));
  const wires = circ.wires.map(wi => ({ id: wi.id, d: routeWire(circ, wi), on: !!sim.out[wi.from.c]?.[wi.from.p] }));
  const leads = circ.comps.flatMap(c => leadPaths(c, st(c.id)));

  return (
    <svg viewBox={vb} className="board-svg h-full w-full" role="group" aria-label={label}>
      <Box pr={pr} x={x0 - 0.6} y={y0 - 0.6} z={-0.95} w={x1 - x0 + 1.2} d={y1 - y0 + 1.2} h={0.45} r={1.1} cls="plate" />
      <Box pr={pr} x={x0} y={y0} z={-0.5} w={x1 - x0} d={y1 - y0} h={0.5} r={0.35} />
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
        const s = SPECS[c.kind];
        const part = <Part key={c.id} pr={pr} c={c} st={st(c.id)} tag={tags[c.id]} />;
        if (c.kind === 'switch') {
          return (
            <g key={c.id} className="preview-switch" {...pressable(tags[c.id] ?? c.id, () => onToggle(c.id))}>
              {part}
              <g transform={pr.TOP(c.x - 0.3, c.y + 0.1, 0.4)}><rect className="preview-hit" width={2.6} height={2} rx={0.4} /></g>
            </g>
          );
        }
        if (!openable[c.id]) return part;
        return (
          <g key={c.id} className="inside-open" {...pressable(openable[c.id], el => onOpen(c.id, el), c.id)}>
            <g transform={pr.TOP(c.x - 0.15, c.y + 0.05, 0.02)}>
              <rect className="inside-ring" width={s.w + 0.3} height={s.d - 0.1} rx={0.3} />
            </g>
            {part}
          </g>
        );
      })}
    </svg>
  );
}
