// "Inside" explorer: a computer you open level by level down to the logic gates.
// The top levels are drawn scenes driven by a tiny 4-bit machine; the lower levels
// are real circuits. Every level's inputs are what its parent was feeding it.

import { newComp, type Circuit, type Comp, type Kind, type Wire } from './circuit.ts';
import { simulate } from './sim.ts';

export type LevelId = 'pc' | 'board' | 'cpu' | 'alu' | 'fa' | 'ha';

/** The machine the top levels show: an accumulator that adds B on every clock tick. */
export interface Machine { acc: number; b: number; carry: number; ticks: number }

export const MACHINE0: Machine = { acc: 0, b: 3, carry: 0, ticks: 0 };

export function tick(m: Machine): Machine {
  const sum = m.acc + m.b;
  return { acc: sum & 15, b: m.b, carry: sum >> 4, ticks: m.ticks + 1 };
}

export const bits4 = (n: number) => [0, 1, 2, 3].map(i => (n >> i) & 1);
export const num = (bits: number[]) => bits.reduce((v, b, i) => v | (b ? 1 << i : 0), 0);

// ---------- circuits ----------

type P = [string, Kind, number, number, Partial<Comp>?];
type L = [string, number, string, number, number?];

function build(size: [number, number], parts: P[], links: L[]): Circuit {
  const comps = parts.map(([id, kind, x, y, extra]) => ({ ...newComp(kind, x, y), ...extra, id }));
  const wires: Wire[] = links.map(([a, p, b, q, bend], i) => ({ id: `w${i}`, from: { c: a, p }, to: { c: b, p: q }, ...(bend ? { bend } : {}) }));
  return { comps, wires, w: size[0], h: size[1] };
}

/** Four full adders in a staircase; each carry out feeds the next carry in. */
function aluCircuit(): Circuit {
  const parts: P[] = [], links: L[] = [];
  for (let i = 0; i < 4; i++) {
    const x = 6 + 7 * i, y = 2 + 5 * i;
    parts.push([`a${i}`, 'switch', x - 5, y - 1.5], [`b${i}`, 'switch', x - 5, y + 1], [`fa${i}`, 'fulladder', x, y], [`s${i}`, 'led', x + 7, y - 0.25]);
    links.push([`a${i}`, 0, `fa${i}`, 0], [`b${i}`, 0, `fa${i}`, 1], [`fa${i}`, 0, `s${i}`, 0]);
    if (i) links.push([`fa${i - 1}`, 1, `fa${i}`, 2]);
  }
  parts.push(['cout', 'led', 34, 18.25]);
  links.push(['fa3', 1, 'cout', 0]);
  return build([37, 21], parts, links);
}

/** Full adder: two half adders and an OR for the carry. */
function faCircuit(): Circuit {
  return build([31, 15],
    [
      ['a', 'switch', 1, 1], ['b', 'switch', 1, 4], ['cin', 'switch', 1, 9],
      ['ha1', 'halfadder', 7, 2], ['ha2', 'halfadder', 14, 7], ['or', 'or', 22, 11],
      ['s', 'led', 21, 6.75], ['cout', 'led', 28, 11],
    ],
    [
      ['a', 0, 'ha1', 0], ['b', 0, 'ha1', 1], ['ha1', 0, 'ha2', 0], ['cin', 0, 'ha2', 1],
      ['ha2', 0, 's', 0], ['ha1', 1, 'or', 0], ['ha2', 1, 'or', 1], ['or', 0, 'cout', 0],
    ],
  );
}

/** Half adder: XOR for the sum, AND for the carry. */
function haCircuit(): Circuit {
  return build([24, 16],
    [
      ['a', 'switch', 4, 5], ['b', 'switch', 4, 11],
      ['xor', 'xor', 11, 6], ['and', 'and', 11, 11],
      ['s', 'led', 18, 6], ['c', 'led', 18, 11],
    ],
    [['a', 0, 'xor', 0], ['a', 0, 'and', 0], ['b', 0, 'xor', 1], ['b', 0, 'and', 1], ['xor', 0, 's', 0], ['and', 0, 'c', 0]],
  );
}

export interface CircuitLevel {
  make: () => Circuit;
  inputs: string[];                 // switch ids, in the order the parent hands values down
  outputs: string[];                // led ids, for the readout
  open: Record<string, LevelId>;    // part id → level it opens
  gates: Record<string, Kind>;      // part id → guide lesson (the bottom of the path)
}

export const CIRCUITS: Partial<Record<LevelId, CircuitLevel>> = {
  alu: {
    make: aluCircuit,
    inputs: ['a0', 'a1', 'a2', 'a3', 'b0', 'b1', 'b2', 'b3'],
    outputs: ['s0', 's1', 's2', 's3', 'cout'],
    open: { fa0: 'fa', fa1: 'fa', fa2: 'fa', fa3: 'fa' },
    gates: {},
  },
  fa: {
    make: faCircuit,
    inputs: ['a', 'b', 'cin'],
    outputs: ['s', 'cout'],
    open: { ha1: 'ha', ha2: 'ha' },
    gates: { or: 'or' },
  },
  ha: {
    make: haCircuit,
    inputs: ['a', 'b'],
    outputs: ['s', 'c'],
    open: {},
    gates: { xor: 'xor', and: 'and' },
  },
};

/** Drawn scenes and what can be opened in each. */
export const SCENE_OPEN: Partial<Record<LevelId, LevelId[]>> = { pc: ['board'], board: ['cpu'], cpu: ['alu'] };

/** Circuit with its switches set to the given input values. */
export function withInputs(level: CircuitLevel, ins: number[]): Circuit {
  const c = level.make();
  level.inputs.forEach((id, i) => { const k = c.comps.find(x => x.id === id); if (k) k.on = !!ins[i]; });
  return c;
}

export function runLevel(level: CircuitLevel, ins: number[]) {
  return simulate(withInputs(level, ins), { pressed: new Set(), clocks: {} }, {});
}

// ---------- the path ----------

/** One open level: the hash segment that names it and the values it was given. */
export interface Stop { seg: string; level: LevelId; ins: number[] }

/** Hash segment → level: scenes use their own id, circuit parts use the part id (fa2 → fa). */
export function levelOf(parent: LevelId, seg: string): LevelId | null {
  const c = CIRCUITS[parent];
  if (c) return c.open[seg] ?? null;
  return SCENE_OPEN[parent]?.includes(seg as LevelId) ? (seg as LevelId) : null;
}

/** Values a child level starts with, taken from what its parent is doing right now. */
export function childInputs(parent: Stop, seg: string, m: Machine): number[] {
  if (parent.level === 'cpu') return [...bits4(m.acc), ...bits4(m.b)];
  const c = CIRCUITS[parent.level];
  if (!c) return [];
  return [...runLevel(c, parent.ins).inp[seg]];
}

export const ROOT: Stop = { seg: '', level: 'pc', ins: [] };

/** Rebuild the open levels from a hash such as `board/cpu/alu/fa2`, keeping what is already open. */
export function pathFromHash(hash: string, m: Machine, keep: Stop[] = [ROOT]): Stop[] {
  const segs = hash.replace(/^#/, '').split('/').filter(Boolean);
  const out: Stop[] = [ROOT];
  for (const seg of segs) {
    const parent = out[out.length - 1];
    const level = levelOf(parent.level, seg);
    if (!level) break;
    const kept = keep[out.length];
    out.push(kept && kept.seg === seg && keep[out.length - 1] === parent ? kept : { seg, level, ins: childInputs(parent, seg, m) });
  }
  return out;
}

export const hashOf = (path: Stop[]) => path.slice(1).map(s => s.seg).join('/');
