// "Inside" explorer: a computer you open level by level down to the logic gates.
// The top levels are drawn scenes driven by a tiny 4-bit machine; the lower levels
// are real circuits. Every level starts with what its parent was doing at that moment.

import { newComp, type Circuit, type Comp, type Kind, type Wire } from './circuit.ts';
import { simulate, type Memory, type SimResult } from './sim.ts';

export type SceneId = 'pc' | 'monitor' | 'keyboard' | 'case' | 'board' | 'cpu' | 'cooler' | 'gpu' | 'gpucore' | 'ram' | 'ssd' | 'psu';
export type CircuitId = 'alu' | 'fa' | 'ha' | 'reg' | 'counter' | 'dec' | 'dff' | 'enc' | 'disp';
export type LevelId = SceneId | CircuitId;

/**
 * The machine the drawn levels show. On every clock tick the CPU adds B to the
 * accumulator and writes the result to the next of four RAM words. The last key
 * typed on the keyboard becomes B.
 */
export interface Machine { acc: number; b: number; carry: number; ticks: number; ram: number[]; key: number; text: string }

export const MACHINE0: Machine = { acc: 0, b: 3, carry: 0, ticks: 0, ram: [0, 0, 0, 0], key: 3, text: '' };

export function tick(m: Machine): Machine {
  const sum = m.acc + m.b;
  const ram = [...m.ram];
  ram[m.ticks & 3] = sum & 15;
  return { ...m, acc: sum & 15, carry: sum >> 4, ticks: m.ticks + 1, ram };
}

/** Typing a hex key on the keyboard loads it into register B. */
export const typeKey = (m: Machine, k: number): Machine => ({ ...m, key: k & 15, b: k & 15 });
/** Characters the screen keeps, the oldest dropping off the left. */
export const SCREEN_CHARS = 28;
/**
 * A key from the real keyboard: every printable character goes on the screen, Backspace erases,
 * and a hex digit also goes through the 16-key scan circuit into register B.
 */
export function typeChar(m: Machine, key: string): Machine {
  if (key === 'Backspace') return { ...m, text: m.text.slice(0, -1) };
  if ([...key].length !== 1) return m;
  const text = (m.text + key).slice(-SCREEN_CHARS);
  const hex = /^[0-9a-f]$/i.test(key) ? parseInt(key, 16) : -1;
  return hex < 0 ? { ...m, text } : { ...typeKey(m, hex), text };
}
/** Pixel row the monitor is drawing right now (of the 7 in a character). */
export const scanRow = (m: Machine) => m.ticks % 7;

/** Program counter: counts the instructions run so far (4 bits). */
export const pcOf = (m: Machine) => m.ticks & 15;
/** RAM address written by the last instruction. */
export const lastAddr = (m: Machine) => (m.ticks + 3) & 3;
/** What GPU core i is computing this frame: its own index plus the frame number. */
export const coreOps = (m: Machine, i: number): [number, number] => [i, m.ticks & 15];
/** Fan speed follows how busy the CPU looks (the accumulator, for this toy). */
export const fanRpm = (m: Machine) => 900 + m.acc * 110;

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

/** 4-bit register: four D flip-flops that copy D0..D3 when the clock switch goes 0 → 1. */
function regCircuit(): Circuit {
  const parts: P[] = [['clk', 'switch', 1, 17]], links: L[] = [];
  for (let i = 0; i < 4; i++) {
    parts.push([`d${i}`, 'switch', 1, 1 + 4 * i], [`dff${i}`, 'dff', 8, 1 + 4 * i], [`q${i}`, 'led', 14, 1 + 4 * i]);
    links.push([`d${i}`, 0, `dff${i}`, 0], ['clk', 0, `dff${i}`, 1], [`dff${i}`, 0, `q${i}`, 0]);
  }
  return build([17, 19], parts, links);
}

/** Ripple counter: each flip-flop feeds back its inverse and clocks the next one. */
function counterCircuit(): Circuit {
  const parts: P[] = [['clk', 'switch', 1, 4]], links: L[] = [['clk', 0, 'dff0', 1]];
  for (let i = 0; i < 4; i++) {
    parts.push([`dff${i}`, 'dff', 8 + 7 * i, 3]);
    links.push([`dff${i}`, 1, `dff${i}`, 0], [`dff${i}`, 0, 'hex', i, 1]);
    if (i) links.push([`dff${i - 1}`, 1, `dff${i}`, 1]);
  }
  parts.push(['hex', 'seg7', 37, 10]);
  return build([41, 15], parts, links);
}

/** 2 → 4 decoder: exactly one output line lights for each 2-bit code. */
function decCircuit(): Circuit {
  return build([22, 16],
    [
      ['a0', 'switch', 1, 2], ['a1', 'switch', 1, 9],
      ['n0', 'not', 6, 5], ['n1', 'not', 6, 12],
      ['y0', 'and', 13, 1], ['y1', 'and', 13, 5], ['y2', 'and', 13, 9], ['y3', 'and', 13, 13],
      ['l0', 'led', 19, 1], ['l1', 'led', 19, 5], ['l2', 'led', 19, 9], ['l3', 'led', 19, 13],
    ],
    [
      ['a0', 0, 'n0', 0], ['a1', 0, 'n1', 0],
      ['n1', 0, 'y0', 0], ['n0', 0, 'y0', 1],
      ['n1', 0, 'y1', 0], ['a0', 0, 'y1', 1],
      ['a1', 0, 'y2', 0], ['n0', 0, 'y2', 1],
      ['a1', 0, 'y3', 0], ['a0', 0, 'y3', 1],
      ['y0', 0, 'l0', 0], ['y1', 0, 'l1', 0], ['y2', 0, 'l2', 0], ['y3', 0, 'l3', 0],
    ],
  );
}

/**
 * D flip-flop from gates: a master latch open while CLK = 0 and a slave latch open
 * while CLK = 1, so Q only takes D at the moment the clock rises.
 */
function dffCircuit(): Circuit {
  return build([45, 16],
    [
      ['d', 'switch', 1, 1], ['clk', 'switch', 1, 13],
      ['nd', 'not', 6, 4.5], ['nclk', 'not', 6, 9],
      ['m1', 'nand', 12, 1], ['m2', 'nand', 12, 5], ['m3', 'nand', 18, 1], ['m4', 'nand', 18, 5],
      ['nq', 'not', 24, 4.5],
      ['s1', 'nand', 30, 1], ['s2', 'nand', 30, 5], ['s3', 'nand', 36, 1], ['s4', 'nand', 36, 5],
      ['q', 'led', 42, 1], ['qn', 'led', 42, 5],
    ],
    [
      ['d', 0, 'm1', 0], ['d', 0, 'nd', 0], ['clk', 0, 'nclk', 0],
      ['nd', 0, 'm2', 0], ['nclk', 0, 'm1', 1], ['nclk', 0, 'm2', 1],
      ['m1', 0, 'm3', 0], ['m4', 0, 'm3', 1], ['m3', 0, 'm4', 0], ['m2', 0, 'm4', 1],
      ['m3', 0, 'nq', 0], ['m3', 0, 's1', 0], ['clk', 0, 's1', 1], ['nq', 0, 's2', 0], ['clk', 0, 's2', 1],
      ['s1', 0, 's3', 0], ['s4', 0, 's3', 1], ['s3', 0, 's4', 0], ['s2', 0, 's4', 1],
      ['s3', 0, 'q', 0], ['s4', 0, 'qn', 0],
    ],
  );
}

/** 4 → 2 encoder: the one key that is pressed becomes a 2-bit code, with two ORs. */
function encCircuit(): Circuit {
  return build([19, 13],
    [
      ['k0', 'switch', 1, 1], ['k1', 'switch', 1, 4], ['k2', 'switch', 1, 7], ['k3', 'switch', 1, 10],
      ['b0', 'or', 10, 3], ['b1', 'or', 10, 8], ['l0', 'led', 16, 3], ['l1', 'led', 16, 8],
    ],
    [['k1', 0, 'b0', 0], ['k3', 0, 'b0', 1], ['k2', 0, 'b1', 0], ['k3', 0, 'b1', 1], ['b0', 0, 'l0', 0], ['b1', 0, 'l1', 0]],
  );
}

/** Video controller: four bits in, the character they stand for out on a display. */
function dispCircuit(): Circuit {
  const parts: P[] = [['hex', 'seg7', 10, 3]], links: L[] = [];
  for (let i = 0; i < 4; i++) {
    parts.push([`v${i}`, 'switch', 1, 0.5 + 3 * i]);
    links.push([`v${i}`, 0, 'hex', i]);
  }
  return build([14, 12], parts, links);
}

export interface CircuitLevel {
  make: () => Circuit;
  inputs: string[];                 // switch ids, in the order values are handed down
  outputs: string[];                // led ids, for the readout
  open: Record<string, LevelId>;    // part id → level it opens
  gates: Record<string, Kind>;      // part id → guide lesson (the bottom of a path)
  /** Inputs to step through first so a level with memory starts holding the parent's value. */
  primeFrom?: (ins: number[], out: number[]) => number[][];
}

const ffs = { dff0: 'dff', dff1: 'dff', dff2: 'dff', dff3: 'dff' } as const;

export const CIRCUITS: Record<CircuitId, CircuitLevel> = {
  alu: {
    make: aluCircuit,
    inputs: ['a0', 'a1', 'a2', 'a3', 'b0', 'b1', 'b2', 'b3'],
    outputs: ['s0', 's1', 's2', 's3', 'cout'],
    open: { fa0: 'fa', fa1: 'fa', fa2: 'fa', fa3: 'fa' },
    gates: {},
  },
  fa: { make: faCircuit, inputs: ['a', 'b', 'cin'], outputs: ['s', 'cout'], open: { ha1: 'ha', ha2: 'ha' }, gates: { or: 'or' } },
  ha: { make: haCircuit, inputs: ['a', 'b'], outputs: ['s', 'c'], open: {}, gates: { xor: 'xor', and: 'and' } },
  reg: { make: regCircuit, inputs: ['d0', 'd1', 'd2', 'd3', 'clk'], outputs: ['q0', 'q1', 'q2', 'q3'], open: { ...ffs }, gates: {} },
  counter: { make: counterCircuit, inputs: ['clk'], outputs: [], open: { ...ffs }, gates: {} },
  dec: {
    make: decCircuit, inputs: ['a0', 'a1'], outputs: ['l0', 'l1', 'l2', 'l3'], open: {},
    gates: { n0: 'not', n1: 'not', y0: 'and', y1: 'and', y2: 'and', y3: 'and' },
  },
  dff: {
    make: dffCircuit, inputs: ['d', 'clk'], outputs: ['q', 'qn'], open: {},
    gates: { nd: 'not', nclk: 'not', nq: 'not', m1: 'nand', m2: 'nand', m3: 'nand', m4: 'nand', s1: 'nand', s2: 'nand', s3: 'nand', s4: 'nand' },
    primeFrom: (_ins, out) => [[out[0] ?? 0, 0], [out[0] ?? 0, 1]],
  },
  enc: { make: encCircuit, inputs: ['k0', 'k1', 'k2', 'k3'], outputs: ['l0', 'l1'], open: {}, gates: { b0: 'or', b1: 'or' } },
  disp: { make: dispCircuit, inputs: ['v0', 'v1', 'v2', 'v3'], outputs: [], open: {}, gates: { hex: 'seg7' } },
};

export const isCircuitLevel = (l: LevelId): l is CircuitId => l in CIRCUITS;

/** Drawn scenes: hash segment → level it opens, and parts that lead to a guide lesson. */
export const SCENES: Record<SceneId, { open: Record<string, LevelId>; gates?: Record<string, Kind> }> = {
  pc: { open: { monitor: 'monitor', keyboard: 'keyboard', case: 'case' } },
  monitor: { open: { video: 'disp', line: 'dec', scan: 'counter' } },
  keyboard: { open: { cols: 'dec', rows: 'enc' } },
  case: { open: { board: 'board', cooler: 'cooler', gpu: 'gpu', ram: 'ram', ssd: 'ssd', psu: 'psu' } },
  board: { open: { cpu: 'cpu', ram: 'ram' } },
  cpu: { open: { ctrl: 'dec', pc: 'counter', acc: 'reg', b: 'reg', alu: 'alu', cache: 'ram' }, gates: { clock: 'clock' } },
  cooler: { open: { pwm: 'counter' } },
  gpu: { open: { die: 'gpucore', vram: 'ram', fan: 'cooler' } },
  gpucore: { open: Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`core${i}`, 'alu' as LevelId])) },
  ram: { open: { dec: 'dec', w0: 'reg', w1: 'reg', w2: 'reg', w3: 'reg' } },
  ssd: { open: { ctl: 'dec', cache: 'ram', nand0: 'ram', nand1: 'ram' } },
  psu: { open: {} },
};

// ---------- state of an open circuit level ----------

export interface LevelState { sim: SimResult; mem: Memory }

/** Settle a circuit level with its switches at `ins`, starting from what it held before. */
export function settle(level: CircuitLevel, ins: number[], prev?: LevelState): LevelState {
  const circ = withInputs(level, ins);
  const mem: Memory = structuredClone(prev?.mem ?? {});
  const sim = simulate(circ, { pressed: new Set(), clocks: {} }, mem, prev?.sim.out);
  return { sim, mem };
}

/** Run the priming inputs, then the real ones. */
export function startLevel(level: CircuitLevel, ins: number[], prime: number[][] = []): LevelState {
  let st: LevelState | undefined;
  for (const p of prime) st = settle(level, p, st);
  return settle(level, ins, st);
}

/** Circuit with its switches set to the given input values. */
export function withInputs(level: CircuitLevel, ins: number[]): Circuit {
  const c = level.make();
  level.inputs.forEach((id, i) => { const k = c.comps.find(x => x.id === id); if (k) k.on = !!ins[i]; });
  return c;
}

/** Stateless run, for combinational levels and tests. */
export const runLevel = (level: CircuitLevel, ins: number[]) => settle(level, ins).sim;

// ---------- the path ----------

/** One open level: the hash segment that names it, its inputs and (for circuits) its state. */
export interface Stop { seg: string; level: LevelId; ins: number[]; state?: LevelState }

/** Hash segment → level it opens from `parent`, or null. */
export function levelOf(parent: LevelId, seg: string): LevelId | null {
  const map = isCircuitLevel(parent) ? CIRCUITS[parent].open : SCENES[parent].open;
  return map[seg] ?? null;
}

/** Guide lesson a part leads to, if it is a gate (or the clock) at the bottom of a path. */
export function gateOf(parent: LevelId, seg: string): Kind | null {
  const map = isCircuitLevel(parent) ? CIRCUITS[parent].gates : SCENES[parent].gates;
  return map?.[seg] ?? null;
}

const storeOf = (v: number) => [[...bits4(v), 0], [...bits4(v), 1]];
const pulses = (n: number) => Array.from({ length: n }, () => [[1], [0]]).flat();

/** Inputs (and priming steps) a drawn scene hands to the level a part opens. */
function fromScene(parent: SceneId, seg: string, m: Machine): { ins: number[]; prime?: number[][] } {
  if (parent === 'cpu') {
    switch (seg) {
      case 'alu': return { ins: [...bits4(m.acc), ...bits4(m.b)] };
      case 'acc': return { ins: [...bits4((m.acc + m.b) & 15), 0], prime: storeOf(m.acc) };
      case 'b': return { ins: [...bits4(m.b), 0], prime: storeOf(m.b) };
      case 'pc': return { ins: [0], prime: [[0], ...pulses(pcOf(m))] };
      case 'ctrl': return { ins: [0, 0] };          // opcode 00: ADD, the only instruction this program uses
    }
  }
  if (parent === 'monitor') {
    if (seg === 'video') return { ins: bits4(m.acc) };
    if (seg === 'line') return { ins: [scanRow(m) & 1, (scanRow(m) >> 1) & 1] };
    return { ins: [0], prime: [[0], ...pulses(scanRow(m))] };
  }
  if (parent === 'keyboard') {
    if (seg === 'cols') return { ins: [m.key & 1, (m.key >> 1) & 1] };
    return { ins: [0, 1, 2, 3].map(r => +(r === m.key >> 2)) };
  }
  if (parent === 'gpucore') {
    const [a, b] = coreOps(m, Number(seg.slice(4)));
    return { ins: [...bits4(a), ...bits4(b)] };
  }
  if (parent === 'ram' && seg !== 'dec') {
    const v = m.ram[Number(seg.slice(1))];
    return { ins: [...bits4(v), 0], prime: storeOf(v) };
  }
  if (parent === 'ram') return { ins: bits4(lastAddr(m)).slice(0, 2) };
  if (parent === 'ssd') return { ins: [m.ticks & 1, (m.ticks >> 1) & 1] };
  if (parent === 'cooler') return { ins: [0], prime: [[0], ...pulses(m.ticks & 15)] };   // tachometer pulses counted
  return { ins: [] };
}

/** Open `seg` inside `parent`, starting from what the parent is doing right now. */
export function childStop(parent: Stop, seg: string, m: Machine): Stop | null {
  const level = levelOf(parent.level, seg);
  if (!level) return null;
  let ins: number[] = [], prime: number[][] | undefined;
  if (isCircuitLevel(parent.level)) {
    const sim = parent.state!.sim;
    ins = [...(sim.inp[seg] ?? [])];
    prime = isCircuitLevel(level) ? CIRCUITS[level].primeFrom?.(ins, sim.out[seg] ?? []) : undefined;
  } else {
    ({ ins, prime } = fromScene(parent.level, seg, m));
  }
  return { seg, level, ins, state: isCircuitLevel(level) ? startLevel(CIRCUITS[level], ins, prime) : undefined };
}

export const ROOT: Stop = { seg: '', level: 'pc', ins: [] };

/** Rebuild the open levels from a hash such as `case/board/cpu/alu`, keeping what is already open. */
export function pathFromHash(hash: string, m: Machine, keep: Stop[] = [ROOT]): Stop[] {
  const segs = hash.replace(/^#/, '').split('/').filter(Boolean);
  const out: Stop[] = [ROOT];
  for (const seg of segs) {
    const parent = out[out.length - 1];
    const kept = keep[out.length];
    if (kept && kept.seg === seg && keep[out.length - 1] === parent) { out.push(kept); continue; }
    const next = childStop(parent, seg, m);
    if (!next) break;
    out.push(next);
  }
  return out;
}

export const hashOf = (path: Stop[]) => path.slice(1).map(s => s.seg).join('/');
