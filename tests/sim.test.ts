import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulate, hexValue, type Memory } from '../lib/sim.ts';
import { EXAMPLES } from '../lib/examples.ts';
import type { Circuit } from '../lib/circuit.ts';

const ex = (id: string) => EXAMPLES.find(e => e.id === id)!.make();
const run = (c: Circuit, mem: Memory = {}, clocks: Record<string, number> = {}) =>
  simulate(c, { pressed: new Set(), clocks }, mem);
const byKind = (c: Circuit, k: string) => c.comps.filter(x => x.kind === k);

test('half adder truth table', () => {
  const c = ex('half-adder');
  const [a, b] = byKind(c, 'switch');
  const [s, carry] = byKind(c, 'led');
  for (const [x, y] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
    a.on = !!x; b.on = !!y;
    const r = run(c);
    assert.equal(r.inp[s.id][0], x ^ y);
    assert.equal(r.inp[carry.id][0], x & y);
  }
});

test('SR latch holds its state', () => {
  const c = ex('sr-latch');
  const [s, r] = byKind(c, 'switch');
  const q = c.comps.find(x => x.id === 'q')!;
  let res = run(c);
  assert.equal(res.unstable, false);
  s.on = true; res = run(c, {}, {}); 
  const prev = res.out;
  assert.equal(res.inp[q.id][0], 1);
  s.on = false; res = simulate(c, { pressed: new Set(), clocks: {} }, {}, prev);
  assert.equal(res.inp[q.id][0], 1, 'Q stays set');
  r.on = true; res = simulate(c, { pressed: new Set(), clocks: {} }, {}, res.out);
  assert.equal(res.inp[q.id][0], 0);
});

test('4-bit counter counts clock edges', () => {
  const c = ex('counter');
  const clk = byKind(c, 'clock')[0];
  const hex = byKind(c, 'seg7')[0];
  const mem: Memory = {};
  let out = run(c, mem, { [clk.id]: 0 }).out;
  for (let n = 1; n <= 18; n++) {
    out = simulate(c, { pressed: new Set(), clocks: { [clk.id]: 1 } }, mem, out).out;
    const r = simulate(c, { pressed: new Set(), clocks: { [clk.id]: 0 } }, mem, out);
    out = r.out;
    assert.equal(hexValue(r.inp[hex.id]), n % 16, `after ${n} edges`);
  }
});

test('ring oscillator is flagged unstable', () => {
  const c: Circuit = { comps: [{ id: 'n', kind: 'not', x: 1, y: 1 }], wires: [{ id: 'w', from: { c: 'n', p: 0 }, to: { c: 'n', p: 0 } }] };
  assert.equal(run(c).unstable, true);
});
