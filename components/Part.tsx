import type { ReactNode } from 'react';
import { SPECS, type Comp } from '../lib/circuit.ts';
import type { Proj } from '../lib/iso.ts';
import { SEG_MAP, hexValue } from '../lib/sim.ts';

type BoxProps = { pr: Proj; x: number; y: number; z: number; w: number; d: number; h: number; r?: number; cls?: string };

/** A box is its three visible faces: right side, front, top. */
export function Box({ pr, x, y, z, w, d, h, r = 0, cls = '' }: BoxProps) {
  const rs = Math.min(r, h / 4);
  return (
    <>
      {pr.iso && (
        <g transform={pr.SIDE(x + w, y + d, z + h)}><rect className={`face side ${cls}`} width={d} height={h} rx={rs} /></g>
      )}
      {pr.iso && (
        <g transform={pr.FRONT(x, y + d, z + h)}><rect className={`face front ${cls}`} width={w} height={h} rx={rs} /></g>
      )}
      <g transform={pr.TOP(x, y, z + h)}><rect className={`face top ${cls}`} width={w} height={d} rx={r} /></g>
    </>
  );
}

const Top = ({ pr, x, y, z, children }: { pr: Proj; x: number; y: number; z: number; children: ReactNode }) =>
  <g transform={pr.TOP(x, y, z)}>{children}</g>;

// Gate symbols in a unit box, signal flowing left to right.
const AND_P = 'M0,0 H0.5 A0.5,0.5 0 0 1 0.5,1 H0 Z';
const OR_P = 'M0,0 Q0.32,0.5 0,1 Q0.62,1 1,0.5 Q0.62,0 0,0 Z';
const XOR_EXTRA = 'M-0.14,0 Q0.18,0.5 -0.14,1';
const NOT_P = 'M0,0.08 L0.78,0.5 L0,0.92 Z';

function GateSymbol({ kind, on }: { kind: string; on: boolean }) {
  const base = kind === 'nand' ? 'and' : kind === 'nor' ? 'or' : kind === 'xnor' ? 'xor' : kind;
  const bubble = kind === 'nand' || kind === 'nor' || kind === 'xnor' || kind === 'not';
  const body = base === 'and' ? AND_P : base === 'not' ? NOT_P : OR_P;
  const tipX = base === 'not' ? 0.78 : 1;
  return (
    <g className={`sym ${on ? 'on' : ''}`}>
      <path d={body} />
      {base === 'xor' && <path d={XOR_EXTRA} className="open" />}
      {bubble && <circle cx={tipX + 0.08} cy={0.5} r={0.08} />}
    </g>
  );
}

export interface PartState {
  ins: number[];
  outs: number[];
  pressed?: boolean;
}

/** Draws one component standing on the board plane at z = 0. */
export function Part({ pr, c, st, cls = '' }: { pr: Proj; c: Comp; st: PartState; cls?: string }) {
  const s = SPECS[c.kind];
  const { x, y } = c;
  const h = s.h;
  const out0 = st.outs[0] ?? 0;
  const label = (
    <text className="plabel" x={0.16} y={0.36}>{s.label}</text>
  );

  switch (c.kind) {
    case 'and': case 'or': case 'xor': case 'nand': case 'nor': case 'xnor': case 'not': {
      const sx = 0.85, sy = 0.38, sc = 1.24;
      return (
        <g className={cls}>
          <Box pr={pr} x={x} y={y} z={0} w={s.w} d={s.d} h={h} r={0.22} />
          <Top pr={pr} x={x} y={y} z={h}>
            {s.ins.map((py, i) => (
              <line key={i} className={`trace ${st.ins[i] ? 'on' : ''}`} x1={0} y1={py} x2={sx + 0.25} y2={py} />
            ))}
            <line className={`trace ${out0 ? 'on' : ''}`} x1={sx + sc} y1={s.outs[0]} x2={s.w} y2={s.outs[0]} />
            <g transform={`translate(${sx} ${sy}) scale(${sc})`}><GateSymbol kind={c.kind} on={!!out0} /></g>
            {label}
          </Top>
        </g>
      );
    }
    case 'switch': {
      const lx = c.on ? 1.05 : 0.45;
      return (
        <g className={`${cls} press`}>
          <Box pr={pr} x={x} y={y} z={0} w={2} d={2} h={h} r={0.2} />
          <Top pr={pr} x={x} y={y} z={h}>
            <rect className="detail slot" x={0.35} y={0.72} width={1.3} height={0.56} rx={0.28} />
            <text className={`plabel big ${c.on ? '' : 'hi'}`} x={0.32} y={1.78}>0</text>
            <text className={`plabel big ${c.on ? 'hi' : ''}`} x={1.48} y={1.78}>1</text>
            {label}
          </Top>
          <Box pr={pr} x={x + lx} y={y + 0.76} z={h} w={0.5} d={0.48} h={0.42} r={0.1} cls={c.on ? 'lit' : ''} />
        </g>
      );
    }
    case 'button': {
      const down = st.pressed;
      return (
        <g className={`${cls} press`}>
          <Box pr={pr} x={x} y={y} z={0} w={2} d={2} h={h} r={0.2} />
          <Top pr={pr} x={x} y={y} z={h}>{label}</Top>
          <g className="cap" style={{ transform: `translateY(${down ? 0.22 * pr.K : 0}px)` }}>
            <Box pr={pr} x={x + 0.45} y={y + 0.5} z={h} w={1.1} d={1.1} h={0.4} r={0.3} cls={down ? 'lit' : ''} />
          </g>
        </g>
      );
    }
    case 'clock': {
      return (
        <g className={`${cls} press`}>
          <Box pr={pr} x={x} y={y} z={0} w={3} d={2} h={h} r={0.22} />
          <Top pr={pr} x={x} y={y} z={h}>
            <path className={`trace ${out0 ? 'on' : ''}`} d="M0.3,1.45 h0.35 v-0.6 h0.35 v0.6 h0.35 v-0.6 h0.35 v0.6" />
            <circle className={`dot ${out0 ? 'on' : ''}`} cx={2.45} cy={1.15} r={0.2} />
            <text className="plabel" x={2.84} y={0.36} textAnchor="end">{c.hz ?? 1} Hz</text>
            <line className={`trace ${out0 ? 'on' : ''}`} x1={2.65} y1={1} x2={3} y2={1} />
            {label}
          </Top>
        </g>
      );
    }
    case 'const': {
      return (
        <g className={cls}>
          <Box pr={pr} x={x} y={y} z={0} w={2} d={2} h={h} r={0.2} />
          <Top pr={pr} x={x} y={y} z={h}>
            <text className="plabel huge hi glowtxt" x={0.72} y={1.55}>1</text>
            <line className="trace on" x1={1.35} y1={1} x2={2} y2={1} />
            {label}
          </Top>
        </g>
      );
    }
    case 'dff': {
      const q = st.outs[0] ?? 0;
      return (
        <g className={cls}>
          <Box pr={pr} x={x} y={y} z={0} w={3} d={3} h={h} r={0.22} />
          <Top pr={pr} x={x} y={y} z={h}>
            <rect className="detail" x={0.4} y={0.55} width={2.2} height={2.1} rx={0.12} />
            <text className="plabel mid" x={0.55} y={1.16}>D</text>
            <path className={`trace ${st.ins[1] ? 'on' : ''}`} d="M0.4,1.8 L0.72,2 L0.4,2.2" />
            <text className={`plabel mid ${q ? 'hi glowtxt' : ''}`} x={2.45} y={1.16} textAnchor="end">Q</text>
            <text className={`plabel mid ${q ? '' : 'hi glowtxt'}`} x={2.45} y={2.16} textAnchor="end">Q̄</text>
            {label}
          </Top>
        </g>
      );
    }
    case 'led': {
      const lit = !!st.ins[0];
      const color = c.color ?? '#ff5a4f';
      const [rx, ry] = pr.ellipse(0.58);
      const [cx, cb] = pr.P(x + 1, y + 1, h);
      const ct = pr.iso ? pr.P(x + 1, y + 1, h + 0.5)[1] : cb;
      return (
        <g className={`${cls} press`} style={{ ['--led' as string]: color }}>
          <Box pr={pr} x={x} y={y} z={0} w={2} d={2} h={h} r={0.25} />
          <Top pr={pr} x={x} y={y} z={h}>{label}</Top>
          {lit && <ellipse className="halo" cx={cx} cy={ct} rx={rx * 2.6} ry={ry * 2.6} />}
          {pr.iso && (
            <path className={`lens side ${lit ? 'lit' : ''}`}
              d={`M${cx - rx},${ct} L${cx - rx},${cb} A${rx},${ry} 0 0 0 ${cx + rx},${cb} L${cx + rx},${ct} Z`} />
          )}
          <ellipse className={`lens ${lit ? 'lit' : ''}`} cx={cx} cy={ct} rx={rx} ry={ry} />
          <ellipse className="shine" cx={cx - rx * 0.35} cy={ct - ry * 0.3} rx={rx * 0.22} ry={ry * 0.22} />
        </g>
      );
    }
    case 'seg7': {
      const v = hexValue([st.ins[0] ?? 0, st.ins[1] ?? 0, st.ins[2] ?? 0, st.ins[3] ?? 0]);
      const m = SEG_MAP[v];
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
          <Box pr={pr} x={x} y={y} z={0} w={3} d={4} h={h} r={0.22} />
          <Top pr={pr} x={x} y={y} z={h}>
            <rect className="glass" x={0.75} y={0.55} width={1.9} height={3.1} rx={0.15} />
            <g transform="translate(1.1 0.8)">
              {segs.map(([sx, sy, sw, sh], i) => (
                <rect key={i} className={`seg ${(m >> i) & 1 ? 'on' : ''}`} x={sx} y={sy} width={sw} height={sh} rx={0.06} />
              ))}
            </g>
            {s.inNames!.map((n, i) => (
              <text key={i} className={`plabel ${st.ins[i] ? 'hi' : ''}`} x={0.14} y={s.ins[i] + 0.13}>{n}</text>
            ))}
            <text className="plabel" x={2.84} y={0.36} textAnchor="end">{s.label}</text>
          </Top>
        </g>
      );
    }
  }
}

/** Leads and pads on the board plane (drawn under everything, in TOP(0,0,0) space). */
export function Leads({ c, st }: { c: Comp; st: PartState }) {
  const s = SPECS[c.kind];
  return (
    <g>
      {s.ins.map((py, i) => (
        <g key={`i${i}`} className={st.ins[i] ? 'on' : ''}>
          <line className="lead" x1={c.x - 1} y1={c.y + py} x2={c.x} y2={c.y + py} />
          <rect className="pad" x={c.x - 1.18} y={c.y + py - 0.18} width={0.36} height={0.36} rx={0.08} />
        </g>
      ))}
      {s.outs.map((py, i) => (
        <g key={`o${i}`} className={st.outs[i] ? 'on' : ''}>
          <line className="lead" x1={c.x + s.w} y1={c.y + py} x2={c.x + s.w + 1} y2={c.y + py} />
          <rect className="pad out" x={c.x + s.w + 0.82} y={c.y + py - 0.18} width={0.36} height={0.36} rx={0.18} />
        </g>
      ))}
    </g>
  );
}
