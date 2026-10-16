import type { CSSProperties, ReactNode } from 'react';
import { SPECS, type Comp } from '../lib/circuit.ts';
import type { Proj } from '../lib/iso.ts';
import { SEG_MAP, hexValue } from '../lib/sim.ts';

type BoxProps = { pr: Proj; x: number; y: number; z: number; w: number; d: number; h: number; r?: number; cls?: string };

/** A box is its visible faces: the front (3D view only) and the top. */
export function Box({ pr, x, y, z, w, d, h, r = 0, cls = '' }: BoxProps) {
  const rs = Math.min(r, h / 3);
  return (
    <>
      {pr.iso && (
        <g transform={pr.FRONT(x, y + d, z + h)}><rect className={`face front ${cls}`} width={w} height={h} rx={rs} /></g>
      )}
      <g transform={pr.TOP(x, y, z + h)}><rect className={`face top ${cls}`} width={w} height={d} rx={r} /></g>
    </>
  );
}

const Top = ({ pr, x, y, z, children }: { pr: Proj; x: number; y: number; z: number; children: ReactNode }) =>
  <g transform={pr.TOP(x, y, z)}>{children}</g>;

export interface PartState {
  ins: number[];
  outs: number[];
  pressed?: boolean;
}

const CHIP_Z = 0.16, CHIP_H = 0.36, INSET = 0.2;

/** A DIP chip: legs along the long edges, dark body, notch and pin-1 dot (iso-glow logic board). */
function Chip({ pr, x, y, w, d, children }: { pr: Proj; x: number; y: number; w: number; d: number; children?: ReactNode }) {
  const n = Math.max(2, Math.round(w / 0.72));
  const step = (w - 0.5) / (n - 1);
  const legs = Array.from({ length: n }, (_, i) => 0.25 + i * step - 0.07);
  const dd = d - 2 * INSET;
  return (
    <>
      {legs.map((lx, i) => <Box key={`b${i}`} pr={pr} x={x + lx} y={y + INSET - 0.12} z={0} w={0.14} d={0.12} h={CHIP_Z + 0.04} />)}
      <g className="chip"><Box pr={pr} x={x} y={y + INSET} z={CHIP_Z} w={w} d={dd} h={CHIP_H} r={0.1} /></g>
      <Top pr={pr} x={x} y={y + INSET} z={CHIP_Z + CHIP_H}>
        <path className="detail" d={`M0,${dd / 2 - 0.2} A0.2,0.2 0 0 1 0,${dd / 2 + 0.2}`} />
        <circle className="detail" cx={0.3} cy={dd - 0.28} r={0.08} />
        {children}
      </Top>
      {legs.map((lx, i) => <Box key={`f${i}`} pr={pr} x={x + lx} y={y + d - INSET} z={0} w={0.14} d={0.1} h={CHIP_Z + 0.04} />)}
    </>
  );
}

function ChipName({ w, dd, label, part }: { w: number; dd: number; label: string; part?: string }) {
  return (
    <>
      <text className="chip-txt" x={w / 2} y={dd / 2 + (part ? 0.06 : 0.17)} textAnchor="middle" style={{ fontSize: 0.46, letterSpacing: 0.04 }}>{label}</text>
      {part && <text className="chip-txt" x={w / 2} y={dd / 2 + 0.4} textAnchor="middle" style={{ fontSize: 0.2 }}>{part}</text>}
    </>
  );
}

/** Draws one component standing on the board plane at z = 0. */
export function Part({ pr, c, st, cls = '', tag }: { pr: Proj; c: Comp; st: PartState; cls?: string; tag?: string }) {
  const s = SPECS[c.kind];
  const { x, y } = c;
  const out0 = st.outs[0] ?? 0;

  switch (c.kind) {
    case 'and': case 'or': case 'xor': case 'nand': case 'nor': case 'xnor': case 'not':
      return (
        <g className={cls}>
          <Chip pr={pr} x={x} y={y} w={s.w} d={s.d}><ChipName w={s.w} dd={s.d - 2 * INSET} label={s.label} part={s.part} /></Chip>
        </g>
      );
    case 'dff': {
      const q = st.outs[0] ?? 0;
      const dd = s.d - 2 * INSET;
      return (
        <g className={cls}>
          <Chip pr={pr} x={x} y={y} w={s.w} d={s.d}>
            <ChipName w={s.w} dd={dd} label={s.label} part={s.part} />
            <text className="chip-txt" x={0.5} y={1 - INSET + 0.08} style={{ fontSize: 0.24 }}>D</text>
            <path className={`trace ${st.ins[1] ? 'on' : ''}`} d={`M0.5,${2 - INSET - 0.14} L0.72,${2 - INSET} L0.5,${2 - INSET + 0.14}`} />
            <text className={`chip-txt ${q ? 'on' : ''}`} x={s.w - 0.4} y={1 - INSET + 0.08} textAnchor="end" style={{ fontSize: 0.24 }}>Q</text>
            <text className={`chip-txt ${q ? '' : 'on'}`} x={s.w - 0.4} y={2 - INSET + 0.08} textAnchor="end" style={{ fontSize: 0.24 }}>Q̄</text>
          </Chip>
        </g>
      );
    }
    case 'switch': {
      const bx = x + 0.2, by = y + 0.5;
      return (
        <g className={cls}>
          <Top pr={pr} x={x} y={y} z={0}>
            <text className="plabel tag" x={0.22} y={0.4}>{tag}</text>
          </Top>
          <g className="base"><Box pr={pr} x={bx} y={by} z={0} w={1.6} d={1.05} h={0.4} r={0.14} /></g>
          <Top pr={pr} x={bx} y={by} z={0.4}>
            <rect className="face recess" x={0.22} y={0.36} width={1.16} height={0.34} rx={0.15} />
            <text className="plabel tiny" x={0.08} y={0.27}>0</text>
            <text className="plabel tiny" x={1.4} y={0.27}>1</text>
          </Top>
          <g className={c.on ? 'lit' : ''} filter={c.on ? 'url(#soft)' : undefined}>
            <Box pr={pr} x={bx + (c.on ? 0.9 : 0.3)} y={by + 0.33} z={0.4} w={0.4} d={0.4} h={0.5} r={0.08} />
          </g>
        </g>
      );
    }
    case 'button': {
      const down = st.pressed;
      return (
        <g className={cls}>
          <Box pr={pr} x={x + 0.25} y={y + 0.35} z={0} w={1.5} d={1.3} h={0.4} r={0.14} />
          <Top pr={pr} x={x + 0.25} y={y + 0.35} z={0.4}>
            <text className="plabel tiny" x={0.1} y={0.25}>{tag ?? 'BTN'}</text>
          </Top>
          <g className={down ? 'lit' : ''} filter={down ? 'url(#glow)' : undefined}>
            <Box pr={pr} x={x + 0.6} y={y + 0.7} z={0.4} w={0.8} d={0.6} h={down ? 0.14 : 0.36} r={0.12} />
          </g>
        </g>
      );
    }
    case 'clock': {
      const dd = s.d - 2 * INSET;
      return (
        <g className={cls}>
          <Box pr={pr} x={x} y={y + INSET} z={0} w={s.w} d={dd} h={0.42} r={0.12} />
          <Top pr={pr} x={x} y={y + INSET} z={0.42}>
            <path className={`trace ${out0 ? 'on' : ''}`} d={`M0.3,${dd / 2 + 0.3} h0.3 v-0.6 h0.3 v0.6 h0.3 v-0.6 h0.3 v0.6`} />
            <text className="plabel tiny" x={0.3} y={0.3}>CLK</text>
            <text className="plabel tiny" x={s.w - 0.2} y={0.3} textAnchor="end">{c.hz ?? 1} Hz</text>
          </Top>
          <g className={out0 ? 'lit' : ''} filter={out0 ? 'url(#glow)' : undefined}>
            <Box pr={pr} x={x + 2.2} y={y + 0.82} z={0.42} w={0.36} d={0.36} h={0.12} r={0.18} />
          </g>
        </g>
      );
    }
    case 'const': {
      return (
        <g className={cls}>
          <Box pr={pr} x={x + 0.25} y={y + 0.4} z={0} w={1.5} d={1.2} h={0.4} r={0.14} />
          <Top pr={pr} x={x + 0.25} y={y + 0.4} z={0.4}>
            <text className="plabel tiny" x={0.1} y={0.25}>VCC</text>
            <text className="plabel live" x={0.75} y={0.98} textAnchor="middle" filter="url(#soft-p)">1</text>
          </Top>
        </g>
      );
    }
    case 'led': {
      const lit = !!st.ins[0];
      const style = {
        ['--led' as string]: c.color || 'var(--glow)',
        ['--led-hi' as string]: c.color ? `color-mix(in srgb, ${c.color} 55%, white)` : 'var(--glow-hi)',
      } as CSSProperties;
      const r = 0.3, zb = 0.14, zt = 0.66;
      const [rx, ry] = pr.ellipse(r);
      const [cx, cb] = pr.P(x + 1, y + 1, zb);
      const ct = pr.P(x + 1, y + 1, zt)[1];
      return (
        <g className={cls} style={style}>
          <Box pr={pr} x={x + 0.55} y={y + 0.55} z={0} w={0.9} d={0.9} h={zb} r={0.12} />
          <g className={`ledg ${lit ? 'hot' : ''}`} filter={lit ? 'url(#glow)' : undefined}>
            {pr.iso && <path className="face" d={`M${cx - rx},${ct} L${cx - rx},${cb} A${rx},${ry} 0 0 0 ${cx + rx},${cb} L${cx + rx},${ct} Z`} />}
            <ellipse className="face top" cx={cx} cy={ct} rx={rx} ry={ry} />
          </g>
        </g>
      );
    }
    case 'seg7': {
      const v = hexValue([st.ins[0] ?? 0, st.ins[1] ?? 0, st.ins[2] ?? 0, st.ins[3] ?? 0]);
      const m = SEG_MAP[v];
      const any = st.ins.some(Boolean);
      const W = 1.2, H = 2.6, t = 0.2;
      const segs: [number, number, number, number][] = [
        [t, 0, W - 2 * t, t],                      // a
        [W - t, t, t, H / 2 - 1.5 * t],            // b
        [W - t, H / 2 + 0.5 * t, t, H / 2 - 1.5 * t], // c
        [t, H - t, W - 2 * t, t],                  // d
        [0, H / 2 + 0.5 * t, t, H / 2 - 1.5 * t],  // e
        [0, t, t, H / 2 - 1.5 * t],                // f
        [t, H / 2 - t / 2, W - 2 * t, t],          // g
      ];
      return (
        <g className={cls}>
          <Box pr={pr} x={x} y={y} z={0} w={3} d={4} h={0.5} r={0.18} />
          <Top pr={pr} x={x} y={y} z={0.5}>
            <rect className="face recess" x={0.65} y={0.42} width={2.1} height={3.3} rx={0.18} />
            {any && <rect className="halo" x={0.75} y={0.55} width={1.9} height={3.1} rx={0.15} filter="url(#bloom-p)" />}
            <rect className={`glass ${any ? 'hot' : ''}`} x={0.75} y={0.55} width={1.9} height={3.1} rx={0.15} />
            <g transform="translate(1.1 0.8)" filter={any ? 'url(#soft-p)' : undefined}>
              {segs.map(([sx, sy, sw, sh], i) => (
                <rect key={i} className={`seg ${(m >> i) & 1 ? 'on' : ''}`} x={sx} y={sy} width={sw} height={sh} rx={0.06} />
              ))}
            </g>
            {s.inNames!.map((n, i) => (
              <text key={i} className={`plabel tiny ${st.ins[i] ? 'live' : ''}`} x={0.14} y={s.ins[i] + 0.08}>{n}</text>
            ))}
          </Top>
        </g>
      );
    }
  }
}

/** Short traces from each pin to the part body, in board coordinates (drawn with the wires). */
export function leadPaths(c: Comp, st: PartState): { key: string; d: string; on: boolean }[] {
  const s = SPECS[c.kind];
  return [
    ...s.ins.map((py, i) => ({ key: `${c.id}i${i}`, d: `M${c.x - 1},${c.y + py} H${c.x}`, on: !!st.ins[i] })),
    ...s.outs.map((py, i) => ({ key: `${c.id}o${i}`, d: `M${c.x + s.w},${c.y + py} H${c.x + s.w + 1}`, on: !!st.outs[i] })),
  ];
}

/** Solder pads where wires meet a part's pins (board plane, TOP(0,0,0) space). */
export function Pads({ c, st }: { c: Comp; st: PartState }) {
  const s = SPECS[c.kind];
  return (
    <g>
      {s.ins.map((py, i) => <circle key={`i${i}`} className={`pad ${st.ins[i] ? 'hot' : ''}`} cx={c.x - 1} cy={c.y + py} r={0.12} />)}
      {s.outs.map((py, i) => <circle key={`o${i}`} className={`pad ${st.outs[i] ? 'hot' : ''}`} cx={c.x + s.w + 1} cy={c.y + py} r={0.12} />)}
    </g>
  );
}
