// Truth table of the circuit on the board: switches are the inputs (A, B, C...),
// LEDs (L1, L2...) and hex displays are the outputs. Every switch combination is
// simulated from a clean state.

import { type Circuit, type Comp } from './circuit.ts';
import { hexValue, simulate } from './sim.ts';

export const MAX_TT_INPUTS = 6;

export interface TTOutput { id: string; label: string; kind: 'led' | 'seg7' }
export interface TTRow { ins: number[]; outs: number[]; unstable: boolean }
export interface TruthTable {
  inputs: { id: string; label: string }[];
  outputs: TTOutput[];
  rows: TTRow[];
  /** has flip-flops or clocks: the outputs also depend on the past */
  sequential: boolean;
}

export const switchesOf = (c: Circuit) => c.comps.filter(k => k.kind === 'switch');
export const ledsOf = (c: Circuit) => c.comps.filter(k => k.kind === 'led');
export const switchLabel = (i: number) => String.fromCharCode(65 + i);
export const ledLabel = (i: number) => `L${i + 1}`;

/** Outputs of the circuit for one assignment of the switches (in board order). */
export function evalWith(c: Circuit, sw: Comp[], bits: number[]) {
  const on = new Map(sw.map((s, i) => [s.id, !!bits[i]]));
  const circ: Circuit = { ...c, comps: c.comps.map(k => (on.has(k.id) ? { ...k, on: on.get(k.id) } : k)) };
  return simulate(circ, { pressed: new Set(), clocks: {} }, {});
}

export function truthTable(c: Circuit, maxInputs = MAX_TT_INPUTS): TruthTable | null {
  const sw = switchesOf(c);
  const leds = ledsOf(c);
  const hexes = c.comps.filter(k => k.kind === 'seg7');
  if (!sw.length || (!leds.length && !hexes.length) || sw.length > maxInputs) return null;
  const outputs: TTOutput[] = [
    ...leds.map((k, i) => ({ id: k.id, label: ledLabel(i), kind: 'led' as const })),
    ...hexes.map((k, i) => ({ id: k.id, label: hexes.length > 1 ? `HEX${i + 1}` : 'HEX', kind: 'seg7' as const })),
  ];
  const n = sw.length;
  const rows: TTRow[] = [];
  for (let m = 0; m < 1 << n; m++) {
    const ins = Array.from({ length: n }, (_, j) => (m >> (n - 1 - j)) & 1);
    const r = evalWith(c, sw, ins);
    const outs = outputs.map(o => (o.kind === 'led' ? (r.inp[o.id]?.[0] ?? 0) : hexValue(r.inp[o.id] ?? [0, 0, 0, 0])));
    rows.push({ ins, outs, unstable: r.unstable });
  }
  return {
    inputs: sw.map((k, i) => ({ id: k.id, label: switchLabel(i) })),
    outputs, rows,
    sequential: c.comps.some(k => k.kind === 'dff' || k.kind === 'clock'),
  };
}

// ---------- Boolean expression (Quine–McCluskey) ----------

interface Imp { v: number; dc: number } // value bits, don't-care mask

/** Minimal-ish sum of products for the given minterms over n variables. */
export function minimize(n: number, minterms: number[]): Imp[] | 0 | 1 {
  const all = (1 << n) - 1;
  if (!minterms.length) return 0;
  if (minterms.length === 1 << n) return 1;
  let cur: Imp[] = minterms.map(v => ({ v, dc: 0 }));
  const primes: Imp[] = [];
  const key = (i: Imp) => `${i.v}/${i.dc}`;
  while (cur.length) {
    const used = new Set<string>();
    const next = new Map<string, Imp>();
    for (let i = 0; i < cur.length; i++) {
      for (let j = i + 1; j < cur.length; j++) {
        const a = cur[i], b = cur[j];
        if (a.dc !== b.dc) continue;
        const d = a.v ^ b.v;
        if (d && !(d & (d - 1))) {
          const m = { v: a.v & ~d & all, dc: a.dc | d };
          next.set(key(m), m);
          used.add(key(a)); used.add(key(b));
        }
      }
    }
    for (const i of cur) if (!used.has(key(i)) && !primes.some(p => key(p) === key(i))) primes.push(i);
    cur = [...next.values()];
  }
  const covers = (p: Imp, m: number) => (m & ~p.dc) === p.v;
  const left = new Set(minterms);
  const chosen: Imp[] = [];
  // essential primes first
  for (const m of minterms) {
    const ps = primes.filter(p => covers(p, m));
    if (ps.length === 1 && !chosen.includes(ps[0])) chosen.push(ps[0]);
  }
  for (const p of chosen) for (const m of [...left]) if (covers(p, m)) left.delete(m);
  // then greedily the prime that covers most of what is left (fewer literals on ties)
  while (left.size) {
    let best = primes[0], bestN = -1;
    for (const p of primes) {
      let k = 0;
      for (const m of left) if (covers(p, m)) k++;
      const lits = n - popcount(p.dc);
      if (k > bestN || (k === bestN && lits < n - popcount(best.dc))) { best = p; bestN = k; }
    }
    chosen.push(best);
    for (const m of [...left]) if (covers(best, m)) left.delete(m);
  }
  return chosen.sort((a, b) => b.v - a.v);
}

const popcount = (x: number) => { let c = 0; while (x) { x &= x - 1; c++; } return c; };

/** e.g. "A·B̄ + Ā·B"; 0 and 1 for constant outputs. */
export function expression(n: number, names: string[], minterms: number[]): string {
  const r = minimize(n, minterms);
  if (r === 0) return '0';
  if (r === 1) return '1';
  return r.map(p => {
    const lits: string[] = [];
    for (let j = 0; j < n; j++) {
      const bit = 1 << (n - 1 - j);
      if (p.dc & bit) continue;
      lits.push(p.v & bit ? names[j] : names[j] + '̄');
    }
    return lits.join('·');
  }).join(' + ');
}

/** Expression for one LED column of a table, or null when it oscillates. */
export function columnExpression(t: TruthTable, col: number): string | null {
  if (t.rows.some(r => r.unstable)) return null;
  const mins = t.rows.flatMap((r, m) => (r.outs[col] ? [m] : []));
  return expression(t.inputs.length, t.inputs.map(i => i.label), mins);
}
