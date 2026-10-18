'use client';

import type { ReactNode } from 'react';
import { makeProj } from '@/lib/iso';
import { bits4, type Machine } from '@/lib/inside';
import { Box } from '@/components/Part';
import { pressable, type OpenHandler } from './CircuitView';

const pr = makeProj(true, 20);
const Top = ({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) => <g transform={pr.TOP(x, y, z)}>{children}</g>;
const Front = ({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) => <g transform={pr.FRONT(x, y, z)}>{children}</g>;
const Side = ({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) => <g transform={pr.SIDE(x, y, z)}>{children}</g>;

/** SVG framing a block of the scene floor (x0..x1, y0..y1) up to height zt. */
function Frame({ x0, y0, x1, y1, zt, label, children }: { x0: number; y0: number; x1: number; y1: number; zt: number; label: string; children: ReactNode }) {
  const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].flatMap(([x, y]) => [pr.P(x, y, -1), pr.P(x, y, zt)]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const vb = `${Math.min(...xs) - 10} ${Math.min(...ys) - 10} ${Math.max(...xs) - Math.min(...xs) + 20} ${Math.max(...ys) - Math.min(...ys) + 20}`;
  return <svg viewBox={vb} className="board-svg h-full w-full" role="group" aria-label={label}>{children}</svg>;
}

/** Four bit cells, most significant on the left, lit when set. */
function Bits({ x, y, n, size = 0.8, onBit }: { x: number; y: number; n: number; size?: number; onBit?: (i: number) => void }) {
  return (
    <>
      {bits4(n).map((b, i) => {
        const cell = (
          <g key={i}>
            <rect className={`glass ${b ? 'hot' : ''}`} x={x + (3 - i) * (size + 0.2)} y={y} width={size} height={size} rx={0.12} />
            <text className={`chip-txt ${b ? 'on' : ''}`} x={x + (3 - i) * (size + 0.2) + size / 2} y={y + size * 0.68} textAnchor="middle" style={{ fontSize: size * 0.55 }}>{b}</text>
          </g>
        );
        return onBit ? <g key={i} className="inside-bit" {...pressable(`bit ${i}`, () => onBit(i))}>{cell}</g> : cell;
      })}
    </>
  );
}

const bin = (n: number) => n.toString(2).padStart(4, '0');

export interface SceneText { open: (what: string) => string; soon: string; names: Record<'board' | 'cpu' | 'alu' | 'ram' | 'clock' | 'io' | 'post' | 'acc' | 'b' | 'carry', string> }

/** Desk with a monitor, keyboard and the tower; the tower opens the motherboard. */
export function ComputerScene({ m, onOpen, t }: { m: Machine; onOpen: OpenHandler; t: SceneText }) {
  const blink = m.ticks % 2 === 1;
  return (
    <Frame x0={-1} y0={-1} x1={14} y1={8} zt={6.4} label={t.names.board}>
      <Box pr={pr} x={-1} y={-1} z={-0.45} w={15} d={9} h={0.45} r={0.8} cls="plate" />
      {/* monitor */}
      <Box pr={pr} x={3.4} y={0.5} z={0} w={2.4} d={2} h={0.14} r={0.3} />
      <Box pr={pr} x={4.2} y={1.1} z={0.14} w={0.8} d={0.35} h={1.3} />
      <Box pr={pr} x={1} y={1.5} z={1.4} w={7.2} d={0.4} h={4.6} r={0.15} />
      <Front x={1} y={1.9} z={6}>
        <rect className="glass hot" x={0.3} y={0.3} width={6.6} height={3.7} rx={0.12} />
        <text className="plabel tiny" x={0.7} y={0.85} style={{ fontSize: 0.32 }}>ACC = ACC + B</text>
        <text className="plabel live" x={0.7} y={2.55} style={{ fontSize: 1.5 }} filter="url(#soft-p)">{m.acc}</text>
        <text className="plabel live" x={2.6} y={2.4} style={{ fontSize: 0.5 }}>{bin(m.acc)}</text>
        <text className="plabel" x={0.7} y={3.5} style={{ fontSize: 0.32 }}>B = {m.b}  ·  {m.ticks}</text>
      </Front>
      {/* keyboard */}
      <Box pr={pr} x={1.5} y={3.6} z={0} w={6} d={2} h={0.22} r={0.12} />
      <Top x={1.5} y={3.6} z={0.22}>
        {Array.from({ length: 4 }, (_, r) => Array.from({ length: 12 }, (_, c) => (
          <rect key={`${r}.${c}`} className="detail" x={0.25 + c * 0.47} y={0.22 + r * 0.42} width={0.36} height={0.32} rx={0.05} />
        )))}
      </Top>
      {/* tower */}
      <g className="inside-open" {...pressable(t.open(t.names.board), el => onOpen('board', el), 'board')}>
        <Box pr={pr} x={9.5} y={0} z={0} w={2.6} d={5.6} h={5.6} r={0.2} />
        <Front x={9.5} y={5.6} z={5.6}>
          <rect className="detail" x={0.35} y={0.5} width={1.9} height={0.5} rx={0.06} />
          <rect className="detail" x={0.35} y={1.2} width={1.9} height={0.5} rx={0.06} />
          <circle className={`glass ${blink ? 'hot' : ''}`} cx={1.3} cy={4.4} r={0.35} />
          <circle className="halo" cx={1.3} cy={4.4} r={0.5} filter="url(#bloom-p)" />
        </Front>
        <Side x={12.1} y={5.6} z={5.6}>
          <rect className="glass" x={0.5} y={0.5} width={4.6} height={4.6} rx={0.2} />
          <rect className="inside-ghost" x={1.9} y={1.5} width={1.3} height={1.3} rx={0.1} />
          {[0, 1, 2, 3].map(i => <rect key={i} className="inside-ghost" x={3.6 + i * 0.3} y={1.0} width={0.14} height={2.8} />)}
          <circle className="inside-ghost" cx={1.4} cy={4.1} r={0.6} />
          <path className="detail" d="M0.9,3.2 H3.3 M1.2,4.7 H4.6" />
        </Side>
      </g>
    </Frame>
  );
}

/** Motherboard: CPU in its socket, RAM, clock crystal and a POST display showing the accumulator. */
export function BoardScene({ m, onOpen, t }: { m: Machine; onOpen: OpenHandler; t: SceneText }) {
  const clk = m.ticks % 2 === 1;
  const accBits = bits4(m.acc);
  return (
    <Frame x0={0} y0={0} x1={17} y1={12} zt={1.8} label={t.names.board}>
      <Box pr={pr} x={0} y={0} z={-0.4} w={17} d={12} h={0.4} r={0.5} cls="plate" />
      <Top x={0} y={0} z={0}>
        {[[0.6, 0.6], [16.4, 0.6], [0.6, 11.4], [16.4, 11.4]].map(([x, y], i) => <circle key={i} className="detail" cx={x} cy={y} r={0.25} />)}
        {/* clock to CPU */}
        <path className={`trace ${clk ? 'on' : ''}`} d="M3.6,1.85 H5.2 V4 H6" />
        {/* CPU to RAM: the accumulator bits on the data bus */}
        {accBits.map((b, i) => <path key={i} className={`trace ${b ? 'on' : ''}`} d={`M10,${6.2 - i * 0.5} H12`} />)}
        {[0, 1, 2, 3].map(i => <path key={`a${i}`} className="trace" d={`M10,${3.8 + i * 0.25} H11.4 V${1.6 + i * 0.3} H12`} />)}
        {/* CPU to POST display */}
        <path className={`trace ${m.acc ? 'on' : ''}`} d="M7,7 V9 H3.8" />
        <path className="trace" d="M6,6 H4.8" />
        <text className="plabel" x={12} y={11.3} style={{ fontSize: 0.42 }}>{t.names.ram}</text>
        <text className="plabel" x={1.8} y={2.8} style={{ fontSize: 0.36 }}>{t.names.clock}</text>
        <text className="plabel" x={1.6} y={10.7} style={{ fontSize: 0.36 }}>{t.names.post}</text>
      </Top>
      <g key={m.ticks} filter="url(#soft)"><g transform={pr.TOP(0, 0, 0)}>
        <path className="pulse" d="M3.6,1.85 H5.2 V4 H6" />
        <path className="pulse" d="M10,5.2 H12" />
      </g></g>
      {/* clock crystal and its LED */}
      <Box pr={pr} x={1.8} y={1.6} z={0} w={1.6} d={0.6} h={0.5} r={0.25} />
      <g className={clk ? 'lit' : ''} filter={clk ? 'url(#glow)' : undefined}><Box pr={pr} x={4} y={1.4} z={0} w={0.35} d={0.35} h={0.15} r={0.17} /></g>
      {/* I/O chip */}
      <g className="chip"><Box pr={pr} x={2} y={4} z={0} w={2.8} d={2.6} h={0.35} r={0.1} /></g>
      <Top x={2} y={4} z={0.35}><text className="chip-txt" x={1.4} y={1.45} textAnchor="middle" style={{ fontSize: 0.5 }}>{t.names.io}</text></Top>
      {/* POST display */}
      <Box pr={pr} x={1.6} y={8.2} z={0} w={2.2} d={2} h={0.3} r={0.15} />
      <Top x={1.6} y={8.2} z={0.3}>
        <rect className="glass hot" x={0.25} y={0.25} width={1.7} height={1.5} rx={0.12} />
        <text className="plabel live" x={1.1} y={1.38} textAnchor="middle" style={{ fontSize: 1.1 }} filter="url(#soft-p)">{m.acc.toString(16).toUpperCase()}</text>
      </Top>
      {/* CPU */}
      <g className="inside-open" {...pressable(t.open(t.names.cpu), el => onOpen('cpu', el), 'cpu')}>
        <Box pr={pr} x={5.6} y={2.6} z={0} w={4.8} d={4.8} h={0.3} r={0.15} />
        <Top x={5.6} y={2.6} z={0.3}>
          {Array.from({ length: 9 }, (_, i) => <circle key={i} className="hole" cx={0.35 + i * 0.51} cy={0.3} r={0.06} />)}
        </Top>
        <g className="chip"><Box pr={pr} x={6.2} y={3.2} z={0.3} w={3.6} d={3.6} h={0.4} r={0.15} /></g>
        <Top x={6.2} y={3.2} z={0.7}>
          <rect className="inside-ring" x={0.25} y={0.25} width={3.1} height={3.1} rx={0.2} />
          <text className="chip-txt" x={1.8} y={1.95} textAnchor="middle" style={{ fontSize: 0.8, letterSpacing: 0.08 }}>{t.names.cpu}</text>
          <text className="chip-txt on" x={1.8} y={2.6} textAnchor="middle" style={{ fontSize: 0.32 }}>4-bit</text>
        </Top>
      </g>
      {/* RAM sticks */}
      <g aria-label={`${t.names.ram} · ${t.soon}`}>
        {[0, 1, 2, 3].map(i => (
          <g key={i}>
            <Box pr={pr} x={12.3 + i * 1.05} y={1} z={0} w={0.3} d={9.6} h={0.2} />
            <Box pr={pr} x={12.35 + i * 1.05} y={1.1} z={0.2} w={0.2} d={9.4} h={1.5} r={0.05} />
            <Side x={12.55 + i * 1.05} y={10.5} z={1.7}>
              {[0, 1, 2, 3, 4, 5].map(j => <rect key={j} className={`glass ${i === 0 && accBits[j % 4] ? 'hot' : ''}`} x={0.4 + j * 1.5} y={0.35} width={1.1} height={0.7} rx={0.06} />)}
            </Side>
          </g>
        ))}
      </g>
    </Frame>
  );
}

/** Inside the CPU: the accumulator, register B (click its bits), the ALU and the carry flag. */
export function CpuScene({ m, onOpen, onBit, t }: { m: Machine; onOpen: OpenHandler; onBit: (i: number) => void; t: SceneText }) {
  const clk = m.ticks % 2 === 1;
  const loop = 'M13,5.25 H15.3 V0.4 H3.5 V1';
  return (
    <Frame x0={0} y0={0} x1={17} y1={11.5} zt={1.4} label={t.names.cpu}>
      <Box pr={pr} x={0} y={0} z={-0.4} w={17} d={11.5} h={0.4} r={0.5} cls="plate" />
      <Top x={0} y={0} z={0}>
        <path className={`trace ${m.acc ? 'on' : ''}`} d="M6.4,2 H7.6 V4.3 H9" />
        <path className={`trace ${m.b ? 'on' : ''}`} d="M6.4,8 H7.6 V6.2 H9" />
        <path className={`trace ${m.acc ? 'on' : ''}`} d={loop} />
        <path className={`trace ${m.carry ? 'on' : ''}`} d="M12,3.5 V1.5 H14" />
        <path className={`trace ${clk ? 'on' : ''}`} d="M11,8.5 V7" />
        <text className="plabel" x={1.1} y={3.6} style={{ fontSize: 0.4 }}>{t.names.acc}</text>
        <text className="plabel" x={1.1} y={9.6} style={{ fontSize: 0.4 }}>{t.names.b}</text>
        <text className="plabel" x={14} y={2.9} style={{ fontSize: 0.36 }}>{t.names.carry}</text>
        <text className="plabel" x={9} y={10.85} style={{ fontSize: 0.36 }}>{t.names.clock}</text>
      </Top>
      <g key={m.ticks} filter="url(#soft)"><g transform={pr.TOP(0, 0, 0)}>
        <path className="pulse" d={loop} />
      </g></g>
      {/* accumulator */}
      <Box pr={pr} x={1} y={1} z={0} w={5.4} d={2} h={0.4} r={0.15} />
      <Top x={1} y={1} z={0.4}>
        <Bits x={0.4} y={0.55} n={m.acc} />
        <text className="plabel live" x={4.6} y={1.25} style={{ fontSize: 0.6 }}>{m.acc}</text>
      </Top>
      {/* register B */}
      <Box pr={pr} x={1} y={7} z={0} w={5.4} d={2} h={0.4} r={0.15} />
      <Top x={1} y={7} z={0.4}>
        <Bits x={0.4} y={0.55} n={m.b} onBit={onBit} />
        <text className="plabel live" x={4.6} y={1.25} style={{ fontSize: 0.6 }}>{m.b}</text>
      </Top>
      {/* carry flag */}
      <g className={m.carry ? 'lit' : ''} filter={m.carry ? 'url(#glow)' : undefined}><Box pr={pr} x={14} y={1} z={0} w={1} d={1} h={0.3} r={0.15} /></g>
      {/* clock / control */}
      <Box pr={pr} x={9} y={8.5} z={0} w={4} d={1.6} h={0.35} r={0.12} />
      <Top x={9} y={8.5} z={0.35}>
        <path className={`trace ${clk ? 'on' : ''}`} d="M0.4,1.1 h0.4 v-0.6 h0.4 v0.6 h0.4 v-0.6 h0.4 v0.6 h0.4" />
      </Top>
      {/* ALU */}
      <g className="inside-open" {...pressable(t.open(t.names.alu), el => onOpen('alu', el), 'alu')}>
        <g className="chip"><Box pr={pr} x={9} y={3.5} z={0} w={4} d={3.5} h={0.7} r={0.15} /></g>
        <Top x={9} y={3.5} z={0.7}>
          <rect className="inside-ring" x={0.2} y={0.2} width={3.6} height={3.1} rx={0.2} />
          <text className="chip-txt" x={2} y={1.6} textAnchor="middle" style={{ fontSize: 0.75, letterSpacing: 0.08 }}>{t.names.alu}</text>
          <text className="chip-txt on" x={2} y={2.4} textAnchor="middle" style={{ fontSize: 0.42 }}>A + B</text>
        </Top>
      </g>
    </Frame>
  );
}
