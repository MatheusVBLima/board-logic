// Circuit model: components placed on a grid, wires from an output pin to an input pin.

export type Kind =
  | 'switch' | 'button' | 'clock' | 'const'
  | 'not' | 'and' | 'or' | 'xor' | 'nand' | 'nor' | 'xnor'
  | 'dff' | 'led' | 'seg7';

export interface Comp {
  id: string;
  kind: Kind;
  x: number;
  y: number;
  on?: boolean;     // switch position
  hz?: number;      // clock frequency
  color?: string;   // led colour
}

export interface PinRef { c: string; p: number }

export interface Wire {
  id: string;
  from: PinRef;     // output pin
  to: PinRef;       // input pin
  bend?: number;    // 0 auto, 1 near source, 2 middle
}

export interface Circuit { comps: Comp[]; wires: Wire[] }

export interface Spec {
  name: string;     // shown in the dock
  label: string;    // printed on the part
  w: number;        // footprint along x (signal flows +x)
  d: number;        // footprint along y
  h: number;        // body height
  ins: number[];    // y offset of each input pin
  outs: number[];   // y offset of each output pin
  inNames?: string[];
  outNames?: string[];
}

const gate2 = (name: string, label: string): Spec =>
  ({ name, label, w: 3, d: 2, h: 0.5, ins: [0.5, 1.5], outs: [1] });

export const SPECS: Record<Kind, Spec> = {
  switch: { name: 'Chave', label: 'SW', w: 2, d: 2, h: 0.4, ins: [], outs: [1] },
  button: { name: 'Botão', label: 'BTN', w: 2, d: 2, h: 0.35, ins: [], outs: [1] },
  clock:  { name: 'Clock', label: 'CLK', w: 3, d: 2, h: 0.5, ins: [], outs: [1] },
  const:  { name: 'Fonte 1', label: 'VCC', w: 2, d: 2, h: 0.45, ins: [], outs: [1] },
  not:    { name: 'NOT', label: 'NOT', w: 3, d: 2, h: 0.5, ins: [1], outs: [1] },
  and:    gate2('AND', 'AND'),
  or:     gate2('OR', 'OR'),
  xor:    gate2('XOR', 'XOR'),
  nand:   gate2('NAND', 'NAND'),
  nor:    gate2('NOR', 'NOR'),
  xnor:   gate2('XNOR', 'XNOR'),
  dff:    { name: 'Flip-flop D', label: 'FF-D', w: 3, d: 3, h: 0.5, ins: [1, 2], outs: [1, 2],
            inNames: ['D', 'CLK'], outNames: ['Q', 'Q̄'] },
  led:    { name: 'LED', label: 'LED', w: 2, d: 2, h: 0.3, ins: [1], outs: [] },
  seg7:   { name: 'Display', label: 'HEX', w: 3, d: 4, h: 0.5, ins: [0.5, 1.5, 2.5, 3.5], outs: [],
            inNames: ['1', '2', '4', '8'] },
};

export const PALETTE: Kind[] = [
  'switch', 'button', 'clock', 'const',
  'not', 'and', 'or', 'xor', 'nand', 'nor', 'xnor',
  'dff', 'led', 'seg7',
];

export const LED_COLORS = ['#ff5a4f', '#ffb547', '#5dff9a', '#4fb4ff', '#c58bff', '#f4f5f5'];
export const CLOCK_HZ = [0.5, 1, 2, 4, 8];

export const BOARD_W = 64;
export const BOARD_H = 40;

/** Board position of a pin: inputs sit one cell left of the part, outputs one cell right. */
export function pinPos(c: Comp, side: 'in' | 'out', i: number): [number, number] {
  const s = SPECS[c.kind];
  return side === 'in' ? [c.x - 1, c.y + s.ins[i]] : [c.x + s.w + 1, c.y + s.outs[i]];
}

let counter = 0;
export const uid = () => (Date.now().toString(36).slice(-4) + (counter++).toString(36) + Math.random().toString(36).slice(2, 5));

export function newComp(kind: Kind, x: number, y: number): Comp {
  const c: Comp = { id: uid(), kind, x, y };
  if (kind === 'switch') c.on = false;
  if (kind === 'clock') c.hz = 1;
  if (kind === 'led') c.color = LED_COLORS[0];
  return c;
}

/** Orthogonal trace on the board plane from an output pin to an input pin. */
export function routeWire(circ: Circuit, w: Wire): string {
  const a = circ.comps.find(c => c.id === w.from.c);
  const b = circ.comps.find(c => c.id === w.to.c);
  if (!a || !b) return '';
  const [ax, ay] = pinPos(a, 'out', w.from.p);
  const [bx, by] = pinPos(b, 'in', w.to.p);
  const bend = w.bend ?? 0;
  if (bx - ax >= 0.8) {
    let mx: number;
    if (bend === 1) mx = ax + 0.35;
    else if (bend === 2) mx = (ax + bx) / 2;
    else mx = Math.max(ax + 0.35, Math.min(bx - 0.4, bx - 0.7 - 0.4 * w.to.p));
    return `M${ax},${ay} H${mx} V${by} H${bx}`;
  }
  // backwards: leave right, travel back above/below, enter from the left
  const sa = SPECS[a.kind], sb = SPECS[b.kind];
  const close = a.id === b.id || Math.abs(ay - by) < 1.5;
  const my = close ? Math.max(a.y + sa.d, b.y + sb.d) + 0.8 + 0.3 * w.to.p : (ay + by) / 2;
  const x1 = ax + 0.6, x2 = bx - 0.6 - 0.3 * w.to.p;
  return `M${ax},${ay} H${x1} V${my} H${x2} V${by} H${bx}`;
}

export function boundsOf(circ: Circuit) {
  if (!circ.comps.length) return { x0: 0, y0: 0, x1: BOARD_W, y1: BOARD_H };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of circ.comps) {
    const s = SPECS[c.kind];
    x0 = Math.min(x0, c.x - 2); y0 = Math.min(y0, c.y - 1);
    x1 = Math.max(x1, c.x + s.w + 2); y1 = Math.max(y1, c.y + s.d + 2);
  }
  return { x0, y0, x1, y1 };
}

export function overlaps(circ: Circuit, kind: Kind, x: number, y: number, ignore?: string) {
  const s = SPECS[kind];
  return circ.comps.some(c => {
    if (c.id === ignore) return false;
    const t = SPECS[c.kind];
    return x - 1 < c.x + t.w + 1 && c.x - 1 < x + s.w + 1 && y < c.y + t.d && c.y < y + s.d;
  });
}

export function clampPos(kind: Kind, x: number, y: number): [number, number] {
  const s = SPECS[kind];
  return [Math.max(1, Math.min(BOARD_W - s.w - 1, x)), Math.max(0, Math.min(BOARD_H - s.d, y))];
}

// ---------- sharing ----------

export function encodeCircuit(c: Circuit): string {
  const json = JSON.stringify(c);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeCircuit(s: string): Circuit | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
    const c = JSON.parse(new TextDecoder().decode(bytes));
    return isCircuit(c) ? c : null;
  } catch { return null; }
}

export function isCircuit(c: unknown): c is Circuit {
  if (!c || typeof c !== 'object') return false;
  const o = c as Circuit;
  return Array.isArray(o.comps) && Array.isArray(o.wires)
    && o.comps.every(k => k && typeof k.id === 'string' && k.kind in SPECS && Number.isFinite(k.x) && Number.isFinite(k.y))
    && o.wires.every(w => w && w.from && w.to && typeof w.from.c === 'string' && typeof w.to.c === 'string');
}
