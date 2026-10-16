import { newComp, type Circuit, type Comp, type Kind, type Wire } from './circuit.ts';

function build(parts: [string, Kind, number, number, Partial<Comp>?][], links: [string, number, string, number, number?][]): Circuit {
  const ids: Record<string, string> = {};
  const comps = parts.map(([key, kind, x, y, extra]) => {
    const c = { ...newComp(kind, x, y), ...extra, id: key };  // stable ids keep SSR and client in sync
    ids[key] = c.id;
    return c;
  });
  const wires: Wire[] = links.map(([a, p, b, q, bend], i) => ({
    id: `w${i}`, from: { c: ids[a], p }, to: { c: ids[b], p: q }, ...(bend ? { bend } : {}),
  }));
  return { comps, wires };
}

export const EXAMPLES: { id: string; name: string; make: () => Circuit }[] = [
  {
    id: 'half-adder', name: 'Meio somador',
    make: () => build(
      [
        ['a', 'switch', 4, 5], ['b', 'switch', 4, 11],
        ['xor', 'xor', 11, 6], ['and', 'and', 11, 11],
        ['s', 'led', 18, 6, { color: '#ffb547' }], ['c', 'led', 18, 11, { color: '#ff5a4f' }],
      ],
      [['a', 0, 'xor', 0], ['a', 0, 'and', 0], ['b', 0, 'xor', 1], ['b', 0, 'and', 1], ['xor', 0, 's', 0], ['and', 0, 'c', 0]],
    ),
  },
  {
    id: 'gates', name: 'Todas as portas',
    make: () => {
      const gates: Kind[] = ['and', 'or', 'xor', 'nand', 'nor', 'xnor'];
      const parts: [string, Kind, number, number, Partial<Comp>?][] = [['a', 'switch', 3, 8], ['b', 'switch', 3, 14]];
      const links: [string, number, string, number, number?][] = [];
      gates.forEach((g, i) => {
        parts.push([g, g, 12, 3 + i * 4], [g + 'L', 'led', 19, 3 + i * 4, { color: '#5dff9a' }]);
        links.push(['a', 0, g, 0, 1], ['b', 0, g, 1, 2], [g, 0, g + 'L', 0]);
      });
      return build(parts, links);
    },
  },
  {
    id: 'sr-latch', name: 'Latch SR (memória)',
    make: () => build(
      [
        ['s', 'switch', 3, 4], ['r', 'switch', 3, 12],
        ['n1', 'nor', 10, 5], ['n2', 'nor', 10, 11],
        ['qn', 'led', 18, 5, { color: '#ff5a4f' }], ['q', 'led', 18, 11, { color: '#4fb4ff' }],
      ],
      [['r', 0, 'n2', 1], ['s', 0, 'n1', 0], ['n1', 0, 'n2', 0], ['n2', 0, 'n1', 1], ['n1', 0, 'qn', 0], ['n2', 0, 'q', 0]],
    ),
  },
  {
    id: 'counter', name: 'Contador 4 bits',
    make: () => build(
      [
        ['clk', 'clock', 1, 4, { hz: 2 }],
        ['f0', 'dff', 8, 3], ['f1', 'dff', 15, 3], ['f2', 'dff', 22, 3], ['f3', 'dff', 29, 3],
        ['hex', 'seg7', 37, 10],
      ],
      [
        ['clk', 0, 'f0', 1],
        ['f0', 1, 'f0', 0], ['f1', 1, 'f1', 0], ['f2', 1, 'f2', 0], ['f3', 1, 'f3', 0],
        ['f0', 1, 'f1', 1], ['f1', 1, 'f2', 1], ['f2', 1, 'f3', 1],
        ['f0', 0, 'hex', 0, 1], ['f1', 0, 'hex', 1, 1], ['f2', 0, 'hex', 2, 1], ['f3', 0, 'hex', 3, 1],
      ],
    ),
  },
];
