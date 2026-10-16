// Signal propagation. Components are evaluated in left-to-right order and their
// outputs updated immediately (Gauss-Seidel), repeated until nothing changes. This
// settles feedback circuits such as latches; a loop that never settles is flagged.

import { SPECS, type Circuit, type Comp } from './circuit.ts';

export interface SimInput {
  pressed: Set<string>;               // buttons held down
  clocks: Record<string, number>;     // current level of each clock
}

export interface SimResult {
  out: Record<string, number[]>;      // value of each output pin
  inp: Record<string, number[]>;      // value seen at each input pin
  unstable: boolean;
}

export type Memory = Record<string, { q: number; prev: number }>;

const MAX_PASSES = 64;

export function simulate(circ: Circuit, input: SimInput, mem: Memory, prevOut?: Record<string, number[]>): SimResult {
  const out: Record<string, number[]> = {};
  const inp: Record<string, number[]> = {};
  const src = new Map<string, { c: string; p: number }>();
  for (const w of circ.wires) src.set(`${w.to.c}:${w.to.p}`, w.from);

  for (const c of circ.comps) {
    const s = SPECS[c.kind];
    out[c.id] = s.outs.map((_, i) => prevOut?.[c.id]?.[i] ?? 0);
    inp[c.id] = s.ins.map(() => 0);
  }

  const order = [...circ.comps].sort((a, b) => a.x - b.x || a.y - b.y);
  const read = (c: Comp, i: number) => {
    const f = src.get(`${c.id}:${i}`);
    return f ? (out[f.c]?.[f.p] ?? 0) : 0;
  };

  let unstable = true;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false;
    for (const c of order) {
      const ins = inp[c.id];
      for (let i = 0; i < ins.length; i++) ins[i] = read(c, i);
      const next = evaluate(c, ins, input, mem);
      const cur = out[c.id];
      for (let i = 0; i < next.length; i++) {
        if (cur[i] !== next[i]) { cur[i] = next[i]; changed = true; }
      }
    }
    if (!changed) { unstable = false; break; }
  }
  return { out, inp, unstable };
}

function evaluate(c: Comp, i: number[], input: SimInput, mem: Memory): number[] {
  const [a = 0, b = 0] = i;
  switch (c.kind) {
    case 'switch': return [c.on ? 1 : 0];
    case 'button': return [input.pressed.has(c.id) ? 1 : 0];
    case 'clock':  return [input.clocks[c.id] ?? 0];
    case 'const':  return [1];
    case 'not':    return [a ? 0 : 1];
    case 'and':    return [a & b];
    case 'or':     return [a | b];
    case 'xor':    return [a ^ b];
    case 'nand':   return [(a & b) ^ 1];
    case 'nor':    return [(a | b) ^ 1];
    case 'xnor':   return [(a ^ b) ^ 1];
    case 'dff': {
      const m = (mem[c.id] ??= { q: 0, prev: 0 });
      if (b && !m.prev) m.q = a;   // rising edge of CLK latches D
      m.prev = b;
      return [m.q, m.q ^ 1];
    }
    default: return [];
  }
}

export const hexValue = (bits: number[]) => (bits[0] | (bits[1] << 1) | (bits[2] << 2) | (bits[3] << 3));

// segments gfedcba for 0-F
export const SEG_MAP = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71];
