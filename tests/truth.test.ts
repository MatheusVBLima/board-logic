import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLES } from '../lib/examples.ts';
import { columnExpression, expression, truthTable } from '../lib/truth.ts';
import { CHALLENGES, checkChallenge, challengeById, starterCircuit } from '../lib/challenges.ts';
import { newComp, type Circuit } from '../lib/circuit.ts';

test('half adder table and expressions', () => {
  const t = truthTable(EXAMPLES.find(e => e.id === 'half-adder')!.make())!;
  assert.deepEqual(t.inputs.map(i => i.label), ['A', 'B']);
  assert.deepEqual(t.rows.map(r => r.outs), [[0, 0], [1, 0], [1, 0], [0, 1]]);
  assert.equal(columnExpression(t, 0), 'A·B̄ + Ā·B');
  assert.equal(columnExpression(t, 1), 'A·B');
});

test('minimizer', () => {
  assert.equal(expression(2, ['A', 'B'], []), '0');
  assert.equal(expression(2, ['A', 'B'], [0, 1, 2, 3]), '1');
  assert.equal(expression(2, ['A', 'B'], [1, 2, 3]), 'A + B');
  // majority of three
  assert.equal(expression(3, ['A', 'B', 'C'], [3, 5, 6, 7]).split(' + ').sort().join(' + '), 'A·B + A·C + B·C');
});

test('challenge checker', () => {
  const ch = challengeById('half-adder')!;
  const start = starterCircuit(ch);
  assert.equal(checkChallenge(ch, start).ok, false);
  const c: Circuit = {
    ...start,
    comps: [...start.comps, { ...newComp('xor', 12, 5), id: 'x' }, { ...newComp('and', 12, 11), id: 'a' }],
    wires: [
      { id: 'w1', from: { c: 'in0', p: 0 }, to: { c: 'x', p: 0 } }, { id: 'w2', from: { c: 'in1', p: 0 }, to: { c: 'x', p: 1 } },
      { id: 'w3', from: { c: 'in0', p: 0 }, to: { c: 'a', p: 0 } }, { id: 'w4', from: { c: 'in1', p: 0 }, to: { c: 'a', p: 1 } },
      { id: 'w5', from: { c: 'x', p: 0 }, to: { c: 'out0', p: 0 } }, { id: 'w6', from: { c: 'a', p: 0 }, to: { c: 'out1', p: 0 } },
    ],
  };
  assert.equal(checkChallenge(ch, c).ok, true);
  const nand = challengeById('not-from-nand')!;
  const bad = checkChallenge(nand, { ...starterCircuit(nand), comps: [...starterCircuit(nand).comps, newComp('not', 10, 5)] });
  assert.deepEqual(bad.issues, [{ type: 'forbidden', kinds: ['not'] }]);
  for (const x of CHALLENGES) assert.equal(starterCircuit(x).comps.length, x.inputs.length + x.outputs.length);
});

test('every demo is a valid circuit', async () => {
  const { demoFor } = await import('../lib/demos.ts');
  const { PALETTE, isCircuit, minBoard } = await import('../lib/circuit.ts');
  for (const k of PALETTE) {
    const c = demoFor(k);
    assert.ok(isCircuit(c), k);
    const m = minBoard(c);
    assert.ok(m.w <= c.w! && m.h <= c.h!, k);
  }
});
