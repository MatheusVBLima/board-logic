// Challenges: build a circuit whose LEDs match a target truth table. Switches are the
// inputs in board order (A, B, C...), LEDs the outputs (L1, L2...).

import { type Circuit, type Kind, newComp } from './circuit.ts';
import type { Locale } from './i18n/config.ts';
import { evalWith, ledsOf, switchesOf } from './truth.ts';

export interface Challenge {
  id: string;
  level: 1 | 2 | 3;
  inputs: string[];        // names shown for the switches, in order
  outputs: string[];       // names shown for the LEDs, in order
  /** expected LED values for one row of inputs */
  fn: (b: number[]) => number[];
  /** gates allowed besides switches and LEDs; undefined = any part */
  allowed?: Kind[];
  board?: [number, number];
  text: Record<Locale, { title: string; goal: string; hint: string }>;
}

const b = (x: boolean) => (x ? 1 : 0);

const CHALLENGE_DEFINITIONS: Challenge[] = [
  {
    id: 'not-from-nand', level: 1, inputs: ['A'], outputs: ['S'], allowed: ['nand'],
    fn: ([a]) => [1 - a],
    text: {
      en: { title: 'NOT out of NAND', goal: 'Make an inverter: the LED lights when A is off. Only NAND gates allowed.', hint: 'A NAND with both inputs tied to the same signal is a NOT.' },
      pt: { title: 'NOT com NAND', goal: 'Monte um inversor: o LED acende quando A está desligada. Só vale porta NAND.', hint: 'Uma NAND com as duas entradas ligadas no mesmo sinal vira uma NOT.' },
    },
  },
  {
    id: 'and-from-nand', level: 1, inputs: ['A', 'B'], outputs: ['S'], allowed: ['nand'],
    fn: ([a, c]) => [a & c],
    text: {
      en: { title: 'AND out of NAND', goal: 'The LED lights only when A and B are both on. Only NAND gates allowed.', hint: 'NAND is an inverted AND. Invert it again with a second NAND.' },
      pt: { title: 'AND com NAND', goal: 'O LED acende só quando A e B estão ligadas. Só vale porta NAND.', hint: 'A NAND é uma AND invertida. Inverta de novo com uma segunda NAND.' },
    },
  },
  {
    id: 'or-from-nand', level: 2, inputs: ['A', 'B'], outputs: ['S'], allowed: ['nand'],
    fn: ([a, c]) => [a | c],
    text: {
      en: { title: 'OR out of NAND', goal: 'The LED lights when A or B is on. Only NAND gates allowed.', hint: 'De Morgan: A + B = ‾(Ā · B̄). Invert each input, then NAND them.' },
      pt: { title: 'OR com NAND', goal: 'O LED acende quando A ou B está ligada. Só vale porta NAND.', hint: 'De Morgan: A + B = ‾(Ā · B̄). Inverta cada entrada e junte numa NAND.' },
    },
  },
  {
    id: 'xor-basic', level: 2, inputs: ['A', 'B'], outputs: ['S'], allowed: ['and', 'or', 'not'],
    fn: ([a, c]) => [a ^ c],
    text: {
      en: { title: 'XOR from scratch', goal: 'The LED lights when A and B are different. Use only AND, OR and NOT.', hint: 'A ⊕ B = A·B̄ + Ā·B: two ANDs, two NOTs and an OR.' },
      pt: { title: 'XOR do zero', goal: 'O LED acende quando A e B são diferentes. Use só AND, OR e NOT.', hint: 'A ⊕ B = A·B̄ + Ā·B: duas AND, duas NOT e uma OR.' },
    },
  },
  {
    id: 'half-adder', level: 1, inputs: ['A', 'B'], outputs: ['S', 'C'], allowed: ['xor', 'and'],
    fn: ([a, c]) => [a ^ c, a & c],
    text: {
      en: { title: 'Half adder', goal: 'Add A + B. L1 is the sum bit S and L2 is the carry C.', hint: 'Look at the table: S is an XOR and C is an AND.' },
      pt: { title: 'Meio somador', goal: 'Some A + B. L1 é o bit da soma S e L2 é o vai um C.', hint: 'Olhe a tabela: S é uma XOR e C é uma AND.' },
    },
  },
  {
    id: 'majority', level: 2, inputs: ['A', 'B', 'C'], outputs: ['M'],
    fn: ([a, c, d]) => [b(a + c + d >= 2)],
    text: {
      en: { title: 'Majority vote', goal: 'Three judges vote with A, B and C. The LED lights when at least two vote yes.', hint: 'M = A·B + A·C + B·C.' },
      pt: { title: 'Voto da maioria', goal: 'Três jurados votam com A, B e C. O LED acende quando pelo menos dois votam sim.', hint: 'M = A·B + A·C + B·C.' },
    },
  },
  {
    id: 'mux', level: 2, inputs: ['A', 'B', 'S'], outputs: ['Y'], allowed: ['and', 'or', 'not', 'nand', 'nor'],
    fn: ([a, c, s]) => [s ? c : a],
    text: {
      en: { title: '2-to-1 multiplexer', goal: 'Switch C is the selector S. With S off the LED copies A; with S on it copies B. No XOR allowed.', hint: 'Y = A·S̄ + B·S: each AND lets one input through, the OR joins them.' },
      pt: { title: 'Multiplexador 2 para 1', goal: 'A chave C é o seletor S. Com S desligada o LED copia A; com S ligada copia B. Sem XOR.', hint: 'Y = A·S̄ + B·S: cada AND deixa passar uma entrada e a OR junta as duas.' },
    },
  },
  {
    id: 'parity', level: 2, inputs: ['A', 'B', 'C'], outputs: ['P'],
    fn: ([a, c, d]) => [a ^ c ^ d],
    text: {
      en: { title: 'Odd parity', goal: 'The LED lights when an odd number of switches is on (one or three).', hint: 'Chain two XORs: (A ⊕ B) ⊕ C.' },
      pt: { title: 'Paridade ímpar', goal: 'O LED acende quando um número ímpar de chaves está ligado (uma ou três).', hint: 'Encadeie duas XOR: (A ⊕ B) ⊕ C.' },
    },
  },
  {
    id: 'compare-2bit', level: 3, inputs: ['A1', 'A0', 'B1', 'B0'], outputs: ['EQ'], board: [32, 24],
    fn: ([a1, a0, b1, b0]) => [b(a1 === b1 && a0 === b0)],
    text: {
      en: { title: '2-bit comparator', goal: 'A and B are the bits of the first number (A1 A0), C and D of the second (B1 B0). The LED lights when the numbers are equal.', hint: 'An XNOR per pair of bits says "this bit matches". Join the two with an AND.' },
      pt: { title: 'Comparador de 2 bits', goal: 'A e B são os bits do primeiro número (A1 A0), C e D os do segundo (B1 B0). O LED acende quando os números são iguais.', hint: 'Uma XNOR por par de bits diz "este bit bate". Junte as duas numa AND.' },
    },
  },
  {
    id: 'full-adder', level: 3, inputs: ['A', 'B', 'Cin'], outputs: ['S', 'Cout'], board: [40, 24], allowed: ['halfadder', 'xor', 'and', 'or', 'not'],
    fn: ([a, c, d]) => [a ^ c ^ d, b(a + c + d >= 2)],
    text: {
      en: { title: 'Full adder', goal: 'Add A + B + Cin (switch C, the carry coming in). L1 is the sum S and L2 is the carry out.', hint: 'Two half adders: add A + B, then add Cin to that sum. Cout is the OR of the two carries.' },
      pt: { title: 'Somador completo', goal: 'Some A + B + Cin (a chave C, o vai um que chega). L1 é a soma S e L2 é o vai um de saída.', hint: 'Dois meios somadores: some A + B, depois some Cin a esse resultado. Cout é a OR dos dois vai-uns.' },
    },
  },
  {
    id: "safety-interlock",
    level: 1,
    inputs: ["A", "B", "C"],
    outputs: ["Y"],
    allowed: ["and3"],
    board: [32, 20],
    fn: ([a, c, d]) => [a & c & d],
    text: {
      en: {"title": "Safety interlock", "goal": "A is power, B is the closed door and C is permission. Light L1 only when all three are on. Use a three-input AND.", "hint": "Wire each switch to one input of AND · 3."},
      pt: {"title": "Trava de segurança", "goal": "A é a energia, B é a porta fechada e C é a permissão. Acenda L1 só quando as três estiverem ligadas. Use AND de três entradas.", "hint": "Ligue cada chave em uma entrada da AND · 3."},
    },
  },
  {
    id: "alarm-center",
    level: 1,
    inputs: ["A", "B", "C"],
    outputs: ["Y"],
    allowed: ["or3"],
    board: [32, 20],
    fn: ([a, c, d]) => [a | c | d],
    text: {
      en: {"title": "Alarm center", "goal": "A, B and C represent three sensors. Light L1 whenever any sensor is on. Use a three-input OR.", "hint": "With OR · 3, only 000 keeps the alarm off."},
      pt: {"title": "Central de alarme", "goal": "A, B e C representam três sensores. Acenda L1 quando qualquer sensor estiver ligado. Use OR de três entradas.", "hint": "Na OR · 3, só a combinação 000 mantém o alarme desligado."},
    },
  },
  {
    id: "signal-selector",
    level: 1,
    inputs: ["A", "B", "S"],
    outputs: ["Y"],
    allowed: ["mux"],
    board: [32, 20],
    fn: ([a, c, sel]) => [sel ? c : a],
    text: {
      en: {"title": "Signal selector", "goal": "C selects the source: off copies A to L1; on copies B. Use the MUX block.", "hint": "Connect switches A and B to the data pins and C to pin S."},
      pt: {"title": "Seletor de sinal", "goal": "C escolhe a origem: desligada copia A para L1; ligada copia B. Use o bloco MUX.", "hint": "Ligue as chaves A e B nos dados e C no pino S."},
    },
  },
  {
    id: "signal-router",
    level: 1,
    inputs: ["D", "S"],
    outputs: ["Y0", "Y1"],
    allowed: ["demux"],
    board: [32, 20],
    fn: ([d, sel]) => [sel ? 0 : d, sel ? d : 0],
    text: {
      en: {"title": "One signal, two paths", "goal": "A carries data D. B selects the LED: off sends D to L1, on sends D to L2. The other LED stays off.", "hint": "Use DEMUX: A goes to D, B to S, Y0 to L1 and Y1 to L2."},
      pt: {"title": "Um sinal, dois caminhos", "goal": "A leva o dado D. B escolhe o LED: desligada envia D para L1, ligada envia D para L2. O outro LED fica apagado.", "hint": "Use DEMUX: A vai em D, B em S, Y0 em L1 e Y1 em L2."},
    },
  },
  {
    id: "controlled-inverter",
    level: 2,
    inputs: ["A", "INV"],
    outputs: ["Y"],
    allowed: ["mux", "not"],
    board: [32, 20],
    fn: ([a, inv]) => [a ^ inv],
    text: {
      en: {"title": "Controlled inverter", "goal": "L1 copies A while B is off and inverts A while B is on. Use MUX and NOT, without XOR.", "hint": "Send A and its inverse to the MUX data pins. Use B as selector."},
      pt: {"title": "Inversor controlado", "goal": "L1 copia A com B desligada e inverte A com B ligada. Use MUX e NOT, sem XOR.", "hint": "Envie A e seu inverso para os dados do MUX. Use B como seletor."},
    },
  },
  {
    id: "half-subtractor",
    level: 2,
    inputs: ["A", "B"],
    outputs: ["D", "Bout"],
    allowed: ["xor", "and", "not"],
    board: [32, 20],
    fn: ([a, c]) => [a ^ c, (a ^ 1) & c],
    text: {
      en: {"title": "Half subtractor", "goal": "Compute A minus B. L1 is the difference bit; L2 lights when borrowing is needed (A = 0 and B = 1).", "hint": "Difference = A XOR B. Borrow = NOT A AND B."},
      pt: {"title": "Meio subtrator", "goal": "Calcule A menos B. L1 é o bit da diferença; L2 acende quando precisa emprestar (A = 0 e B = 1).", "hint": "Diferença = A XOR B. Empréstimo = NOT A AND B."},
    },
  },
  {
    id: "decoder-2bit",
    level: 3,
    inputs: ["A1", "A0"],
    outputs: ["Y0", "Y1", "Y2", "Y3"],
    allowed: ["demux", "const"],
    board: [40, 24],
    fn: ([a1, a0]) => [0, 1, 2, 3].map(n => b(n === ((a1 << 1) | a0))),
    text: {
      en: {"title": "2-to-4 decoder", "goal": "Treat A as the high bit and B as the low bit. Light exactly L1 for 00, L2 for 01, L3 for 10 or L4 for 11. Use DEMUX and Source 1.", "hint": "Split a constant 1 by A, then split each result by B: three DEMUX blocks."},
      pt: {"title": "Decodificador 2 para 4", "goal": "A é o bit mais significativo e B o menos significativo. Acenda só L1 para 00, L2 para 01, L3 para 10 ou L4 para 11. Use DEMUX e Fonte 1.", "hint": "Divida uma constante 1 usando A e depois divida cada resultado usando B: três blocos DEMUX."},
    },
  },
  {
    id: "add-2bit",
    level: 3,
    inputs: ["A1", "A0", "B1", "B0"],
    outputs: ["S0", "S1", "Cout"],
    allowed: ["halfadder", "fulladder"],
    board: [40, 24],
    fn: ([a1, a0, b1, b0]) => { const sum = (a1 * 2 + a0) + (b1 * 2 + b0); return [sum & 1, (sum >> 1) & 1, (sum >> 2) & 1]; },
    text: {
      en: {"title": "Two-bit addition", "goal": "Add the numbers AB and CD (A and C are high bits). L1 is S0, L2 is S1 and L3 is the final carry. Use the adder blocks.", "hint": "Add B and D with a half adder. Feed its carry into a full adder together with A and C."},
      pt: {"title": "Soma de dois bits", "goal": "Some os números AB e CD (A e C são os bits mais significativos). L1 é S0, L2 é S1 e L3 é o vai um final. Use os blocos somadores.", "hint": "Some B e D com um meio somador. Envie o vai um para um somador completo junto com A e C."},
    },
  },
];

export const CHALLENGES = [...CHALLENGE_DEFINITIONS].sort((a, b) => a.level - b.level);

export const challengeById = (id: string | null | undefined) => CHALLENGES.find(c => c.id === id);

/** Starting board: the switches on the left, the LEDs on the right. */
export function starterCircuit(ch: Challenge): Circuit {
  const [w, h] = ch.board ?? [32, 20];
  const gap = (n: number) => Math.min(4, Math.floor((h - 2) / n));
  const top = (n: number) => Math.max(1, Math.round((h - gap(n) * (n - 1) - 2) / 2));
  const comps = [
    ...ch.inputs.map((_, i) => ({ ...newComp('switch', 2, top(ch.inputs.length) + i * gap(ch.inputs.length)), id: `in${i}` })),
    ...ch.outputs.map((_, i) => ({ ...newComp('led', w - 4, top(ch.outputs.length) + i * gap(ch.outputs.length)), id: `out${i}` })),
  ];
  return { comps, wires: [], w, h };
}

export type ChallengeIssue =
  | { type: 'switches'; n: number }
  | { type: 'leds'; n: number }
  | { type: 'forbidden'; kinds: Kind[] }
  | { type: 'unstable' };

export interface ChallengeRow { ins: number[]; expected: number[]; got: number[]; ok: boolean }
export interface ChallengeResult { ok: boolean; issues: ChallengeIssue[]; rows: ChallengeRow[] }

export function checkChallenge(ch: Challenge, c: Circuit): ChallengeResult {
  const issues: ChallengeIssue[] = [];
  const sw = switchesOf(c), leds = ledsOf(c);
  if (sw.length !== ch.inputs.length) issues.push({ type: 'switches', n: ch.inputs.length });
  if (leds.length !== ch.outputs.length) issues.push({ type: 'leds', n: ch.outputs.length });
  if (ch.allowed) {
    const ok = new Set<Kind>(['switch', 'led', ...ch.allowed]);
    const bad = [...new Set(c.comps.map(k => k.kind).filter(k => !ok.has(k)))];
    if (bad.length) issues.push({ type: 'forbidden', kinds: bad });
  }
  if (issues.length) return { ok: false, issues, rows: [] };
  const n = ch.inputs.length;
  const rows: ChallengeRow[] = [];
  let unstable = false;
  for (let m = 0; m < 1 << n; m++) {
    const ins = Array.from({ length: n }, (_, j) => (m >> (n - 1 - j)) & 1);
    const r = evalWith(c, sw, ins);
    if (r.unstable) unstable = true;
    const got = leds.map(l => r.inp[l.id]?.[0] ?? 0);
    const expected = ch.fn(ins);
    rows.push({ ins, expected, got, ok: !r.unstable && expected.every((v, i) => v === got[i]) });
  }
  if (unstable) issues.push({ type: 'unstable' });
  return { ok: !unstable && rows.every(r => r.ok), issues, rows };
}

// ---------- progress (kept in this browser) ----------

const DONE_KEY = 'board-logica:challenges';
export function solvedChallenges(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]')); } catch { return new Set(); }
}
export function markSolved(id: string) {
  try { const s = solvedChallenges(); s.add(id); localStorage.setItem(DONE_KEY, JSON.stringify([...s])); } catch { /* ignore */ }
}
