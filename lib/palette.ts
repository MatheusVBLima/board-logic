import type { Kind } from './circuit.ts';

export const PART_GROUPS = ['inputs', 'gates', 'routing', 'arithmetic', 'memory', 'outputs'] as const;
export type PartGroup = typeof PART_GROUPS[number];

export const PART_GROUP: Record<Kind, PartGroup> = {
  switch: 'inputs', button: 'inputs', clock: 'inputs', const: 'inputs',
  not: 'gates', and: 'gates', or: 'gates', xor: 'gates', nand: 'gates', nor: 'gates', xnor: 'gates',
  buffer: 'gates', and3: 'gates', or3: 'gates',
  mux: 'routing', demux: 'routing', halfadder: 'arithmetic', fulladder: 'arithmetic',
  dff: 'memory', led: 'outputs', seg7: 'outputs',
};
