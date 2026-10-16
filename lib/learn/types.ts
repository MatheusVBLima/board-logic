import type { Kind } from '../circuit.ts';

export type Group = 'inputs' | 'gates' | 'routing' | 'arithmetic' | 'memory' | 'outputs';
export const GROUPS: Group[] = ['inputs', 'gates', 'routing', 'arithmetic', 'memory', 'outputs'];

export interface Lesson {
  kind: Kind;
  group: Group;
  /** one line for the sidebar */
  summary: string;
  /** Boolean expression of the output, when it has one */
  expr?: string;
  /** truth table: header then rows, all as strings */
  table?: { head: string[]; rows: string[][] };
  /** full guide: titled blocks of paragraphs */
  guide: { title: string; body: string[] }[];
}

/** General topics shown before the parts on the guide page. */
export interface Basic { id: string; title: string; body: string[] }

export interface LearnContent {
  groupNames: Record<Group, string>;
  lessons: Lesson[];
  basics: Basic[];
}
