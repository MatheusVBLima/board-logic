import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CIRCUITS, MACHINE0, SCENES, bits4, num, pathFromHash, hashOf, runLevel, settle, startLevel, tick, type Machine } from '../lib/inside.ts';
import { hexValue } from '../lib/sim.ts';

const after = (n: number, m: Machine = MACHINE0) => { for (let i = 0; i < n; i++) m = tick(m); return m; };

test('machine adds B to the accumulator on every tick, wraps at 16 and writes RAM', () => {
  const m = after(6);
  assert.equal(m.acc, (6 * 3) % 16);
  assert.equal(m.carry, 1);
  assert.deepEqual(m.ram, [15, 2, 9, 12]);
});

test('the ALU level adds every pair of 4-bit numbers', () => {
  const alu = CIRCUITS.alu;
  for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) {
    const r = runLevel(alu, [...bits4(a), ...bits4(b)]);
    assert.equal(r.unstable, false);
    assert.equal(num(alu.outputs.map(id => r.inp[id][0])), a + b, `${a}+${b}`);
  }
});

test('full and half adder levels match their truth tables', () => {
  for (let v = 0; v < 8; v++) {
    const ins = [v & 1, (v >> 1) & 1, (v >> 2) & 1];
    const r = runLevel(CIRCUITS.fa, ins);
    const sum = ins[0] + ins[1] + ins[2];
    assert.deepEqual([r.inp.s[0], r.inp.cout[0]], [sum & 1, sum >> 1]);
  }
  for (let v = 0; v < 4; v++) {
    const ins = [v & 1, v >> 1];
    const r = runLevel(CIRCUITS.ha, ins);
    assert.deepEqual([r.inp.s[0], r.inp.c[0]], [ins[0] ^ ins[1], ins[0] & ins[1]]);
  }
});

test('decoder lights exactly the line of its code', () => {
  for (let v = 0; v < 4; v++) {
    const r = runLevel(CIRCUITS.dec, [v & 1, v >> 1]);
    assert.deepEqual(CIRCUITS.dec.outputs.map(id => r.inp[id][0]), [0, 1, 2, 3].map(i => +(i === v)));
  }
});

test('gate-level flip-flop only takes D on the rising clock edge', () => {
  const ff = CIRCUITS.dff;
  let st = startLevel(ff, [0, 0]);
  const q = () => [st.sim.inp.q[0], st.sim.inp.qn[0]];
  for (const [d, clk, want] of [[1, 0, null], [1, 1, 1], [0, 1, 1], [0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 0, 0], [1, 1, 1]] as const) {
    st = settle(ff, [d, clk], st);
    assert.equal(st.sim.unstable, false);
    if (want !== null) assert.deepEqual(q(), [want, want ^ 1], `D=${d} CLK=${clk}`);
  }
});

test('register stores on the clock and holds afterwards', () => {
  const reg = CIRCUITS.reg;
  let st = startLevel(reg, [...bits4(9), 0], [[...bits4(5), 0], [...bits4(5), 1]]);
  const val = () => num(reg.outputs.map(id => st.sim.inp[id][0]));
  assert.equal(val(), 5);
  st = settle(reg, [...bits4(9), 1], st);
  assert.equal(val(), 9);
  st = settle(reg, [...bits4(2), 0], st);
  assert.equal(val(), 9);
});

test('counter counts clock pulses', () => {
  const c = CIRCUITS.counter;
  let st = startLevel(c, [0]);
  for (let n = 1; n <= 20; n++) {
    st = settle(c, [1], st); st = settle(c, [0], st);
    assert.equal(hexValue(st.sim.inp.hex), n & 15);
  }
});

test('opening a level hands down what the parent was computing', () => {
  const m = { ...MACHINE0, acc: 7, b: 3 };   // 0111 + 0011: bit 2 gets a carry in
  const path = pathFromHash('#case/board/cpu/alu/fa2/ha2', m);
  assert.deepEqual(path.map(s => s.level), ['pc', 'case', 'board', 'cpu', 'alu', 'fa', 'ha']);
  assert.deepEqual(path[4].ins, [...bits4(7), ...bits4(3)]);
  assert.deepEqual(path[5].ins, [1, 0, 1]);
  assert.deepEqual(path[6].ins, [1, 1]);
  assert.equal(hashOf(path), 'case/board/cpu/alu/fa2/ha2');
});

test('memory levels start holding the value the machine had', () => {
  const m = after(5);
  const acc = pathFromHash('case/board/cpu/acc', m);
  assert.equal(num(CIRCUITS.reg.outputs.map(id => acc[4].state!.sim.inp[id][0])), m.acc);
  const pc = pathFromHash('case/board/cpu/pc', m);
  assert.equal(hexValue(pc[4].state!.sim.inp.hex), 5);
  const word = pathFromHash('case/ram/w2', m);
  assert.equal(num(CIRCUITS.reg.outputs.map(id => word[3].state!.sim.inp[id][0])), m.ram[2]);
  // down to the gates: the flip-flop for bit 0 of ACC holds that bit
  const ff = pathFromHash('case/board/cpu/acc/dff0', m);
  assert.equal(ff[5].state!.sim.inp.q[0], m.acc & 1);
  const ff3 = pathFromHash('case/board/cpu/pc/dff2', m);
  assert.equal(ff3[5].state!.sim.inp.q[0], (5 >> 2) & 1);
});

test('every scene target resolves to a level', () => {
  const all = ['case', 'case/board', 'case/board/cpu', 'case/cooler/pwm', 'case/gpu/vram', 'case/gpu/fan', 'case/ssd/ctl', 'case/ssd/nand1/w3', 'case/psu', 'case/board/cpu/cache/dec', 'case/board/cpu/ctrl', 'case/board/cpu/b/dff3'];
  for (const h of all) assert.equal(hashOf(pathFromHash(h, after(3))), h);
  for (const def of Object.values(SCENES)) for (const seg of Object.keys(def.open)) assert.ok(def.open[seg]);
  const gpu = pathFromHash('case/gpu/die/core5', after(2));
  assert.deepEqual(gpu.map(s => s.level), ['pc', 'case', 'gpu', 'gpucore', 'alu']);
  assert.deepEqual(gpu[4].ins, [...bits4(5), ...bits4(2)]);
  assert.equal(pathFromHash('case/board/nope/cpu', MACHINE0).length, 3);
});
