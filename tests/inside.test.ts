import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CIRCUITS, MACHINE0, bits4, num, pathFromHash, hashOf, runLevel, tick } from '../lib/inside.ts';

test('machine adds B to the accumulator on every tick and wraps at 16', () => {
  let m = MACHINE0;
  for (let i = 0; i < 6; i++) m = tick(m);
  assert.equal(m.acc, (6 * 3) % 16);
  assert.equal(m.carry, 1);
});

test('the ALU level adds every pair of 4-bit numbers', () => {
  const alu = CIRCUITS.alu!;
  for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) {
    const r = runLevel(alu, [...bits4(a), ...bits4(b)]);
    assert.equal(r.unstable, false);
    const leds = alu.outputs.map(id => r.inp[id][0]);
    assert.equal(num(leds), a + b, `${a}+${b}`);
  }
});

test('full and half adder levels match their truth tables', () => {
  for (let v = 0; v < 8; v++) {
    const ins = [v & 1, (v >> 1) & 1, (v >> 2) & 1];
    const r = runLevel(CIRCUITS.fa!, ins);
    const sum = ins[0] + ins[1] + ins[2];
    assert.deepEqual([r.inp.s[0], r.inp.cout[0]], [sum & 1, sum >> 1]);
  }
  for (let v = 0; v < 4; v++) {
    const ins = [v & 1, v >> 1];
    const r = runLevel(CIRCUITS.ha!, ins);
    assert.deepEqual([r.inp.s[0], r.inp.c[0]], [ins[0] ^ ins[1], ins[0] & ins[1]]);
  }
});

test('opening a level hands down what the parent was computing', () => {
  const m = { acc: 7, b: 3, carry: 0, ticks: 0 };   // 0111 + 0011: bit 2 gets a carry in
  const path = pathFromHash('#board/cpu/alu/fa2/ha2', m);
  assert.deepEqual(path.map(s => s.level), ['pc', 'board', 'cpu', 'alu', 'fa', 'ha']);
  assert.deepEqual(path[3].ins, [...bits4(7), ...bits4(3)]);
  assert.deepEqual(path[4].ins, [1, 0, 1]);            // a2, b2, carry from bit 1
  assert.deepEqual(path[5].ins, [1, 1]);               // first half sum, carry in
  assert.equal(hashOf(path), 'board/cpu/alu/fa2/ha2');
});

test('unknown segments stop the path and kept levels are reused', () => {
  const path = pathFromHash('board/cpu/nope/alu', MACHINE0);
  assert.equal(path.length, 3);
  const deeper = pathFromHash('board/cpu/alu', { ...MACHINE0, acc: 9 }, path);
  assert.equal(deeper[2], path[2]);
});
