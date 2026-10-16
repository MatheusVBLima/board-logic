'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, Eraser, GraduationCap, Grid3x3, Link2, Maximize, Pause, Play, Redo2, Trash2, Undo2, ZoomIn, ZoomOut,
} from 'lucide-react';
import {
  BOARD_SIZES, CLOCK_HZ, GLOWS, LED_COLORS, PALETTE, SPECS,
  boardSize, boundsOf, clampPos, decodeCircuit, encodeCircuit, isCircuit, minBoard, newComp, overlaps, pinPos, routeWire, uid,
  type Circuit, type Comp, type Kind, type Wire,
} from '@/lib/circuit';
import { EXAMPLES } from '@/lib/examples';
import { makeProj, type Proj } from '@/lib/iso';
import { hexValue, simulate, type Memory, type SimResult } from '@/lib/sim';
import { Box, Pads, Part, leadPaths, type PartState } from '@/components/Part';
import { LearnPanel } from '@/components/LearnPanel';
import { PartIcon } from '@/components/PartIcon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const K = 20;
const STORE_KEY = 'board-logica:v1';

type Side = 'in' | 'out';
interface PinSel { c: string; side: Side; p: number }
type Sel = { type: 'comp' | 'wire'; id: string } | null;

type Drag =
  | { type: 'pan'; sx: number; sy: number; cx: number; cy: number }
  | { type: 'move'; id: string; ox: number; oy: number; sx: number; sy: number; moved: boolean; overDock: boolean }
  | { type: 'wire'; from: PinSel; cur: [number, number]; sx: number; sy: number; sticky: boolean }
  | { type: 'new'; kind: Kind; sx: number; sy: number; moved: boolean; pos: [number, number] | null };

interface View { cx: number; cy: number; zoom: number }

const emptySim: SimResult = { out: {}, inp: {}, unstable: false };
const partState = (sim: SimResult, c: Comp, pressed: Set<string>): PartState => ({
  ins: sim.inp[c.id] ?? [], outs: sim.out[c.id] ?? [], pressed: pressed.has(c.id),
});
// front view: parts further back (smaller y) are drawn first
const depth = (c: Comp) => c.y + SPECS[c.kind].d + c.x * 0.001;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
/** a saved circuit grows its board if a part sits outside it */
const fitBoard = (c: Circuit): Circuit => {
  const m = minBoard(c), b = boardSize(c);
  return m.w > b.w || m.h > b.h ? { ...c, w: Math.max(b.w, m.w), h: Math.max(b.h, m.h) } : c;
};

export default function Simulator() {
  // ---------- circuit + history ----------
  const [circ, setCircRaw] = useState<Circuit>(() => EXAMPLES[0].make());
  const past = useRef<Circuit[]>([]);
  const future = useRef<Circuit[]>([]);
  const [, bumpHistory] = useState(0);
  const commit = useCallback((next: Circuit | ((c: Circuit) => Circuit), prev?: Circuit) => {
    setCircRaw(cur => {
      const n = typeof next === 'function' ? next(cur) : next;
      if (n === cur) return cur;
      past.current.push(prev ?? cur);
      if (past.current.length > 200) past.current.shift();
      future.current = [];
      return n;
    });
    bumpHistory(v => v + 1);
  }, []);
  const undo = useCallback(() => {
    const p = past.current.pop();
    if (!p) return;
    setCircRaw(cur => { future.current.push(cur); return p; });
    bumpHistory(v => v + 1);
  }, []);
  const redo = useCallback(() => {
    const f = future.current.pop();
    if (!f) return;
    setCircRaw(cur => { past.current.push(cur); return f; });
    bumpHistory(v => v + 1);
  }, []);

  const [sel, setSel] = useState<Sel>(null);
  const [iso, setIso] = useState(true);
  const [glow, setGlow] = useState<string>(GLOWS[0].id);
  const [learnOpen, setLearnOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pressed, setPressed] = useState<Set<string>>(() => new Set());
  const [drag, setDragState] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const setDrag = (d: Drag | null) => { dragRef.current = d; setDragState(d); };
  const [toast, setToast] = useState<string | null>(null);

  const pr = useMemo(() => makeProj(iso, K), [iso]);

  // ---------- simulation ----------
  const mem = useRef<Memory>({});
  const lastOut = useRef<Record<string, number[]>>({});
  const clockLevels = useRef<Record<string, number>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused) return;
    const t0 = performance.now();
    const id = setInterval(() => {
      const now = performance.now() - t0;
      let changed = false;
      for (const c of circRef.current.comps) {
        if (c.kind !== 'clock') continue;
        const level = Math.floor(now / (500 / (c.hz ?? 1))) % 2;
        if (clockLevels.current[c.id] !== level) { clockLevels.current[c.id] = level; changed = true; }
      }
      if (changed) setTick(t => t + 1);
    }, 16);
    return () => clearInterval(id);
  }, [paused]);

  const sim = useMemo(() => {
    const r = simulate(circ, { pressed, clocks: clockLevels.current }, mem.current, lastOut.current);
    lastOut.current = r.out;
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circ, pressed, tick]);

  // ---------- view ----------
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const boardRef = useRef<SVGGElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 600 });
  const [view, setView] = useState<View>({ cx: 0, cy: 200, zoom: 1 });

  const fitTo = useCallback((c: Circuit, p: Proj, s = size, whole = false) => {
    const bs = boardSize(c);
    const b = whole ? { x0: -2.5, y0: -2.5, x1: bs.w + 2.5, y1: bs.h + 2.5 } : boundsOf(c);
    const pts = [[b.x0, b.y0], [b.x1, b.y0], [b.x0, b.y1], [b.x1, b.y1]].flatMap(([x, y]) => [p.P(x, y, 0), p.P(x, y, 1.2)]);
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const zoom = Math.max(0.15, Math.min(2.4, Math.min(s.w / (w * (whole ? 1.06 : 1.18)), s.h / (h * (whole ? 1.08 : 1.22)))));
    setView({ cx: (Math.max(...xs) + Math.min(...xs)) / 2, cy: (Math.max(...ys) + Math.min(...ys)) / 2, zoom });
  }, [size]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize({ w: Math.max(200, width), h: Math.max(200, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---------- load / save ----------
  const loaded = useRef(false);
  useEffect(() => {
    let start: Circuit | null = null;
    const m = location.hash.match(/c=([\w-]+)/);
    if (m) start = decodeCircuit(m[1]);
    if (!start) {
      try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const c = JSON.parse(raw); if (isCircuit(c)) start = c; } } catch { /* ignore */ }
    }
    try {
      const g = localStorage.getItem(STORE_KEY + ':glow');
      if (g && GLOWS.some(x => x.id === g)) setGlow(g);
    } catch { /* ignore */ }
    if (start) { start = fitBoard(start); setCircRaw(start); }
    loaded.current = true;
    requestAnimationFrame(() => fitTo(start ?? circRef.current, pr, sizeRef.current, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // frame the board again once the stage's real size is known (first measure, small screens)
  const measured = useRef(false);
  useEffect(() => {
    if (measured.current || !loaded.current || (size.w === 1000 && size.h === 600)) return;
    measured.current = true;
    fitTo(circRef.current, pr, size, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(circ)); } catch { /* ignore */ } }, 300);
    return () => clearTimeout(t);
  }, [circ]);

  useEffect(() => {
    const g = GLOWS.find(x => x.id === glow) ?? GLOWS[0];
    document.documentElement.style.setProperty('--glow', g.c);
    document.documentElement.style.setProperty('--glow-hi', g.hi);
    try { localStorage.setItem(STORE_KEY + ':glow', g.id); } catch { /* ignore */ }
  }, [glow]);

  // latest values for window listeners
  const circRef = useRef(circ); circRef.current = circ;
  const viewRef = useRef(view); viewRef.current = view;
  const sizeRef = useRef(size); sizeRef.current = size;
  const selRef = useRef(sel); selRef.current = sel;

  // ---------- geometry helpers ----------
  const boardPoint = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const g = boardRef.current;
    const m = g?.getScreenCTM();
    if (!g || !m) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  }, []);

  const vbW = size.w / view.zoom, vbH = size.h / view.zoom;
  const viewBox = `${view.cx - vbW / 2} ${view.cy - vbH / 2} ${vbW} ${vbH}`;

  const zoomAt = useCallback((factor: number, clientX?: number, clientY?: number) => {
    const v = viewRef.current, s = sizeRef.current;
    const zoom = Math.max(0.25, Math.min(4, v.zoom * factor));
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || clientX === undefined || clientY === undefined) { setView({ ...v, zoom }); return; }
    const px = clientX - rect.left - s.w / 2, py = clientY - rect.top - s.h / 2;
    const wx = v.cx + px / v.zoom, wy = v.cy + py / v.zoom;
    setView({ cx: wx - px / zoom, cy: wy - py / zoom, zoom });
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey && e.deltaMode === 0 && Math.abs(e.deltaY) >= 40) {
        zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY);
      } else {
        const v = viewRef.current;
        setView({ ...v, cx: v.cx + e.deltaX / v.zoom, cy: v.cy + e.deltaY / v.zoom });
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // ---------- actions ----------
  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout((flash as unknown as { t?: number }).t);
    (flash as unknown as { t?: number }).t = window.setTimeout(() => setToast(null), 1800);
  }, []);

  const connect = useCallback((a: PinSel, b: PinSel) => {
    if (a.side === b.side) return false;
    const o = a.side === 'out' ? a : b, i = a.side === 'in' ? a : b;
    commit(c => {
      if (c.wires.some(w => w.from.c === o.c && w.from.p === o.p && w.to.c === i.c && w.to.p === i.p)) return c;
      const wires = c.wires.filter(w => !(w.to.c === i.c && w.to.p === i.p));
      const nw: Wire = { id: uid(), from: { c: o.c, p: o.p }, to: { c: i.c, p: i.p } };
      return { ...c, wires: [...wires, nw] };
    });
    return true;
  }, [commit]);

  const removeSel = useCallback(() => {
    const s = selRef.current;
    if (!s) return;
    if (s.type === 'comp') commit(c => ({ ...c, comps: c.comps.filter(k => k.id !== s.id), wires: c.wires.filter(w => w.from.c !== s.id && w.to.c !== s.id) }));
    else commit(c => ({ ...c, wires: c.wires.filter(w => w.id !== s.id) }));
    setSel(null);
  }, [commit]);

  const freeSpot = (c: Circuit, kind: Kind, x: number, y: number): [number, number] => {
    const b = boardSize(c);
    for (let r = 0; r < 24; r++) {
      for (const [dx, dy] of [[0, 0], [0, 3], [4, 0], [0, -3], [-4, 0], [4, 3], [-4, -3], [4, -3], [-4, 3]]) {
        const [px, py] = clampPos(kind, Math.round(x + dx * r), Math.round(y + dy * r), b);
        if (!overlaps(c, kind, px, py)) return [px, py];
      }
    }
    return clampPos(kind, Math.round(x), Math.round(y), b);
  };

  const addAt = useCallback((kind: Kind, pos: [number, number] | null) => {
    const s = SPECS[kind];
    let at = pos;
    if (!at) {
      const v = viewRef.current;
      const rect = svgRef.current?.getBoundingClientRect();
      const bp = rect ? boardPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
      const b = boardSize(circRef.current);
      at = freeSpot(circRef.current, kind, (bp?.[0] ?? b.w / 2) - s.w / 2, (bp?.[1] ?? b.h / 2) - s.d / 2);
      void v;
    }
    const comp = newComp(kind, at[0], at[1]);
    commit(c => ({ ...c, comps: [...c.comps, comp] }));
    setSel({ type: 'comp', id: comp.id });
  }, [boardPoint, commit]);

  const loadExample = (id: string) => {
    const ex = EXAMPLES.find(e => e.id === id);
    if (!ex) return;
    const c = ex.make();
    mem.current = {}; lastOut.current = {};
    commit(c);
    setSel(null);
    requestAnimationFrame(() => fitTo(c, pr, sizeRef.current, true));
  };

  const clearAll = () => {
    if (!circ.comps.length) return;
    commit(c => ({ comps: [], wires: [], w: c.w, h: c.h }));
    setSel(null);
    flash('Board limpo · ctrl+z desfaz');
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}#c=${encodeCircuit(circ)}`;
    history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); flash('Link copiado'); } catch { flash('Link no endereço da página'); }
  };

  // ---------- pointer handling ----------
  const onSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const t = e.target as Element;
    const bp = boardPoint(e.clientX, e.clientY);
    const d = dragRef.current;

    const pinEl = t.closest('[data-pin]');
    if (pinEl) {
      const [c, side, p] = pinEl.getAttribute('data-pin')!.split(':');
      const pin: PinSel = { c, side: side as Side, p: +p };
      if (d?.type === 'wire' && d.sticky) {
        if (connect(d.from, pin)) setDrag(null);
        else setDrag({ ...d, from: pin });
        return;
      }
      svgRef.current?.setPointerCapture(e.pointerId);
      setDrag({ type: 'wire', from: pin, cur: bp ?? [0, 0], sx: e.clientX, sy: e.clientY, sticky: false });
      setSel(null);
      return;
    }
    if (d?.type === 'wire' && d.sticky) { setDrag(null); return; }

    const wireEl = t.closest('[data-wire]');
    if (wireEl) {
      const id = wireEl.getAttribute('data-wire')!;
      if (sel?.type === 'wire' && sel.id === id) {
        commit(c => ({ ...c, wires: c.wires.map(w => w.id === id ? { ...w, bend: ((w.bend ?? 0) + 1) % 3 } : w) }));
      }
      setSel({ type: 'wire', id });
      return;
    }

    const compEl = t.closest('[data-comp]');
    if (compEl && bp) {
      const id = compEl.getAttribute('data-comp')!;
      const c = circ.comps.find(k => k.id === id);
      if (!c) return;
      svgRef.current?.setPointerCapture(e.pointerId);
      setSel({ type: 'comp', id });
      if (c.kind === 'button') setPressed(s => new Set(s).add(id));
      setDrag({ type: 'move', id, ox: bp[0] - c.x, oy: bp[1] - c.y, sx: e.clientX, sy: e.clientY, moved: false, overDock: false });
      return;
    }

    setSel(null);
    svgRef.current?.setPointerCapture(e.pointerId);
    setDrag({ type: 'pan', sx: e.clientX, sy: e.clientY, cx: view.cx, cy: view.cy });
  };

  const startNew = (kind: Kind, e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setDrag({ type: 'new', kind, sx: e.clientX, sy: e.clientY, moved: false, pos: null });
  };

  useEffect(() => {
    const overStage = (x: number, y: number) => !!document.elementFromPoint(x, y)?.closest('[data-stage]');
    const overDock = (x: number, y: number) => !!document.elementFromPoint(x, y)?.closest('[data-dock]');

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const far = Math.hypot(e.clientX - ('sx' in d ? d.sx : 0), e.clientY - ('sy' in d ? d.sy : 0)) > 5;
      if (d.type === 'pan') {
        const v = viewRef.current;
        setView({ ...v, cx: d.cx - (e.clientX - d.sx) / v.zoom, cy: d.cy - (e.clientY - d.sy) / v.zoom });
      } else if (d.type === 'move') {
        if (!d.moved && !far) return;
        const bp = boardPoint(e.clientX, e.clientY);
        if (!bp) return;
        const c = circRef.current.comps.find(k => k.id === d.id);
        if (!c) return;
        if (!d.moved) {
          past.current.push(circRef.current); future.current = [];
          if (c.kind === 'button') setPressed(s => { const n = new Set(s); n.delete(c.id); return n; });
        }
        const [nx, ny] = clampPos(c.kind, Math.round(bp[0] - d.ox), Math.round(bp[1] - d.oy), boardSize(circRef.current));
        const od = overDock(e.clientX, e.clientY);
        if (nx !== c.x || ny !== c.y) {
          setCircRaw(cur => ({ ...cur, comps: cur.comps.map(k => k.id === d.id ? { ...k, x: nx, y: ny } : k) }));
        }
        if (!d.moved || od !== d.overDock) setDrag({ ...d, moved: true, overDock: od });
      } else if (d.type === 'wire') {
        const bp = boardPoint(e.clientX, e.clientY);
        if (bp) setDrag({ ...d, cur: bp });
      } else if (d.type === 'new') {
        if (!d.moved && !far) return;
        let pos: [number, number] | null = null;
        if (overStage(e.clientX, e.clientY)) {
          const bp = boardPoint(e.clientX, e.clientY);
          const s = SPECS[d.kind];
          if (bp) pos = clampPos(d.kind, Math.round(bp[0] - s.w / 2), Math.round(bp[1] - s.d / 2), boardSize(circRef.current));
        }
        setDrag({ ...d, moved: true, pos });
      }
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.type === 'pan') { setDrag(null); return; }
      if (d.type === 'move') {
        const c = circRef.current.comps.find(k => k.id === d.id);
        if (c?.kind === 'button') setPressed(s => { const n = new Set(s); n.delete(c.id); return n; });
        if (d.moved && d.overDock) {
          setCircRaw(cur => ({ ...cur, comps: cur.comps.filter(k => k.id !== d.id), wires: cur.wires.filter(w => w.from.c !== d.id && w.to.c !== d.id) }));
          setSel(null);
          bumpHistory(v => v + 1);
          flash('Peça removida');
        } else if (!d.moved && c) {
          if (c.kind === 'switch') commit(cur => ({ ...cur, comps: cur.comps.map(k => k.id === c.id ? { ...k, on: !k.on } : k) }));
          if (c.kind === 'clock') commit(cur => ({ ...cur, comps: cur.comps.map(k => k.id === c.id ? { ...k, hz: CLOCK_HZ[(CLOCK_HZ.indexOf(k.hz ?? 1) + 1) % CLOCK_HZ.length] } : k) }));
          if (c.kind === 'led') commit(cur => ({ ...cur, comps: cur.comps.map(k => k.id === c.id ? { ...k, color: LED_COLORS[(LED_COLORS.indexOf(k.color ?? '') + 1) % LED_COLORS.length] } : k) }));
        } else bumpHistory(v => v + 1);
        setDrag(null);
        return;
      }
      if (d.type === 'wire') {
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-pin]');
        const far = Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 5;
        if (target) {
          const [c, side, p] = target.getAttribute('data-pin')!.split(':');
          const pin: PinSel = { c, side: side as Side, p: +p };
          if (pin.c === d.from.c && pin.side === d.from.side && pin.p === d.from.p) {
            // tapped a pin: keep the wire following the pointer until the next tap
            if (!far) { setDrag({ ...d, sticky: true }); return; }
          } else if (connect(d.from, pin)) { setDrag(null); return; }
        }
        if (!far) { setDrag({ ...d, sticky: true }); return; }
        setDrag(null);
        return;
      }
      if (d.type === 'new') {
        if (!d.moved) addAt(d.kind, null);
        else if (d.pos) {
          const pos = overlaps(circRef.current, d.kind, d.pos[0], d.pos[1]) ? freeSpot(circRef.current, d.kind, d.pos[0], d.pos[1]) : d.pos;
          addAt(d.kind, pos);
        }
        setDrag(null);
      }
    };

    const onCancel = () => {
      const d = dragRef.current;
      if (d && d.type !== 'wire') setDrag(null);
      setPressed(s => (s.size ? new Set() : s));
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('blur', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('blur', onCancel);
    };
  }, [addAt, boardPoint, commit, connect, flash]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selRef.current) { e.preventDefault(); removeSel(); } return; }
      if (e.key === 'Escape') { setDrag(null); setSel(null); return; }
      // letters flip the switches printed with them (A, B, C...)
      if (!mod && !e.altKey && !e.repeat && e.key.length === 1) {
        const i = LETTERS.indexOf(e.key.toLowerCase());
        const sw = circRef.current.comps.filter(c => c.kind === 'switch')[i];
        if (i >= 0 && sw) { e.preventDefault(); commit(cur => ({ ...cur, comps: cur.comps.map(k => k.id === sw.id ? { ...k, on: !k.on } : k) })); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commit, redo, removeSel, undo]);

  // ---------- derived drawing data ----------
  const sorted = useMemo(() => [...circ.comps].sort((a, b) => depth(a) - depth(b)), [circ.comps]);
  // a wire whose level changes replays a pulse along its path (iso-glow "flow")
  const prevOn = useRef<Record<string, boolean>>({});
  const pulseGen = useRef<Record<string, number>>({});
  const wirePaths = useMemo(() => circ.wires.map(w => {
    const on = !!sim.out[w.from.c]?.[w.from.p];
    const was = prevOn.current[w.id];
    if (was !== undefined && was !== on) pulseGen.current[w.id] = (pulseGen.current[w.id] ?? 0) + 1;
    prevOn.current[w.id] = on;
    return { w, d: routeWire(circ, w), on, gen: pulseGen.current[w.id] ?? 0 };
  }), [circ, sim]);
  const leads = useMemo(() => circ.comps.flatMap(c => leadPaths(c, partState(sim, c, pressed))), [circ.comps, sim, pressed]);
  const switches = circ.comps.filter(c => c.kind === 'switch');
  const tagOf = (c: Comp) => {
    if (c.kind !== 'switch') return undefined;
    const i = switches.indexOf(c);
    return i >= 0 && i < LETTERS.length ? LETTERS[i].toUpperCase() : undefined;
  };

  const wiring = drag?.type === 'wire' ? drag : null;
  const ghost = drag?.type === 'new' && drag.pos ? newComp(drag.kind, drag.pos[0], drag.pos[1]) : null;
  const ghostBad = ghost ? overlaps(circ, ghost.kind, ghost.x, ghost.y) : false;
  const movingToDock = drag?.type === 'move' && drag.overDock;

  let tempPath = '';
  if (wiring) {
    const c = circ.comps.find(k => k.id === wiring.from.c);
    if (c) {
      const [ax, ay] = pinPos(c, wiring.from.side, wiring.from.p);
      const [bx, by] = wiring.cur;
      const mx = (ax + bx) / 2;
      tempPath = `M${ax},${ay} H${mx} V${by} H${bx}`;
    }
  }

  // readout
  const ledComps = circ.comps.filter(c => c.kind === 'led');
  const lit = ledComps.filter(c => sim.inp[c.id]?.[0]).length;
  const hexes = circ.comps.filter(c => c.kind === 'seg7').map(c => hexValue(sim.inp[c.id] ?? [0, 0, 0, 0]).toString(16).toUpperCase());
  const anyLit = lit > 0 || circ.comps.some(c => c.kind === 'seg7' && sim.inp[c.id]?.some(Boolean));
  const readout = [
    switches.length ? switches.slice(0, 8).map(c => `${tagOf(c)?.toLowerCase()}${c.on ? 1 : 0}`).join(' ') : null,
    ledComps.length ? `leds ${lit}/${ledComps.length}` : null,
    hexes.length ? `hex ${hexes.join(' ')}` : null,
    !switches.length && !ledComps.length && !hexes.length ? `${circ.comps.length} peças · ${circ.wires.length} fios` : null,
    sim.unstable ? 'oscilando' : null,
    paused ? 'pausado' : null,
  ].filter(Boolean).join(' · ');

  const selComp = sel?.type === 'comp' ? circ.comps.find(c => c.id === sel.id) : null;
  const keysHint = switches.length
    ? `aperte ${switches.slice(0, 4).map(tagOf).join(' · ')}${switches.length > 4 ? ' …' : ''} ou clique nas chaves`
    : 'arraste peças do menu · puxe fios entre os pinos';
  const instruction = wiring?.sticky
    ? 'toque em outro pino para ligar · esc cancela'
    : selComp
      ? hintFor(selComp.kind)
      : sel?.type === 'wire'
        ? 'clique de novo no fio para mudar a dobra · delete apaga'
        : keysHint;

  const bs = boardSize(circ);
  const need = minBoard(circ);
  const TOP0 = pr.TOP(0, 0, 0);
  const BW = bs.w + 3, BD = bs.h + 4; // board (with power rails) around the usable grid

  const setBoard = (w: number, h: number) => {
    commit(c => ({ ...c, w, h }));
    requestAnimationFrame(() => fitTo({ ...circRef.current, w, h }, pr, sizeRef.current, true));
  };

  return (
    <TooltipProvider delayDuration={300}>
      <main className="flex h-dvh gap-3 p-3 sm:p-4">
        <LearnPanel open={learnOpen} onClose={() => setLearnOpen(false)} onAdd={k => addAt(k, null)} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
        <figure className="relative m-0 flex min-h-0 flex-1 flex-col rounded-[22px] border border-edge bg-panel">
          {/* top caption + toolbar */}
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-3 sm:px-6 sm:pt-4">
            <div className="flex items-center gap-3 text-[13px] tracking-[0.14em] text-ink-hi uppercase">
              <span className="inline-block size-1.5 rounded-full" style={{ background: 'var(--glow)', boxShadow: '0 0 8px var(--glow)' }} />
              <span>Board lógica</span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button variant={learnOpen ? 'secondary' : 'ghost'} size="sm" className="text-ink hover:text-ink-hi" onClick={() => setLearnOpen(o => !o)}>
                <GraduationCap />Aprender
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-ink hover:text-ink-hi"><BookOpen />Exemplos</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="font-mono">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-ink">Circuitos prontos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {EXAMPLES.map(ex => (
                    <DropdownMenuItem key={ex.id} onSelect={() => loadExample(ex.id)}>{ex.name}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <Tip label="Tamanho do board">
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-ink hover:text-ink-hi"><Grid3x3 />{bs.w}×{bs.h}</Button>
                  </DropdownMenuTrigger>
                </Tip>
                <DropdownMenuContent align="end" className="font-mono">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-ink">Tamanho do board</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {BOARD_SIZES.map(b => (
                    <DropdownMenuItem key={b.name} disabled={b.w < need.w || b.h < need.h} onSelect={() => setBoard(b.w, b.h)}>
                      <span className="flex-1">{b.name}</span>
                      <span className={cn('text-xs', b.w === bs.w && b.h === bs.h ? 'text-glow' : 'text-ink')}>{b.w}×{b.h}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={e => { e.preventDefault(); setBoard(bs.w + 8, bs.h + 5); }} disabled={bs.w + 8 > 256}>Aumentar +8×5</DropdownMenuItem>
                  <DropdownMenuItem onSelect={e => { e.preventDefault(); setBoard(Math.max(need.w, 16, bs.w - 8), Math.max(need.h, 10, bs.h - 5)); }}
                    disabled={bs.w - 8 < Math.max(need.w, 16) && bs.h - 5 < Math.max(need.h, 10)}>Diminuir −8×5</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ToggleGroup type="single" size="sm" variant="outline" value={iso ? 'iso' : '2d'}
                onValueChange={v => { if (!v) return; const nIso = v === 'iso'; setIso(nIso); requestAnimationFrame(() => fitTo(circRef.current, makeProj(nIso, K), sizeRef.current, true)); }}>
                <ToggleGroupItem value="iso" className="px-2.5 text-xs">3D</ToggleGroupItem>
                <ToggleGroupItem value="2d" className="px-2.5 text-xs">2D</ToggleGroupItem>
              </ToggleGroup>
              <Separator orientation="vertical" className="mx-1 !h-5" />
              <Tip label="Desfazer (ctrl+z)"><Button variant="ghost" size="icon-sm" onClick={undo} disabled={!past.current.length}><Undo2 /></Button></Tip>
              <Tip label="Refazer (ctrl+shift+z)"><Button variant="ghost" size="icon-sm" onClick={redo} disabled={!future.current.length}><Redo2 /></Button></Tip>
              <Tip label={paused ? 'Retomar clocks' : 'Pausar clocks'}><Button variant="ghost" size="icon-sm" onClick={() => setPaused(p => !p)}>{paused ? <Play /> : <Pause />}</Button></Tip>
              <Tip label="Apagar seleção (delete)"><Button variant="ghost" size="icon-sm" onClick={removeSel} disabled={!sel}><Trash2 /></Button></Tip>
              <Tip label="Limpar board"><Button variant="ghost" size="icon-sm" onClick={clearAll} disabled={!circ.comps.length}><Eraser /></Button></Tip>
              <Tip label="Copiar link do circuito"><Button variant="ghost" size="icon-sm" onClick={share}><Link2 /></Button></Tip>
              <Separator orientation="vertical" className="mx-1 !h-5" />
              <div role="radiogroup" aria-label="Cor do brilho" className="flex items-center gap-0.5 rounded-full border border-edge p-0.5">
                {GLOWS.map(g => (
                  <button key={g.id} type="button" role="radio" aria-checked={glow === g.id} aria-label={g.name} title={g.name}
                    onClick={() => setGlow(g.id)}
                    className={cn('grid size-6 place-items-center rounded-full border border-transparent', glow === g.id && 'border-line')}
                    style={glow === g.id ? { borderColor: 'var(--line)' } : undefined}>
                    <i className="block size-2.5 rounded-full border transition-transform hover:scale-110"
                      style={{ background: g.c, borderColor: 'var(--line)', boxShadow: glow === g.id ? `0 0 10px 1px ${g.c}` : undefined }} />
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* the board */}
          <div ref={stageRef} data-stage className={cn('stage-glow relative min-h-0 flex-1 overflow-hidden', anyLit && 'on')}>
            <svg ref={svgRef} className="board-svg absolute inset-0 h-full w-full outline-none" viewBox={viewBox}
              role="img" tabIndex={0}
              aria-label="Board lógica: arraste peças do menu para o board, puxe fios de um pino de saída para um de entrada e clique nas chaves para ligar."
              onPointerDown={onSvgPointerDown}
              style={{ cursor: drag?.type === 'pan' ? 'grabbing' : wiring ? 'crosshair' : 'default' }}>
              <defs>
                <pattern id="holes" width={0.5} height={0.5} patternUnits="userSpaceOnUse" patternTransform="translate(-0.25 -0.25)">
                  <rect className="hole" x={0.19} y={0.19} width={0.12} height={0.12} />
                </pattern>
                <filter id="glow" filterUnits="userSpaceOnUse" x="-20000" y="-20000" width="60000" height="60000">
                  <feGaussianBlur stdDeviation="4" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="soft" filterUnits="userSpaceOnUse" x="-20000" y="-20000" width="60000" height="60000">
                  <feGaussianBlur stdDeviation="2.2" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {/* the same glows for shapes drawn inside a board-plane (cell unit) transform */}
                <filter id="soft-p" filterUnits="userSpaceOnUse" x="-1000" y="-1000" width="3000" height="3000">
                  <feGaussianBlur stdDeviation="0.1" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="bloom-p" filterUnits="userSpaceOnUse" x="-1000" y="-1000" width="3000" height="3000">
                  <feGaussianBlur stdDeviation="0.45" />
                </filter>
              </defs>

              {/* plate: the base the breadboard is screwed to */}
              <Box pr={pr} x={-2.6} y={-2.6} z={-0.95} w={bs.w + 5.2} d={bs.h + 6.2} h={0.45} r={1.1} cls="plate" />
              <g transform={pr.TOP(-2.6, -2.6, -0.5)}>
                <rect className="detail" x={0.3} y={0.3} width={bs.w + 4.6} height={bs.h + 5.6} rx={0.8} />
                {[[0.55, 0.55], [bs.w + 4.65, 0.55], [0.55, bs.h + 5.65], [bs.w + 4.65, bs.h + 5.65]].map(([x, y], i) => (
                  <g key={i}>
                    <circle className="face recess" cx={x} cy={y} r={0.17} />
                    <line className="detail" x1={x - 0.1} y1={y} x2={x + 0.1} y2={y} />
                  </g>
                ))}
                <text className="board-label" x={bs.w + 4.1} y={bs.h + 5.95} textAnchor="end" style={{ fontSize: 0.32, letterSpacing: 0.06 }}>
                  BOARD LÓGICA · {bs.w}×{bs.h}
                </text>
              </g>

              {/* breadboard with power rails */}
              <Box pr={pr} x={-1.5} y={-2} z={-0.5} w={BW} d={BD} h={0.5} r={0.35} />
              {pr.iso && (
                <g transform={pr.FRONT(-1.5, bs.h + 2, 0)}>
                  {Array.from({ length: Math.max(0, Math.floor((BW - 2) / 0.5)) }, (_, i) => (
                    <line key={i} className="detail" x1={1 + i * 0.5} y1={0.14} x2={1 + i * 0.5} y2={0.36} />
                  ))}
                </g>
              )}
              <g transform={pr.TOP(-1.5, -2, 0)}>
                <rect className="detail" x={0.2} y={0.2} width={BW - 0.4} height={BD - 0.4} rx={0.22} />
                {[0.45, BD - 1.45].map((ry, i) => (
                  <g key={i}>
                    <line className="detail" x1={0.7} y1={ry} x2={BW - 0.7} y2={ry} />
                    <line className="detail" x1={0.7} y1={ry + 1} x2={BW - 0.7} y2={ry + 1} />
                    <text className="board-label" x={0.3} y={ry + 0.66} style={{ fontSize: 0.42 }}>{i ? '−' : '+'}</text>
                    <text className="board-label" x={BW - 0.62} y={ry + 0.66} style={{ fontSize: 0.42 }}>{i ? '−' : '+'}</text>
                  </g>
                ))}
              </g>
              <g ref={boardRef} transform={TOP0}>
                <rect x={0.8 - 1.5} y={-1.55 + 0.25} width={BW - 1.6} height={0.5} fill="url(#holes)" />
                <rect x={0.8 - 1.5} y={bs.h + 1.05 - 0.25} width={BW - 1.6} height={0.5} fill="url(#holes)" />
                <rect x={-1.25} y={-0.25} width={bs.w + 2.5} height={bs.h + 0.5} fill="url(#holes)" />
              </g>

              {/* wires: cold ones flat, live ones with the soft glow */}
              <g transform={TOP0}>
                {leads.filter(l => !l.on).map(l => <path key={l.key} className="wire" d={l.d} />)}
                {wirePaths.filter(p => !p.on).map(({ w, d }) => (
                  <g key={w.id}><path className="wire-under" d={d} /><path className="wire" d={d} /></g>
                ))}
              </g>
              <g filter="url(#soft)">
                <g transform={TOP0}>
                  {leads.filter(l => l.on).map(l => <path key={l.key} className="wire hot" d={l.d} />)}
                  {wirePaths.filter(p => p.on).map(({ w, d }) => (
                    <g key={w.id}><path className="wire-under" d={d} /><path className="wire hot" d={d} /></g>
                  ))}
                </g>
              </g>
              <g transform={TOP0}>
                {wirePaths.map(({ w, d, gen }) => gen > 0 && <path key={`${w.id}:${gen}`} className="pulse" pathLength={1000} d={d} />)}
                {wirePaths.map(({ w, d }) => (
                  <g key={w.id} data-wire={w.id}>
                    {sel?.type === 'wire' && sel.id === w.id && <path className="wire sel" d={d} />}
                    <path className="wire-hit" d={d} />
                  </g>
                ))}
                {circ.comps.map(c => <Pads key={c.id} c={c} st={partState(sim, c, pressed)} />)}
                {tempPath && <path className="wire-temp" d={tempPath} />}
              </g>

              {/* parts, back to front */}
              {sorted.map(c => (
                <g key={c.id} data-comp={c.id}
                  className={cn('part', (c.kind === 'switch' || c.kind === 'button') && 'press', sel?.type === 'comp' && sel.id === c.id && 'sel')}
                  style={movingToDock && drag.id === c.id ? { opacity: 0.35 } : undefined}>
                  <Part pr={pr} c={c} st={partState(sim, c, pressed)} tag={tagOf(c)} />
                </g>
              ))}
              {ghost && (
                <g className={cn('part ghost', ghostBad && 'bad')}>
                  <g transform={TOP0}>
                    {leadPaths(ghost, { ins: [], outs: [] }).map(l => <path key={l.key} className="wire" d={l.d} />)}
                    <Pads c={ghost} st={{ ins: [], outs: [] }} />
                  </g>
                  <Part pr={pr} c={ghost} st={{ ins: [], outs: [] }} />
                </g>
              )}

              {/* pin hotspots on top so they stay reachable */}
              <g transform={TOP0}>
                {circ.comps.flatMap(c => {
                  const s = SPECS[c.kind];
                  const mk = (side: Side, i: number) => {
                    const [px, py] = pinPos(c, side, i);
                    const isSrc = wiring && wiring.from.c === c.id && wiring.from.side === side && wiring.from.p === i;
                    const cand = wiring && !isSrc && wiring.from.side !== side;
                    return (
                      <circle key={`${c.id}${side}${i}`} data-pin={`${c.id}:${side}:${i}`}
                        className={cn('hot-pin', cand && 'cand', isSrc && 'src')} cx={px} cy={py} r={0.42}>
                        <title>{pinTitle(c.kind, side, i)}</title>
                      </circle>
                    );
                  };
                  return [...s.ins.map((_, i) => mk('in', i)), ...s.outs.map((_, i) => mk('out', i))];
                })}
              </g>
            </svg>

            {!circ.comps.length && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-[13px] tracking-[0.12em] text-ink uppercase">
                arraste uma peça do menu para o board
              </div>
            )}
            {drag?.type === 'move' && drag.moved && (
              <div className={cn('pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md border px-3 py-1.5 text-xs',
                movingToDock ? 'border-destructive bg-destructive text-white' : 'border-edge bg-background/90 text-ink')}>
                {movingToDock ? 'solte para remover' : 'solte no menu de peças para remover'}
              </div>
            )}
            {toast && (
              <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-md border border-edge bg-background/90 px-3 py-1.5 text-xs text-ink-hi">
                {toast}
              </div>
            )}
            <div className="absolute right-3 bottom-3 flex flex-col gap-1 rounded-lg border border-edge bg-panel/90 p-1">
              <Tip label="Aproximar" side="left"><Button variant="ghost" size="icon-sm" onClick={() => zoomAt(1.25)}><ZoomIn /></Button></Tip>
              <Tip label="Afastar" side="left"><Button variant="ghost" size="icon-sm" onClick={() => zoomAt(0.8)}><ZoomOut /></Button></Tip>
              <Tip label="Ver o board inteiro" side="left"><Button variant="ghost" size="icon-sm" onClick={() => fitTo(circ, pr, size, true)}><Maximize /></Button></Tip>
            </div>
          </div>

          {/* bottom caption */}
          <footer className="flex flex-wrap justify-between gap-x-6 gap-y-1 px-4 pb-3 text-[12px] tracking-[0.12em] text-ink uppercase sm:px-6 sm:pb-4 sm:text-[13px]">
            <span>{instruction}</span>
            <span className="normal-case tracking-[0.05em] text-ink-hi" aria-live="polite">{readout}</span>
          </footer>
        </figure>

        {/* element dock */}
        <nav data-dock aria-label="Peças"
          className={cn('flex shrink-0 gap-2 overflow-x-auto rounded-[18px] border border-edge bg-panel p-2 transition-colors',
            movingToDock && 'border-destructive bg-destructive/10')}
          style={{ touchAction: 'pan-x' }}>
          {PALETTE.map(k => (
            <button key={k} type="button" onPointerDown={e => startNew(k, e)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addAt(k, null); } }}
              className="group flex w-[86px] shrink-0 cursor-grab flex-col items-center gap-1 rounded-xl border border-transparent px-1 pt-1 pb-1.5 text-[10.5px] tracking-[0.08em] text-ink uppercase transition-colors select-none hover:border-edge hover:bg-accent hover:text-ink-hi active:cursor-grabbing"
              title={`Arraste para o board: ${SPECS[k].name}`}>
              <PartIcon kind={k} />
              <span className="whitespace-nowrap">{SPECS[k].name}</span>
            </button>
          ))}
        </nav>
        </div>
      </main>
    </TooltipProvider>
  );
}

function Tip({ label, children, side = 'bottom' }: { label: string; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="font-mono">{label}</TooltipContent>
    </Tooltip>
  );
}

function hintFor(kind: Kind) {
  switch (kind) {
    case 'switch': return 'clique na chave para ligar e desligar';
    case 'button': return 'segure o botão para enviar 1';
    case 'clock': return 'clique no clock para mudar a frequência';
    case 'led': return 'clique no led para trocar a cor';
    case 'dff': return 'guarda D na subida do clk';
    case 'seg7': return 'mostra em hex os bits 1 2 4 8';
    default: return 'arraste para mover · solte no menu para remover';
  }
}

function pinTitle(kind: Kind, side: Side, i: number) {
  const s = SPECS[kind];
  const names = side === 'in' ? s.inNames : s.outNames;
  return `${side === 'in' ? 'entrada' : 'saída'}${names ? ' ' + names[i] : ''}`;
}


export type { Sel };
