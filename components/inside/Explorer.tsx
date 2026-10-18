'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, CornerDownRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import {
  CIRCUITS, MACHINE0, ROOT, SCENE_OPEN, bits4, hashOf, num, pathFromHash, runLevel, tick, withInputs,
  type CircuitLevel, type LevelId, type Machine, type Stop,
} from '@/lib/inside';
import { Button } from '@/components/ui/button';
import { CircuitView } from './CircuitView';
import { BoardScene, ComputerScene, CpuScene } from './Scenes';

const TICK_MS = 1400;
const ZOOM_MS = 280;

const TAGS: Record<LevelId, Record<string, string>> = {
  pc: {}, board: {}, cpu: {},
  alu: {
    a0: 'A0', a1: 'A1', a2: 'A2', a3: 'A3', b0: 'B0', b1: 'B1', b2: 'B2', b3: 'B3',
    s0: 'S0', s1: 'S1', s2: 'S2', s3: 'S3', cout: 'C',
  },
  fa: { a: 'A', b: 'B', cin: 'Ci', s: 'S', cout: 'Co' },
  ha: { a: 'A', b: 'B', s: 'S', c: 'C' },
};

const bin = (bits: number[]) => [...bits].reverse().join('');
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

type Phase = '' | 'out' | 'in' | 'back-out' | 'back-in';

/** Values a level shows beside the drawing: what goes in and what comes out. */
function readout(level: LevelId, ins: number[], m: Machine, c?: CircuitLevel): [string, string][] {
  if (!c) return [['ACC', `${bin(bits4(m.acc))} = ${m.acc}`], ['B', `${bin(bits4(m.b))} = ${m.b}`], ['ACC + B', `${(m.acc + m.b) & 15}${(m.acc + m.b) > 15 ? ' + C' : ''}`]];
  const r = runLevel(c, ins);
  const outs = c.outputs.map(id => r.inp[id][0]);
  if (level === 'alu') {
    const a = ins.slice(0, 4), b = ins.slice(4), s = num(outs);
    return [['A', `${bin(a)} = ${num(a)}`], ['B', `${bin(b)} = ${num(b)}`], ['A + B', `${outs[4]}${bin(outs.slice(0, 4))} = ${s}`]];
  }
  const tags = TAGS[level];
  return [
    ...c.inputs.map((id, i) => [tags[id], String(ins[i])] as [string, string]),
    ...c.outputs.map((id, i) => [tags[id], String(outs[i])] as [string, string]),
  ];
}

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
  const circuit = CIRCUITS[here.level];

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
    const gate = CIRCUITS[top.level]?.gates[seg];
    focusOn(el);
    if (gate) { animate('out', '', () => location.assign(`${href('/learn')}#${gate}`)); return; }
    const next = pathFromHash(`${hashOf(cur)}/${seg}`, mRef.current, cur);
    if (next.length === cur.length) return;
    animate('out', 'in', () => goTo(next));
  }, [animate, goTo, href]);

  const up = useCallback((depth: number) => {
    const cur = pathRef.current;
    if (depth >= cur.length - 1) return;
    setOrigin('50% 50%');
    animate('back-out', 'back-in', () => goTo(cur.slice(0, depth + 1)));
  }, [animate, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') up(pathRef.current.length - 2); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [up]);

  const toggle = (id: string) => {
    if (!circuit) return;
    const i = circuit.inputs.indexOf(id);
    setPath(p => [...p.slice(0, -1), { ...here, ins: here.ins.map((v, j) => (j === i ? v ^ 1 : v)) }]);
  };
  const flipB = (i: number) => setM(x => ({ ...x, b: x.b ^ (1 << i) }));

  const circ = useMemo(() => (circuit ? withInputs(circuit, here.ins) : null), [circuit, here.ins]);
  const sim = useMemo(() => (circuit ? runLevel(circuit, here.ins) : null), [circuit, here.ins]);

  const names = T.names;
  const title = (s: Stop) => (s.level === 'fa' ? `${T.levels.fa.title} ${s.seg.slice(2)}` : s.level === 'ha' ? `${T.levels.ha.title} ${s.seg.slice(2)}` : T.levels[s.level].title);
  const sceneText = { open: T.open, soon: T.soon, names };

  // what can be opened from here, as buttons (the same targets as the glowing parts)
  const targets: { seg: string; label: string; gate?: boolean }[] = circuit
    ? [
      ...Object.keys(circuit.open).map(seg => ({ seg, label: `${T.levels[circuit.open[seg]].title} ${seg.slice(2)}` })),
      ...Object.entries(circuit.gates).map(([seg, k]) => ({ seg, label: `${t.parts[k]} · ${T.guide}`, gate: true })),
    ]
    : (SCENE_OPEN[here.level] ?? []).map(seg => ({ seg, label: T.levels[seg].title }));

  const openFromList = (seg: string) => {
    const el = stage.current?.querySelector(`[data-open="${seg}"]`) ?? stage.current;
    if (el) open(seg, el);
  };

  let drawing;
  if (circ && sim && circuit) {
    const openable = Object.fromEntries([
      ...Object.keys(circuit.open).map(id => [id, T.open(`${T.levels[circuit.open[id]].title} ${id.slice(2)}`)]),
      ...Object.entries(circuit.gates).map(([id, k]) => [id, T.open(t.parts[k])]),
    ]);
    drawing = <CircuitView circ={circ} sim={sim} tags={TAGS[here.level]} openable={openable} onToggle={toggle} onOpen={open} label={title(here)} />;
  } else if (here.level === 'pc') drawing = <ComputerScene m={m} onOpen={open} t={sceneText} />;
  else if (here.level === 'board') drawing = <BoardScene m={m} onOpen={open} t={sceneText} />;
  else drawing = <CpuScene m={m} onOpen={open} onBit={flipB} t={sceneText} />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
      <nav aria-label={T.path} className="flex min-h-9 flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="border-edge text-ink-hi" disabled={path.length < 2} onClick={() => up(path.length - 2)}>
          <ArrowLeft />{T.back}
        </Button>
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
          <div key={hashOf(path)} className="inside-zoom absolute inset-0 p-1 sm:p-6" data-phase={phase} style={{ transformOrigin: origin }}
>
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
              {readout(here.level, here.ins, m, circuit).map(([k, v]) => (
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
