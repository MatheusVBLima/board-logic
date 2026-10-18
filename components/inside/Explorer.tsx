'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, CornerDownRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import {
  CIRCUITS, MACHINE0, ROOT, SCENES, bits4, coreOps, fanRpm, gateOf, hashOf, isCircuitLevel, lastAddr, num, pathFromHash, pcOf, scanRow, settle, tick, typeChar, withInputs,
  type LevelId, type Machine, type Stop,
} from '@/lib/inside';
import { hexValue } from '@/lib/sim';
import { CircuitView } from './CircuitView';
import { SCENE_VIEWS } from './Scenes';

const TICK_MS = 1400;
const ZOOM_MS = 280;

const TAGS: Partial<Record<LevelId, Record<string, string>>> = {
  alu: {
    a0: 'A0', a1: 'A1', a2: 'A2', a3: 'A3', b0: 'B0', b1: 'B1', b2: 'B2', b3: 'B3',
    s0: 'S0', s1: 'S1', s2: 'S2', s3: 'S3', cout: 'C',
  },
  fa: { a: 'A', b: 'B', cin: 'Ci', s: 'S', cout: 'Co' },
  ha: { a: 'A', b: 'B', s: 'S', c: 'C' },
  reg: { d0: 'D0', d1: 'D1', d2: 'D2', d3: 'D3', clk: 'CK', q0: 'Q0', q1: 'Q1', q2: 'Q2', q3: 'Q3' },
  counter: { clk: 'CK' },
  dec: { a0: 'A0', a1: 'A1', l0: 'Y0', l1: 'Y1', l2: 'Y2', l3: 'Y3' },
  dff: { d: 'D', clk: 'CK', q: 'Q', qn: 'Q̄' },
  enc: { k0: 'K0', k1: 'K1', k2: 'K2', k3: 'K3', l0: 'C0', l1: 'C1' },
  disp: { v0: '1', v1: '2', v2: '4', v3: '8' },
};

const bin = (bits: number[]) => [...bits].reverse().join('');
const b4 = (v: number) => `${bin(bits4(v))} = ${v}`;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

type Phase = '' | 'out' | 'in' | 'back-out' | 'back-in';

export function Explorer() {
  const { t, href } = useI18n();
  const T = t.inside;
  const [m, setM] = useState<Machine>(MACHINE0);
  const [path, setPath] = useState<Stop[]>([ROOT]);
  const [phase, setPhase] = useState<Phase>('');
  const [origin, setOrigin] = useState('50% 50%');
  const stage = useRef<HTMLDivElement>(null);
  const mRef = useRef(m);
  mRef.current = m;
  const pathRef = useRef(path);
  pathRef.current = path;

  const here = path[path.length - 1];
  const circuit = isCircuitLevel(here.level) ? CIRCUITS[here.level] : null;

  // the machine runs while one of the drawn levels is on screen
  useEffect(() => {
    if (circuit) return;
    const id = setInterval(() => setM(tick), TICK_MS);
    return () => clearInterval(id);
  }, [circuit]);

  // the hash names the open levels, so reloads, links and the browser's back button work
  useEffect(() => {
    const sync = () => setPath(p => pathFromHash(location.hash, mRef.current, p));
    sync();
    addEventListener('popstate', sync);
    addEventListener('hashchange', sync);
    return () => { removeEventListener('popstate', sync); removeEventListener('hashchange', sync); };
  }, []);

  const animate = useCallback((out: Phase, inn: Phase, go: () => void) => {
    if (reduced()) { go(); return; }
    setPhase(out);
    setTimeout(() => { go(); setPhase(inn); setTimeout(() => setPhase(''), ZOOM_MS); }, ZOOM_MS);
  }, []);

  const goTo = useCallback((next: Stop[]) => {
    const hash = hashOf(next);
    history.pushState(null, '', hash ? `#${hash}` : location.pathname + location.search);
    setPath(next);
  }, []);

  const focusOn = (el: Element) => {
    const box = stage.current?.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (box) setOrigin(`${r.left + r.width / 2 - box.left}px ${r.top + r.height / 2 - box.top}px`);
  };

  const open = useCallback((seg: string, el: Element) => {
    const cur = pathRef.current, top = cur[cur.length - 1];
    // a gate is the bottom level: nothing to zoom into, so go straight to its lesson
    const gate = gateOf(top.level, seg);
    if (gate) { location.assign(`${href('/learn')}#${gate}`); return; }
    focusOn(el);
    const next = pathFromHash(`${hashOf(cur)}/${seg}`, mRef.current, cur);
    if (next.length === cur.length) return;
    animate('out', 'in', () => goTo(next));
  }, [animate, goTo, href]);

  const up = useCallback((depth: number) => {
    const cur = pathRef.current;
    if (depth < 0 || depth >= cur.length - 1) return;
    setOrigin('50% 50%');
    animate('back-out', 'back-in', () => goTo(cur.slice(0, depth + 1)));
  }, [animate, goTo]);

  // keys held down on the real keyboard, lit on the drawn one
  const [held, setHeld] = useState<ReadonlySet<string>>(new Set());
  const hold = useCallback((code: string, on: boolean) => setHeld(h => {
    if (h.has(code) === on) return h;
    const next = new Set(h);
    if (on) next.add(code); else next.delete(code);
    return next;
  }), []);

  /** One keystroke into the machine: the screen gets the character, a hex digit also goes to B. */
  const typeIn = useCallback((key: string) => {
    const prev = mRef.current, next = typeChar(prev, key);
    if (next === prev) return false;
    setM(x => typeChar(x, key));
    // a scan circuit of the keyboard on screen shows the new key straight away
    const cur = pathRef.current;
    if (next.key !== prev.key && cur.some(s => s.level === 'keyboard') && isCircuitLevel(cur[cur.length - 1].level)) {
      setPath(pathFromHash(location.hash, next, []));
    }
    return true;
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { up(pathRef.current.length - 2); return; }
      // the real keyboard types into the machine, unless it is driving a button or a field
      const el = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || el?.closest('input, textarea, select, [contenteditable]')) return;
      if ((e.key === ' ' || e.key === 'Enter') && el?.closest('[role=button], button, a')) return;
      hold(e.code, true);
      if (typeIn(e.key) && (e.key === ' ' || e.key === 'Backspace')) e.preventDefault();
    };
    const upKey = (e: KeyboardEvent) => hold(e.code, false);
    const clear = () => setHeld(new Set());
    addEventListener('keydown', down);
    addEventListener('keyup', upKey);
    addEventListener('blur', clear);
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', upKey); removeEventListener('blur', clear); };
  }, [up, hold, typeIn]);

  const toggle = (id: string) => {
    if (!circuit) return;
    const i = circuit.inputs.indexOf(id);
    setPath(p => {
      const cur = p[p.length - 1];
      const ins = cur.ins.map((v, j) => (j === i ? v ^ 1 : v));
      return [...p.slice(0, -1), { ...cur, ins, state: settle(circuit, ins, cur.state) }];
    });
  };
  const flipB = (i: number) => setM(x => ({ ...x, b: x.b ^ (1 << i) }));
  /** A click on a drawn key: it lights for a moment and types like the real one. */
  const press = (code: string, key: string) => {
    hold(code, true);
    setTimeout(() => hold(code, false), 180);
    typeIn(key);
  };

  const title = (s: Stop) => {
    const base = s.seg.replace(/\d+$/, ''), d = s.seg.slice(base.length);
    const segs = T.segs as Record<string, string>;
    if (segs[s.seg]) return segs[s.seg];
    if (segs[base]) return `${segs[base]} ${d}`;
    return `${T.levels[s.level].title}${d ? ` ${d}` : ''}`;
  };

  // what can be opened from here, as buttons (the same targets as the glowing parts)
  const opens = circuit ? circuit.open : SCENES[here.level as keyof typeof SCENES].open;
  const gates = (circuit ? circuit.gates : SCENES[here.level as keyof typeof SCENES].gates) ?? {};
  const targets = [
    ...Object.entries(opens).map(([seg, level]) => ({ seg, label: title({ seg, level, ins: [] }) })),
    // one lesson link per kind of gate, however many of them the circuit has
    ...Object.entries(gates).filter(([, k], i, all) => all.findIndex(([, j]) => j === k) === i)
      .map(([seg, k]) => ({ seg, label: `${t.parts[k]} · ${T.guide}` })),
  ];

  const openFromList = (seg: string) => {
    const el = stage.current?.querySelector(`[data-open="${seg}"]`) ?? stage.current;
    if (el) open(seg, el);
  };

  // values beside the drawing: what goes in and what comes out
  let values: [string, string][];
  if (circuit && here.state) {
    const sim = here.state.sim, ins = here.ins;
    const outs = circuit.outputs.map(id => sim.inp[id]?.[0] ?? 0);
    const tags = TAGS[here.level] ?? {};
    if (here.level === 'alu') {
      const a = ins.slice(0, 4), b = ins.slice(4);
      values = [['A', b4(num(a))], ['B', b4(num(b))], ['A + B', `${outs[4]}${bin(outs.slice(0, 4))} = ${num(outs)}`]];
    } else if (here.level === 'reg') {
      values = [['D', b4(num(ins.slice(0, 4)))], ['CK', String(ins[4])], ['Q', b4(num(outs))]];
    } else if (here.level === 'disp') {
      values = [['V', b4(num(ins))], ['HEX', num(ins).toString(16).toUpperCase()]];
    } else if (here.level === 'counter') {
      values = [['CK', String(ins[0])], ['Q', b4(hexValue(sim.inp.hex ?? []))]];
    } else {
      values = [
        ...circuit.inputs.map((id, i) => [tags[id] ?? id, String(ins[i])] as [string, string]),
        ...circuit.outputs.map((id, i) => [tags[id] ?? id, String(outs[i])] as [string, string]),
      ];
    }
  } else if (here.level === 'keyboard') {
    values = [[T.key, m.key.toString(16).toUpperCase()], [T.code, b4(m.key)], [T.segs.rows, String(m.key >> 2)], [T.segs.cols, String(m.key & 3)], ['B', b4(m.b)], [T.typed, m.text.slice(-12) || '…']];
  } else if (here.level === 'monitor') {
    values = [['ACC', `${m.acc.toString(16).toUpperCase()} (${b4(m.acc)})`], ['B', `${m.b.toString(16).toUpperCase()} (${b4(m.b)})`], [T.row, `${scanRow(m)} / 7`], [T.typed, m.text.slice(-12) || '…']];
  } else if (here.level === 'cooler') {
    values = [[T.rpm, `${fanRpm(m)}`], ['ACC', b4(m.acc)]];
  } else if (here.level === 'gpu' || here.level === 'gpucore') {
    values = [[T.frame, String(m.ticks & 15)], ...[0, 5, 15].map(k => { const [a, b] = coreOps(m, k); return [`${T.segs.core} ${k}`, `${a} + ${b} = ${(a + b) & 15}`] as [string, string]; })];
  } else if (here.level === 'ram' || here.level === 'ssd') {
    values = m.ram.map((v, i) => [`${T.segs.w} ${i}${i === lastAddr(m) ? ' ←' : ''}`, b4(v)]);
  } else if (here.level === 'psu') {
    values = [['12 V', 'CPU, GPU'], ['5 V', 'SSD, USB'], ['3,3 V', 'RAM']];
  } else {
    values = [['ACC', b4(m.acc)], ['B', b4(m.b)], ['PC', b4(pcOf(m))], ['ACC + B', `${(m.acc + m.b) & 15}${m.acc + m.b > 15 ? ' + C' : ''}`]];
  }

  let drawing;
  if (circuit && here.state) {
    const openable = Object.fromEntries([
      ...Object.keys(circuit.open).map(id => [id, T.open(title({ seg: id, level: circuit.open[id], ins: [] }))]),
      ...Object.entries(circuit.gates).map(([id, k]) => [id, T.open(t.parts[k])]),
    ]);
    drawing = <CircuitView circ={withInputs(circuit, here.ins)} sim={here.state.sim} tags={TAGS[here.level] ?? {}} openable={openable} onToggle={toggle} onOpen={open} label={title(here)} />;
  } else {
    const View = SCENE_VIEWS[here.level as keyof typeof SCENE_VIEWS];
    drawing = <View m={m} onOpen={open} n={T.names} open={T.open} onBit={flipB} onKey={press} held={held} />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
      <nav aria-label={T.path} className="flex min-h-9 flex-wrap items-center gap-2">
        <ol className="flex min-w-0 flex-wrap items-center gap-1 text-[12px] tracking-[0.08em] uppercase">
          {path.map((s, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight aria-hidden className="size-3.5 text-ink/60" />}
              {i === path.length - 1
                ? <span aria-current="location" className="px-1.5 py-1 text-glow">{title(s)}</span>
                : <button type="button" onClick={() => up(i)} className="rounded px-1.5 py-1 text-ink hover:bg-accent hover:text-ink-hi">{title(s)}</button>}
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div ref={stage} className="inside-stage relative overflow-hidden rounded-xl border border-edge">
          <div key={hashOf(path)} className="inside-zoom absolute inset-0 p-1 sm:p-6" data-phase={phase} style={{ transformOrigin: origin }}>
            {drawing}
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-edge bg-panel p-5" aria-live="polite">
          <div>
            <p className="text-[10.5px] tracking-[0.16em] text-ink uppercase">{T.level} {path.length}</p>
            <h1 className="mt-1 text-xl tracking-[0.04em] text-ink-hi">{title(here)}</h1>
          </div>
          <p className="text-[13px] leading-relaxed text-ink">{T.levels[here.level].body}</p>

          <div>
            <h2 className="mb-2 text-[10.5px] tracking-[0.16em] text-ink uppercase">{circuit ? T.values : T.running}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
              {values.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-ink">{k}</dt>
                  <dd className="text-ink-hi tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {targets.length > 0 && (
            <div>
              <h2 className="mb-2 text-[10.5px] tracking-[0.16em] text-ink uppercase">{T.inside}</h2>
              <ul className="flex flex-col gap-1.5">
                {targets.map(x => (
                  <li key={x.seg}>
                    <button type="button" onClick={() => openFromList(x.seg)}
                      className="flex w-full items-center gap-2 rounded-md border border-edge px-3 py-2 text-left text-[12px] text-ink-hi transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-glow">
                      <CornerDownRight className="size-3.5 text-glow" />{x.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {here.level === 'pc' && <p className="text-[12px] leading-relaxed text-ink">{T.later}</p>}
        </aside>
      </div>
    </div>
  );
}
