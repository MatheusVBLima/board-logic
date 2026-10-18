'use client';

import type { CSSProperties, ReactNode } from 'react';
import { makeProj } from '@/lib/iso';
import { bits4, coreOps, fanRpm, lastAddr, pcOf, type Machine, type SceneId } from '@/lib/inside';
import type { Dict } from '@/lib/i18n/en';
import { Box } from '@/components/Part';
import { pressable, type OpenHandler } from './CircuitView';

const pr = makeProj(true, 20);
const Top = ({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) => <g transform={pr.TOP(x, y, z)}>{children}</g>;
const Front = ({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) => <g transform={pr.FRONT(x, y, z)}>{children}</g>;
const Side = ({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) => <g transform={pr.SIDE(x, y, z)}>{children}</g>;

export type Names = Dict['inside']['names'];
export interface SceneProps { m: Machine; onOpen: OpenHandler; n: Names; open: (what: string) => string; onBit?: (i: number) => void }

/** SVG framing a block of the scene floor (x0..x1, y0..y1) up to height zt. */
function Frame({ x0, y0, x1, y1, zt, label, children }: { x0: number; y0: number; x1: number; y1: number; zt: number; label: string; children: ReactNode }) {
  const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].flatMap(([x, y]) => [pr.P(x, y, -1), pr.P(x, y, zt)]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const vb = `${Math.min(...xs) - 10} ${Math.min(...ys) - 10} ${Math.max(...xs) - Math.min(...xs) + 20} ${Math.max(...ys) - Math.min(...ys) + 20}`;
  return <svg viewBox={vb} className="board-svg h-full w-full" role="group" aria-label={label}>{children}</svg>;
}

/** A part that opens the next level: glows on hover, opens on click or Enter. */
function Opens({ seg, label, onOpen, children }: { seg: string; label: string; onOpen: OpenHandler; children: ReactNode }) {
  return <g className="inside-open" {...pressable(label, el => onOpen(seg, el), seg)}>{children}</g>;
}

const Label = ({ x, y, children, size = 0.34, live }: { x: number; y: number; children: ReactNode; size?: number; live?: boolean }) =>
  <text className={`plabel ${live ? 'live' : ''}`} x={x} y={y} style={{ fontSize: size }}>{children}</text>;

/** Four bit cells, most significant on the left, lit when set. */
function Bits({ x, y, n, size = 0.7, onBit }: { x: number; y: number; n: number; size?: number; onBit?: (i: number) => void }) {
  return (
    <>
      {bits4(n).map((b, i) => {
        const cx = x + (3 - i) * (size + 0.15);
        const cell = (
          <>
            <rect className={`glass ${b ? 'hot' : ''}`} x={cx} y={y} width={size} height={size} rx={0.1} />
            <text className={`chip-txt ${b ? 'on' : ''}`} x={cx + size / 2} y={y + size * 0.7} textAnchor="middle" style={{ fontSize: size * 0.55 }}>{b}</text>
          </>
        );
        if (!onBit) return <g key={i}>{cell}</g>;
        const press = pressable(`bit ${i}`, () => onBit(i));
        return (
          <g key={i} className="inside-bit" {...press}
            onClick={e => { e.stopPropagation(); onBit(i); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); press.onKeyDown(e); } }}>
            {cell}
          </g>
        );
      })}
    </>
  );
}

/** A spinning fan seen face-on, in the local units of whatever face it is drawn on. */
function Fan({ cx, cy, r, rpm }: { cx: number; cy: number; r: number; rpm: number }) {
  const style = { ['--spin' as string]: `${(1.4 * 900 / rpm).toFixed(2)}s` } as CSSProperties;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle className="face recess" r={r} />
      <g className="inside-spin" style={style}>
        <circle r={r * 0.92} fill="transparent" />
        {[0, 1, 2, 3, 4, 5, 6].map(k => <ellipse key={k} className="inside-blade" cx={0} cy={-r * 0.5} rx={r * 0.17} ry={r * 0.4} transform={`rotate(${k * 360 / 7}) skewX(-18)`} />)}
      </g>
      <circle className="face" r={r * 0.24} />
    </g>
  );
}

/** Upright cylinder (capacitor) standing on the floor at (x, y). */
function Cylinder({ x, y, r, h, hot }: { x: number; y: number; r: number; h: number; hot?: boolean }) {
  const [rx, ry] = pr.ellipse(r);
  const [cx, cb] = pr.P(x, y, 0);
  const ct = pr.P(x, y, h)[1];
  return (
    <g className={hot ? 'lit' : ''}>
      <path className="face" d={`M${cx - rx},${ct} L${cx - rx},${cb} A${rx},${ry} 0 0 0 ${cx + rx},${cb} L${cx + rx},${ct} Z`} />
      <ellipse className="face top" cx={cx} cy={ct} rx={rx} ry={ry} />
    </g>
  );
}

const fins = (n: number, w: number, h: number, vertical = true) =>
  Array.from({ length: n }, (_, i) => {
    const p = ((i + 1) * (vertical ? w : h)) / (n + 1);
    return <path key={i} className="detail" d={vertical ? `M${p},0.15 V${h - 0.15}` : `M0.15,${p} H${w - 0.15}`} />;
  });

// ---------- computer ----------

/** Desk with a monitor, keyboard and the tower; the tower opens the case. */
export function ComputerScene({ m, onOpen, n, open }: SceneProps) {
  const blink = m.ticks % 2 === 1;
  return (
    <Frame x0={-1} y0={-1} x1={14} y1={8} zt={6.4} label={n.computer}>
      <Box pr={pr} x={-1} y={-1} z={-0.45} w={15} d={9} h={0.45} r={0.8} cls="plate" />
      <Box pr={pr} x={3.4} y={0.5} z={0} w={2.4} d={2} h={0.14} r={0.3} />
      <Box pr={pr} x={4.2} y={1.1} z={0.14} w={0.8} d={0.35} h={1.3} />
      <Box pr={pr} x={1} y={1.5} z={1.4} w={7.2} d={0.4} h={4.6} r={0.15} />
      <Front x={1} y={1.9} z={6}>
        <rect className="glass hot" x={0.3} y={0.3} width={6.6} height={3.7} rx={0.12} />
        <Label x={0.7} y={0.85} size={0.32}>ACC = ACC + B</Label>
        <text className="plabel live" x={0.7} y={2.55} style={{ fontSize: 1.5 }} filter="url(#soft-p)">{m.acc}</text>
        <Label x={2.6} y={2.4} size={0.5} live>{m.acc.toString(2).padStart(4, '0')}</Label>
        <Label x={0.7} y={3.5} size={0.32}>B = {m.b}  ·  PC = {pcOf(m)}</Label>
      </Front>
      <Box pr={pr} x={1.5} y={3.6} z={0} w={6} d={2} h={0.22} r={0.12} />
      <Top x={1.5} y={3.6} z={0.22}>
        {Array.from({ length: 4 }, (_, r) => Array.from({ length: 12 }, (_, c) => (
          <rect key={`${r}.${c}`} className="detail" x={0.25 + c * 0.47} y={0.22 + r * 0.42} width={0.36} height={0.32} rx={0.05} />
        )))}
      </Top>
      <Opens seg="case" label={open(n.case)} onOpen={onOpen}>
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
      </Opens>
    </Frame>
  );
}

/** The case with its side panel off: motherboard on the back wall and every part mounted on it. */
export function CaseScene({ m, onOpen, n, open }: SceneProps) {
  const rpm = fanRpm(m);
  return (
    <Frame x0={-0.6} y0={0} x1={6} y1={10.4} zt={9.4} label={n.case}>
      <Box pr={pr} x={0} y={0} z={-0.3} w={6} d={10} h={0.3} r={0.2} cls="plate" />
      <Box pr={pr} x={-0.4} y={0} z={0} w={0.4} d={10} h={9.2} r={0.1} />
      <Opens seg="board" label={open(n.board)} onOpen={onOpen}>
        <Box pr={pr} x={0} y={1} z={2.6} w={0.12} d={7} h={6} r={0.08} />
        <Side x={0.12} y={8} z={8.6}>
          <rect className="inside-ring" x={0.15} y={0.15} width={6.7} height={5.7} rx={0.2} />
          <path className="trace" d="M0.6,1 H2.2 V2.6 M0.6,1.4 H1.9 V2.6 M0.6,5.2 H6.4 M0.6,4.9 H6.4" />
          <rect className="detail" x={4.4} y={0.4} width={2} height={1} rx={0.1} />
          <Label x={2.6} y={0.55} size={0.3}>{n.board}</Label>
        </Side>
      </Opens>
      <Opens seg="ssd" label={open(n.ssd)} onOpen={onOpen}>
        <Box pr={pr} x={0.12} y={0.8} z={7.7} w={0.16} d={2.4} h={0.5} r={0.05} />
        <Side x={0.28} y={3.2} z={8.2}>
          <rect className="inside-ring" x={0.05} y={0.05} width={2.3} height={0.4} rx={0.1} />
          <Label x={0.2} y={0.36} size={0.26}>{n.ssd}</Label>
          <circle className={`glass ${m.ticks % 2 ? 'hot' : ''}`} cx={2.05} cy={0.25} r={0.1} />
        </Side>
      </Opens>
      <Opens seg="psu" label={open(n.psu)} onOpen={onOpen}>
        <Box pr={pr} x={0.12} y={5.6} z={0} w={4.3} d={3.9} h={2.2} r={0.12} />
        <Front x={0.12} y={9.5} z={2.2}><Label x={0.3} y={0.6}>{n.psu}</Label>{fins(10, 4.3, 2.2)}</Front>
        <Side x={4.42} y={9.5} z={2.2}><Fan cx={1.95} cy={1.1} r={0.9} rpm={700} /></Side>
      </Opens>
      <Opens seg="gpu" label={open(n.gpu)} onOpen={onOpen}>
        <Box pr={pr} x={0.12} y={1} z={3.3} w={4.4} d={7.4} h={1.1} r={0.1} />
        <Side x={4.52} y={8.4} z={4.4}>
          <rect className="glass hot" x={0.5} y={0.3} width={4} height={0.18} rx={0.09} />
          <Label x={5.2} y={0.75} size={0.36} live>{n.gpu}</Label>
        </Side>
        <Top x={0.12} y={1} z={4.4}>{fins(14, 4.4, 7.4, false)}</Top>
      </Opens>
      <Opens seg="cooler" label={open(n.cooler)} onOpen={onOpen}>
        {Array.from({ length: 9 }, (_, i) => <Box key={i} pr={pr} x={0.12} y={3.4} z={5.4 + i * 0.28} w={2.9} d={1.9} h={0.06} />)}
        <Box pr={pr} x={0.12} y={5.3} z={5.25} w={3} d={0.3} h={2.8} r={0.12} />
        <Front x={0.12} y={5.6} z={8.05}><Fan cx={1.5} cy={1.4} r={1.15} rpm={rpm} /></Front>
      </Opens>
      <Opens seg="ram" label={open(n.ram)} onOpen={onOpen}>
        {[6, 6.6].map((y, i) => (
          <g key={i}>
            <Box pr={pr} x={0.12} y={y} z={5} w={1.3} d={0.22} h={3} r={0.04} />
            <Front x={0.12} y={y + 0.22} z={8}>
              {[0, 1, 2].map(j => <rect key={j} className={`glass ${bits4(m.ram[j + i] ?? 0)[0] ? 'hot' : ''}`} x={0.3} y={0.4 + j * 0.85} width={0.7} height={0.6} rx={0.05} />)}
            </Front>
          </g>
        ))}
      </Opens>
    </Frame>
  );
}

/** Motherboard: CPU socket, RAM slots, clock crystal and a POST display showing the accumulator. */
export function BoardScene({ m, onOpen, n, open }: SceneProps) {
  const clk = m.ticks % 2 === 1;
  const accBits = bits4(m.acc);
  return (
    <Frame x0={0} y0={0} x1={17} y1={12} zt={1.8} label={n.board}>
      <Box pr={pr} x={0} y={0} z={-0.4} w={17} d={12} h={0.4} r={0.5} cls="plate" />
      <Top x={0} y={0} z={0}>
        {[[0.6, 0.6], [16.4, 0.6], [0.6, 11.4], [16.4, 11.4]].map(([x, y], i) => <circle key={i} className="detail" cx={x} cy={y} r={0.25} />)}
        <path className={`trace ${clk ? 'on' : ''}`} d="M3.6,1.85 H5.2 V4 H6" />
        {accBits.map((b, i) => <path key={i} className={`trace ${b ? 'on' : ''}`} d={`M10,${6.2 - i * 0.5} H12`} />)}
        {[0, 1, 2, 3].map(i => <path key={`a${i}`} className="trace" d={`M10,${3.8 + i * 0.25} H11.4 V${1.6 + i * 0.3} H12`} />)}
        <path className={`trace ${m.acc ? 'on' : ''}`} d="M7,7 V9 H3.8" />
        <path className="trace" d="M6,6 H4.8" />
        <Label x={12} y={11.3} size={0.42}>{n.ram}</Label>
        <Label x={1.8} y={2.8} size={0.36}>{n.clock}</Label>
        <Label x={1.6} y={10.7} size={0.36}>{n.post}</Label>
      </Top>
      <g key={m.ticks} filter="url(#soft)"><g transform={pr.TOP(0, 0, 0)}>
        <path className="pulse" d="M3.6,1.85 H5.2 V4 H6" />
        <path className="pulse" d="M10,5.2 H12" />
      </g></g>
      <Box pr={pr} x={1.8} y={1.6} z={0} w={1.6} d={0.6} h={0.5} r={0.25} />
      <g className={clk ? 'lit' : ''} filter={clk ? 'url(#glow)' : undefined}><Box pr={pr} x={4} y={1.4} z={0} w={0.35} d={0.35} h={0.15} r={0.17} /></g>
      <g className="chip"><Box pr={pr} x={2} y={4} z={0} w={2.8} d={2.6} h={0.35} r={0.1} /></g>
      <Top x={2} y={4} z={0.35}><text className="chip-txt" x={1.4} y={1.45} textAnchor="middle" style={{ fontSize: 0.5 }}>{n.io}</text></Top>
      <Box pr={pr} x={1.6} y={8.2} z={0} w={2.2} d={2} h={0.3} r={0.15} />
      <Top x={1.6} y={8.2} z={0.3}>
        <rect className="glass hot" x={0.25} y={0.25} width={1.7} height={1.5} rx={0.12} />
        <text className="plabel live" x={1.1} y={1.38} textAnchor="middle" style={{ fontSize: 1.1 }} filter="url(#soft-p)">{m.acc.toString(16).toUpperCase()}</text>
      </Top>
      <Opens seg="cpu" label={open(n.cpu)} onOpen={onOpen}>
        <Box pr={pr} x={5.6} y={2.6} z={0} w={4.8} d={4.8} h={0.3} r={0.15} />
        <Top x={5.6} y={2.6} z={0.3}>
          {Array.from({ length: 9 }, (_, i) => <circle key={i} className="hole" cx={0.35 + i * 0.51} cy={0.3} r={0.06} />)}
        </Top>
        <g className="chip"><Box pr={pr} x={6.2} y={3.2} z={0.3} w={3.6} d={3.6} h={0.4} r={0.15} /></g>
        <Top x={6.2} y={3.2} z={0.7}>
          <rect className="inside-ring" x={0.25} y={0.25} width={3.1} height={3.1} rx={0.2} />
          <text className="chip-txt" x={1.8} y={1.95} textAnchor="middle" style={{ fontSize: 0.8, letterSpacing: 0.08 }}>{n.cpu}</text>
          <text className="chip-txt on" x={1.8} y={2.6} textAnchor="middle" style={{ fontSize: 0.32 }}>4-bit</text>
        </Top>
      </Opens>
      <Opens seg="ram" label={open(n.ram)} onOpen={onOpen}>
        {[0, 1, 2, 3].map(i => (
          <g key={i}>
            <Box pr={pr} x={12.3 + i * 1.05} y={1} z={0} w={0.3} d={9.6} h={0.2} />
            <Box pr={pr} x={12.35 + i * 1.05} y={1.1} z={0.2} w={0.2} d={9.4} h={1.5} r={0.05} />
            <Side x={12.55 + i * 1.05} y={10.5} z={1.7}>
              {[0, 1, 2, 3, 4, 5].map(j => <rect key={j} className={`glass ${bits4(m.ram[i])[j % 4] ? 'hot' : ''}`} x={0.4 + j * 1.5} y={0.35} width={1.1} height={0.7} rx={0.06} />)}
            </Side>
          </g>
        ))}
      </Opens>
    </Frame>
  );
}

/** A register block on the CPU die: name, four bit cells and the value. */
function Reg({ x, y, name, v, onBit }: { x: number; y: number; name: string; v: number; onBit?: (i: number) => void }) {
  return (
    <>
      <Box pr={pr} x={x} y={y} z={0} w={5.4} d={1.9} h={0.4} r={0.15} />
      <Top x={x} y={y} z={0.4}>
        <Label x={0.3} y={0.45} size={0.3}>{name}</Label>
        <Bits x={0.3} y={0.7} n={v} />
        <Label x={4.2} y={1.35} size={0.6} live>{v}</Label>
      </Top>
    </>
  );
}

/** Inside the CPU: control unit, program counter, registers, ALU, cache and clock. */
export function CpuScene({ m, onOpen, onBit, n, open }: SceneProps) {
  const clk = m.ticks % 2 === 1;
  const loop = 'M11,9.7 V10.2 H7.2 V9.3 H6.4';
  return (
    <Frame x0={0} y0={0} x1={18} y1={13.4} zt={1.4} label={n.cpu}>
      <Box pr={pr} x={0} y={0} z={-0.4} w={18} d={13.4} h={0.4} r={0.5} cls="plate" />
      <Top x={0} y={0} z={0}>
        <path className={`trace ${m.acc ? 'on' : ''}`} d="M6.4,8.6 H7.6 V7.2 H9" />
        <path className={`trace ${m.b ? 'on' : ''}`} d="M6.4,11.6 H8.2 V8.7 H9" />
        <path className={`trace ${m.acc ? 'on' : ''}`} d={loop} />
        <path className={`trace ${pcOf(m) ? 'on' : ''}`} d="M6.4,5.9 H7.6 V2.9 H9" />
        <path className="trace on" d="M9,1.8 H6" />
        <path className="trace on" d="M4.6,4.2 V4.6 H11 V6.2" />
        <path className={`trace ${m.carry ? 'on' : ''}`} d="M13,7 H14.6" />
        <path className={`trace ${clk ? 'on' : ''}`} d="M15.6,10.2 V9 H13" />
      </Top>
      <g key={m.ticks} filter="url(#soft)"><g transform={pr.TOP(0, 0, 0)}>
        <path className="pulse" d={loop} />
        <path className="pulse" d="M6.4,5.9 H7.6 V2.9 H9" />
      </g></g>
      <Opens seg="ctrl" label={open(n.ctrl)} onOpen={onOpen}>
        <Box pr={pr} x={1} y={1} z={0} w={5} d={3.2} h={0.5} r={0.15} />
        <Top x={1} y={1} z={0.5}>
          <rect className="inside-ring" x={0.15} y={0.15} width={4.7} height={2.9} rx={0.2} />
          <Label x={0.4} y={0.65} size={0.3}>{n.ctrl}</Label>
          <Label x={0.4} y={1.9} size={0.8} live>ADD</Label>
          <Label x={0.4} y={2.6} size={0.3}>opcode 00</Label>
        </Top>
      </Opens>
      <Opens seg="pc" label={open(n.pc)} onOpen={onOpen}><Reg x={1} y={5} name={n.pc} v={pcOf(m)} /></Opens>
      <Opens seg="acc" label={open(n.acc)} onOpen={onOpen}><Reg x={1} y={7.8} name={n.acc} v={m.acc} /></Opens>
      <Opens seg="b" label={open(n.b)} onOpen={onOpen}><Reg x={1} y={10.6} name={n.b} v={m.b} onBit={onBit} /></Opens>
      <Opens seg="cache" label={open(n.cache)} onOpen={onOpen}>
        <Box pr={pr} x={9} y={1} z={0} w={8} d={3.4} h={0.4} r={0.15} />
        <Top x={9} y={1} z={0.4}>
          <Label x={0.3} y={0.5} size={0.3}>{n.cache}</Label>
          {m.ram.map((v, r) => bits4(v).map((b, i) => (
            <rect key={`${r}.${i}`} className={`glass ${b ? 'hot' : ''}`} x={0.4 + (3 - i) * 0.7 + (r % 2) * 3.6} y={0.8 + Math.floor(r / 2) * 1.2} width={0.55} height={0.9} rx={0.06} />
          )))}
        </Top>
      </Opens>
      <g className={m.carry ? 'lit' : ''} filter={m.carry ? 'url(#glow)' : undefined}><Box pr={pr} x={14.6} y={6.5} z={0} w={1} d={1} h={0.3} r={0.15} /></g>
      <Top x={14.6} y={6.5} z={0}><Label x={0} y={1.6} size={0.3}>{n.carry}</Label></Top>
      <Opens seg="clock" label={open(n.clock)} onOpen={onOpen}>
        <Box pr={pr} x={14} y={10.2} z={0} w={3.2} d={2} h={0.35} r={0.12} />
        <Top x={14} y={10.2} z={0.35}>
          <Label x={0.3} y={0.5} size={0.3}>{n.clock}</Label>
          <path className={`trace ${clk ? 'on' : ''}`} d="M0.3,1.6 h0.4 v-0.6 h0.4 v0.6 h0.4 v-0.6 h0.4 v0.6 h0.4 v-0.6 h0.4" />
        </Top>
      </Opens>
      <Opens seg="alu" label={open(n.alu)} onOpen={onOpen}>
        <g className="chip"><Box pr={pr} x={9} y={6.2} z={0} w={4} d={3.5} h={0.7} r={0.15} /></g>
        <Top x={9} y={6.2} z={0.7}>
          <rect className="inside-ring" x={0.2} y={0.2} width={3.6} height={3.1} rx={0.2} />
          <text className="chip-txt" x={2} y={1.6} textAnchor="middle" style={{ fontSize: 0.75, letterSpacing: 0.08 }}>{n.alu}</text>
          <text className="chip-txt on" x={2} y={2.4} textAnchor="middle" style={{ fontSize: 0.42 }}>A + B</text>
        </Top>
      </Opens>
    </Frame>
  );
}

// ---------- parts in the case ----------

/** Tower cooler: copper base, heat pipes, a fin stack and the fan with its speed controller. */
export function CoolerScene({ m, onOpen, n, open }: SceneProps) {
  const rpm = fanRpm(m);
  return (
    <Frame x0={0} y0={0} x1={10} y1={8} zt={7.6} label={n.cooler}>
      <Box pr={pr} x={0} y={0} z={-0.3} w={10} d={8} h={0.3} r={0.4} cls="plate" />
      <Box pr={pr} x={2} y={2.4} z={0} w={4} d={3.4} h={0.4} r={0.1} />
      {[2.6, 3.8, 5].map(x => <Box key={x} pr={pr} x={x} y={3.9} z={0.4} w={0.35} d={0.35} h={6.2} r={0.17} />)}
      {Array.from({ length: 13 }, (_, i) => <Box key={i} pr={pr} x={1} y={1.6} z={1.8 + i * 0.42} w={6} d={5} h={0.07} />)}
      <Box pr={pr} x={1} y={6.7} z={1.6} w={6} d={0.35} h={5.6} r={0.2} />
      <Front x={1} y={7.05} z={7.2}><Fan cx={3} cy={2.8} r={2.5} rpm={rpm} /></Front>
      <Top x={0} y={0} z={0}><path className={`trace ${m.ticks % 2 ? 'on' : ''}`} d="M7,7.4 H8.2 V6.4" /></Top>
      <Opens seg="pwm" label={open(n.pwm)} onOpen={onOpen}>
        <Box pr={pr} x={7.6} y={4.6} z={0} w={2} d={1.8} h={0.2} r={0.1} />
        <g className="chip"><Box pr={pr} x={8} y={5} z={0.2} w={1.2} d={1} h={0.3} r={0.08} /></g>
        <Top x={7.6} y={4.6} z={0.2}><rect className="inside-ring" x={0.1} y={0.1} width={1.8} height={1.6} rx={0.15} /></Top>
        <Top x={7.6} y={6.5} z={0}><Label x={0} y={0.4} size={0.3}>{n.pwm}</Label></Top>
      </Opens>
    </Frame>
  );
}

/** Graphics card, exploded: fan shroud lifted off, GPU chip, VRAM, power and video outputs. */
export function GpuScene({ m, onOpen, n, open }: SceneProps) {
  const rpm = 700 + (m.ticks % 4) * 120;
  return (
    <Frame x0={0} y0={-8} x1={16.6} y1={7} zt={1.4} label={n.gpu}>
      <Opens seg="fan" label={open(n.fan)} onOpen={onOpen}>
        <Box pr={pr} x={0} y={-8} z={0} w={15} d={6.4} h={0.4} r={0.6} />
        <Top x={0} y={-8} z={0.4}>
          <Fan cx={3.9} cy={3.2} r={2.7} rpm={rpm} />
          <Fan cx={10.8} cy={3.2} r={2.7} rpm={rpm} />
        </Top>
      </Opens>
      <Box pr={pr} x={0} y={0} z={0} w={15} d={7} h={0.25} r={0.15} cls="plate" />
      <Top x={0} y={0} z={0.25}>
        <path className="trace on" d="M6.2,3.5 H4.8 M9.8,3.5 H11.2" />
        <path className="trace" d="M2.4,1.3 H6 V2 M6.2,4.6 H3 V6" />
        {Array.from({ length: 12 }, (_, i) => <rect key={i} className="pad" x={1 + i * 1.1} y={6.5} width={0.7} height={0.4} />)}
      </Top>
      <Box pr={pr} x={0.6} y={0.5} z={0.25} w={1.6} d={1.2} h={0.7} r={0.08} />
      <Opens seg="vram" label={open(n.vram)} onOpen={onOpen}>
        {[[3, 1.2], [3, 4.2], [11.2, 1.2], [11.2, 4.2]].map(([x, y]) => (
          <g key={`${x}.${y}`} className="chip"><Box pr={pr} x={x} y={y} z={0.25} w={1.8} d={1.5} h={0.25} r={0.06} /></g>
        ))}
        <Top x={3} y={2.85} z={0.25}><Label x={0} y={0.3} size={0.3}>{n.vram}</Label></Top>
      </Opens>
      <Opens seg="die" label={open(n.die)} onOpen={onOpen}>
        <g className="chip"><Box pr={pr} x={6.2} y={1.8} z={0.25} w={3.6} d={3.4} h={0.4} r={0.1} /></g>
        <Top x={6.2} y={1.8} z={0.65}>
          <rect className="inside-ring" x={0.15} y={0.15} width={3.3} height={3.1} rx={0.2} />
          {Array.from({ length: 16 }, (_, k) => {
            const [a, b] = coreOps(m, k), v = (a + b) & 15;
            return <rect key={k} className="glass hot" x={0.5 + (k % 4) * 0.68} y={0.4 + Math.floor(k / 4) * 0.68} width={0.55} height={0.55} rx={0.05} style={{ fillOpacity: 0.15 + v / 18 }} />;
          })}
        </Top>
      </Opens>
      <Box pr={pr} x={15} y={0.6} z={0} w={0.4} d={5.8} h={1.3} r={0.05} />
      <Side x={15.4} y={6.4} z={1.3}>
        {[0.5, 1.9, 3.3].map(u => <rect key={u} className="face recess" x={u} y={0.4} width={1.1} height={0.5} rx={0.08} />)}
        <circle className={`glass ${m.ticks % 2 ? 'hot' : ''}`} cx={5} cy={0.65} r={0.18} />
      </Side>
    </Frame>
  );
}

/** Inside the GPU chip: sixteen small cores, each running the same addition on a different pixel. */
export function GpuCoreScene({ m, onOpen, n, open }: SceneProps) {
  return (
    <Frame x0={0} y0={0} x1={13.4} y1={13.4} zt={1} label={n.die}>
      <Box pr={pr} x={0} y={0} z={-0.4} w={13.4} d={13.4} h={0.4} r={0.5} cls="plate" />
      {Array.from({ length: 16 }, (_, k) => {
        const x = 0.8 + (k % 4) * 3.1, y = 0.8 + Math.floor(k / 4) * 3.1;
        const [a, b] = coreOps(m, k), v = (a + b) & 15;
        return (
          <Opens key={k} seg={`core${k}`} label={open(`${n.core} ${k}`)} onOpen={onOpen}>
            <Box pr={pr} x={x} y={y} z={0} w={2.6} d={2.6} h={0.35} r={0.12} />
            <Top x={x} y={y} z={0.35}>
              <rect className="glass hot" x={0.3} y={0.3} width={2} height={1.4} rx={0.1} style={{ fillOpacity: 0.1 + v / 16 }} />
              <Label x={0.3} y={2.25} size={0.3}>{a}+{b}</Label>
              <Label x={1.6} y={2.3} size={0.45} live>{v}</Label>
            </Top>
          </Opens>
        );
      })}
    </Frame>
  );
}

/** A memory chip: the address decoder picks one word (row) of four bits to read or write. */
export function RamScene({ m, onOpen, n, open }: SceneProps) {
  const at = lastAddr(m);
  return (
    <Frame x0={0} y0={0} x1={15} y1={10.4} zt={1} label={n.ram}>
      <Box pr={pr} x={0} y={0} z={-0.4} w={15} d={10.4} h={0.4} r={0.5} cls="plate" />
      <Top x={0} y={0} z={0}>
        {[0, 1, 2, 3].map(i => <path key={i} className={`trace ${i === at ? 'on' : ''}`} d={`M4.4,${2.2 + 2.2 * i} H6.4`} />)}
        <path className="trace on" d="M13.4,9.6 H2.6 V8.6" />
      </Top>
      <Opens seg="dec" label={open(n.dec)} onOpen={onOpen}>
        <Box pr={pr} x={1} y={1.2} z={0} w={3.4} d={7.4} h={0.45} r={0.15} />
        <Top x={1} y={1.2} z={0.45}>
          <rect className="inside-ring" x={0.15} y={0.15} width={3.1} height={7.1} rx={0.2} />
          <Label x={0.35} y={0.7} size={0.3}>{n.dec}</Label>
          {[0, 1].map(i => <rect key={i} className={`glass ${(at >> (1 - i)) & 1 ? 'hot' : ''}`} x={0.5 + i * 0.9} y={1.1} width={0.7} height={0.7} rx={0.08} />)}
          <Label x={0.4} y={3} size={0.6} live>{at}</Label>
        </Top>
      </Opens>
      {m.ram.map((v, i) => (
        <Opens key={i} seg={`w${i}`} label={open(`${n.word} ${i}`)} onOpen={onOpen}>
          <Box pr={pr} x={6.4} y={1.4 + 2.2 * i} z={0} w={7.2} d={1.7} h={0.3} r={0.12} />
          <Top x={6.4} y={1.4 + 2.2 * i} z={0.3}>
            {i === at && <rect className="inside-ring" x={0.1} y={0.1} width={7} height={1.5} rx={0.2} />}
            <Label x={0.3} y={1.05} size={0.34}>{n.word} {i}</Label>
            <Bits x={2.6} y={0.45} n={v} size={0.8} />
            <Label x={6.4} y={1.15} size={0.6} live>{v}</Label>
          </Top>
        </Opens>
      ))}
    </Frame>
  );
}

/** M.2 SSD: controller, a DRAM cache and two flash chips, with the gold contacts on the left. */
export function SsdScene({ m, onOpen, n, open }: SceneProps) {
  const busy = m.ticks % 2 === 1;
  return (
    <Frame x0={0} y0={0} x1={16} y1={5} zt={0.8} label={n.ssd}>
      <Box pr={pr} x={0} y={0} z={-0.2} w={16} d={4.6} h={0.2} r={0.15} cls="plate" />
      <Top x={0} y={0} z={0}>
        {Array.from({ length: 9 }, (_, i) => <rect key={i} className="pad hot" x={0.15} y={0.4 + i * 0.42} width={0.7} height={0.26} />)}
        <path className={`trace ${busy ? 'on' : ''}`} d="M0.9,2.3 H2 M5,2.2 H6 M8,2.2 H9 M12,2.2 H12.5" />
        <circle className={`glass ${busy ? 'hot' : ''}`} cx={15.4} cy={3.8} r={0.22} />
      </Top>
      <Opens seg="ctl" label={open(n.ctl)} onOpen={onOpen}>
        <g className="chip"><Box pr={pr} x={2} y={1} z={0} w={3} d={2.6} h={0.35} r={0.08} /></g>
        <Top x={2} y={1} z={0.35}><rect className="inside-ring" x={0.1} y={0.1} width={2.8} height={2.4} rx={0.15} /><Label x={0.3} y={1.4} size={0.3}>{n.ctl}</Label></Top>
      </Opens>
      <Opens seg="cache" label={open(n.cache)} onOpen={onOpen}>
        <g className="chip"><Box pr={pr} x={6} y={1.3} z={0} w={2} d={2} h={0.25} r={0.08} /></g>
        <Top x={6} y={1.3} z={0.25}><Label x={0.25} y={1.15} size={0.28}>DRAM</Label></Top>
      </Opens>
      {[9, 12.5].map((x, i) => (
        <Opens key={i} seg={`nand${i}`} label={open(`${n.nand} ${i}`)} onOpen={onOpen}>
          <g className="chip"><Box pr={pr} x={x} y={0.8} z={0} w={3} d={3} h={0.3} r={0.08} /></g>
          <Top x={x} y={0.8} z={0.3}><Label x={0.3} y={1.6} size={0.28}>{n.nand} {i}</Label></Top>
        </Opens>
      ))}
    </Frame>
  );
}

/** Power supply, open: transformer, capacitors, heatsinks, fan and the output rails. Analog, no gates. */
export function PsuScene({ m, n }: SceneProps) {
  return (
    <Frame x0={0} y0={0} x1={13} y1={9} zt={2.6} label={n.psu}>
      <Box pr={pr} x={0} y={0} z={-0.3} w={13} d={9} h={0.3} r={0.3} cls="plate" />
      <Top x={0} y={0} z={0}>
        <Fan cx={3.2} cy={6.2} r={2} rpm={700} />
        <path className="trace on" d="M4.6,3 H6.4 M9.4,3 H10.6 M9.4,5.6 H10.6" />
      </Top>
      <Box pr={pr} x={1.6} y={1.2} z={0} w={3} d={2.6} h={2.2} r={0.15} />
      <Front x={1.6} y={3.8} z={2.2}>{fins(10, 3, 2.2)}</Front>
      <Cylinder x={7} y={2} r={0.6} h={2.3} />
      <Cylinder x={8.6} y={2} r={0.6} h={2.3} />
      <Box pr={pr} x={6.2} y={5} z={0} w={3.2} d={0.3} h={1.8} r={0.05} />
      <Front x={6.2} y={5.3} z={1.8}>{fins(7, 3.2, 1.8)}</Front>
      <Box pr={pr} x={10.6} y={1.4} z={0} w={1.3} d={6} h={0.6} r={0.1} />
      <Top x={10.6} y={1.4} z={0.6}>
        {['12 V', '5 V', '3,3 V'].map((v, i) => (
          <g key={v}>
            <rect className={`glass ${(m.ticks + i) % 3 ? 'hot' : ''}`} x={0.2} y={0.4 + i * 1.9} width={0.9} height={1.2} rx={0.1} />
            <Label x={0.25} y={1.9 + i * 1.9} size={0.26}>{v}</Label>
          </g>
        ))}
      </Top>
    </Frame>
  );
}

export const SCENE_VIEWS: Record<SceneId, (p: SceneProps) => ReactNode> = {
  pc: ComputerScene, case: CaseScene, board: BoardScene, cpu: CpuScene, cooler: CoolerScene,
  gpu: GpuScene, gpucore: GpuCoreScene, ram: RamScene, ssd: SsdScene, psu: PsuScene,
};
