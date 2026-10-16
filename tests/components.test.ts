import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPECS, PALETTE, decodeCircuit, encodeCircuit, type Circuit, type Kind } from '../lib/circuit.ts';
import { demoFor } from '../lib/demos.ts';
import { simulate } from '../lib/sim.ts';
import { evalWith, ledsOf, switchesOf } from '../lib/truth.ts';
import { getLearn } from '../lib/learn/index.ts';

const cases: { kind: Kind; inputs: number; expected: number[][] }[] = [
  { kind: 'buffer', inputs: 1, expected: [[0], [1]] },
  { kind: 'and3', inputs: 3, expected: [[0], [0], [0], [0], [0], [0], [0], [1]] },
  { kind: 'or3', inputs: 3, expected: [[0], [1], [1], [1], [1], [1], [1], [1]] },
  { kind: 'mux', inputs: 3, expected: [[0], [0], [0], [1], [1], [0], [1], [1]] },
  { kind: 'demux', inputs: 2, expected: [[0, 0], [0, 0], [1, 0], [0, 1]] },
  { kind: 'halfadder', inputs: 2, expected: [[0, 0], [1, 0], [1, 0], [0, 1]] },
  { kind: 'fulladder', inputs: 3, expected: [[0, 0], [1, 0], [1, 0], [0, 1], [1, 0], [0, 1], [0, 1], [1, 1]] },
];

for (const { kind, inputs, expected } of cases) {
  test(`${kind}: every input combination drives the documented output pins`, () => {
    const circuit = demoFor(kind);
    assert.equal(switchesOf(circuit).length, inputs);
    assert.equal(ledsOf(circuit).length, SPECS[kind].outs.length);
    const chip = circuit.comps.find(c => c.kind === kind)!;
    expected.forEach((values, row) => {
      const bits = Array.from({ length: inputs }, (_, i) => (row >> (inputs - i - 1)) & 1);
      const result = evalWith(circuit, switchesOf(circuit), bits);
      assert.equal(result.unstable, false);
      assert.deepEqual(result.out[chip.id], values, `${kind} input ${bits}`);
      assert.deepEqual(ledsOf(circuit).map(l => result.inp[l.id][0]), values);
    });
    assert.deepEqual(decodeCircuit(encodeCircuit(circuit)), circuit);
  });
}

test('new components default to zero at unwired inputs', () => {
  for (const { kind } of cases) {
    const circuit: Circuit = { comps: [{ id: 'chip', kind, x: 3, y: 3 }], wires: [] };
    const result = simulate(circuit, { pressed: new Set(), clocks: {} }, {});
    assert.equal(result.unstable, false);
    assert.deepEqual(result.out.chip, SPECS[kind].outs.map(() => 0));
  }
});

test('every palette component has a complete lesson in both languages; new lesson tables agree with simulation', () => {
  for (const locale of ['en', 'pt'] as const) {
    const content = getLearn(locale);
    assert.equal(new Set(content.lessons.map(l => l.kind)).size, PALETTE.length);
    for (const kind of PALETTE) assert.ok(content.lessons.some(l => l.kind === kind), `${locale}: ${kind}`);
    for (const { kind, inputs } of cases) {
      const lesson = content.lessons.find(l => l.kind === kind)!;
      assert.ok(lesson.summary && lesson.expr && lesson.guide.length >= 2);
      assert.equal(lesson.table!.rows.length, 1 << inputs);
      const circuit = demoFor(kind);
      for (const row of lesson.table!.rows) {
        const bits = row.slice(0, inputs).map(Number);
        const result = evalWith(circuit, switchesOf(circuit), bits);
        assert.deepEqual(ledsOf(circuit).map(l => String(result.inp[l.id][0])), row.slice(inputs), `${locale} ${kind}`);
      }
    }
  }
});
