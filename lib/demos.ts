// A tiny circuit per part for the guide's "Try it on the board" links.

import { SPECS, newComp, type Circuit, type Comp, type Kind, type Wire } from './circuit.ts';

export function demoFor(kind: Kind): Circuit {
  const comps: Comp[] = [];
  const wires: Wire[] = [];
  const add = (id: string, k: Kind, x: number, y: number) => { comps.push({ ...newComp(k, x, y), id }); };
  const link = (a: string, p: number, b: string, q: number) => wires.push({ id: `w${wires.length}`, from: { c: a, p }, to: { c: b, p: q } });
  const s = SPECS[kind];

  if (kind === 'led') {
    add('a', 'switch', 4, 7); add('l', 'led', 14, 7); link('a', 0, 'l', 0);
  } else if (s.ins.length === 0) {
    add('p', kind, 4, 7); add('l', 'led', 14, 7); link('p', 0, 'l', 0);
  } else if (kind === 'seg7') {
    [0, 1, 2, 3].forEach(i => { add(`s${i}`, 'switch', 3, 1 + i * 3.5 | 0); link(`s${i}`, 0, 'h', i); });
    add('h', 'seg7', 15, 5);
  } else if (kind === 'dff') {
    add('d', 'switch', 3, 4); add('c', 'button', 3, 10); add('f', 'dff', 11, 6);
    add('q', 'led', 18, 5); add('qn', 'led', 18, 9);
    link('d', 0, 'f', 0); link('c', 0, 'f', 1); link('f', 0, 'q', 0); link('f', 1, 'qn', 0);
  } else if (s.ins.length === 1) {
    add('a', 'switch', 4, 7); add('g', kind, 10, 7); add('l', 'led', 18, 7);
    link('a', 0, 'g', 0); link('g', 0, 'l', 0);
  } else {
    s.ins.forEach((_, i) => {
      add(`s${i}`, 'switch', 3, 2 + i * 4);
      link(`s${i}`, 0, 'g', i);
    });
    add('g', kind, 11, 6);
    s.outs.forEach((_, i) => {
      add(`l${i}`, 'led', 20, 4 + i * 5);
      link('g', i, `l${i}`, 0);
    });
  }
  return { comps, wires, w: 24, h: 16 };
}
