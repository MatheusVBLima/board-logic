import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHALLENGES, challengeById, checkChallenge, starterCircuit } from '../lib/challenges.ts';
import { SPECS, type Circuit, type Kind } from '../lib/circuit.ts';

function solution(id: string, build: (gate: (id: string, kind: Kind) => void, wire: (src: string, pin: number, dest: string, input: number) => void) => void): Circuit {
  const circuit = starterCircuit(challengeById(id)!);
  const gate = (id: string, kind: Kind) => circuit.comps.push({ id, kind, x: 10 + circuit.comps.length, y: 4 });
  const wire = (src: string, pin: number, dest: string, input: number) => circuit.wires.push({ id: `w${circuit.wires.length}`, from: { c: src, p: pin }, to: { c: dest, p: input } });
  build(gate, wire);
  return circuit;
}

const solutions: Record<string, Circuit> = {};
for (const [id, kind] of [['safety-interlock', 'and3'], ['alarm-center', 'or3'], ['signal-selector', 'mux'], ['signal-router', 'demux']] as const) {
  solutions[id] = solution(id, (gate, wire) => {
    gate('g', kind);
    SPECS[kind].ins.forEach((_, i) => wire(`in${i}`, 0, 'g', i));
    SPECS[kind].outs.forEach((_, i) => wire('g', i, `out${i}`, 0));
  });
}
solutions['controlled-inverter'] = solution('controlled-inverter', (gate, wire) => {
  gate('n', 'not'); gate('m', 'mux');
  wire('in0', 0, 'n', 0); wire('in0', 0, 'm', 0); wire('n', 0, 'm', 1); wire('in1', 0, 'm', 2); wire('m', 0, 'out0', 0);
});
solutions['half-subtractor'] = solution('half-subtractor', (gate, wire) => {
  gate('x', 'xor'); gate('n', 'not'); gate('a', 'and');
  wire('in0', 0, 'x', 0); wire('in1', 0, 'x', 1); wire('x', 0, 'out0', 0);
  wire('in0', 0, 'n', 0); wire('n', 0, 'a', 0); wire('in1', 0, 'a', 1); wire('a', 0, 'out1', 0);
});
solutions['decoder-2bit'] = solution('decoder-2bit', (gate, wire) => {
  gate('one', 'const'); gate('root', 'demux'); gate('low', 'demux'); gate('high', 'demux');
  wire('one', 0, 'root', 0); wire('in0', 0, 'root', 1);
  wire('root', 0, 'low', 0); wire('root', 1, 'high', 0);
  wire('in1', 0, 'low', 1); wire('in1', 0, 'high', 1);
  wire('low', 0, 'out0', 0); wire('low', 1, 'out1', 0); wire('high', 0, 'out2', 0); wire('high', 1, 'out3', 0);
});
solutions['add-2bit'] = solution('add-2bit', (gate, wire) => {
  gate('low', 'halfadder'); gate('high', 'fulladder');
  wire('in1', 0, 'low', 0); wire('in3', 0, 'low', 1);
  wire('in0', 0, 'high', 0); wire('in2', 0, 'high', 1); wire('low', 1, 'high', 2);
  wire('low', 0, 'out0', 0); wire('high', 0, 'out1', 0); wire('high', 1, 'out2', 0);
});

for (const [id, circuit] of Object.entries(solutions)) {
  test(`${id}: a working solution passes all rows and a broken output fails`, () => {
    const challenge = challengeById(id)!;
    const result = checkChallenge(challenge, circuit);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.rows.length, 1 << challenge.inputs.length);
    const broken = { ...circuit, wires: circuit.wires.filter(w => w.to.c !== 'out0') };
    assert.equal(checkChallenge(challenge, broken).ok, false);
  });
}

test('challenge IDs are unique, progression is ordered, and forbidden parts cannot bypass gate-building exercises', () => {
  assert.equal(new Set(CHALLENGES.map(c => c.id)).size, CHALLENGES.length);
  assert.deepEqual(CHALLENGES.map(c => c.level), CHALLENGES.map(c => c.level).sort());
  for (const [id, kind] of [['half-adder', 'halfadder'], ['full-adder', 'fulladder'], ['mux', 'mux']] as const) {
    const challenge = challengeById(id)!;
    const circuit = starterCircuit(challenge);
    circuit.comps.push({ id: 'shortcut', kind, x: 12, y: 6 });
    assert.equal(checkChallenge(challenge, circuit).issues[0]?.type, 'forbidden');
  }
});
