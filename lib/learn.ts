// Texts for the "Aprender" sidebar: what each part is and how it behaves.

import type { Kind } from './circuit.ts';

export interface Lesson {
  kind: Kind;
  group: 'Entradas' | 'Portas lógicas' | 'Memória' | 'Saídas';
  what: string;
  use: string;
  /** truth table: header then rows, all as strings */
  table?: { head: string[]; rows: string[][] };
}

const t2 = (f: (a: number, b: number) => number) => ({
  head: ['A', 'B', 'saída'],
  rows: [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => [a, b, f(a, b)].map(String)),
});

export const LESSONS: Lesson[] = [
  {
    kind: 'switch', group: 'Entradas',
    what: 'Uma chave liga-desliga. Na posição 1 ela manda sinal (1) para o fio; na posição 0, não manda nada (0).',
    use: 'Clique nela ou aperte a letra impressa ao lado (A, B, C...) para mudar de posição. É a forma mais simples de dar entradas ao circuito.',
  },
  {
    kind: 'button', group: 'Entradas',
    what: 'Um botão de pressão. Só manda 1 enquanto está apertado e volta para 0 quando você solta.',
    use: 'Segure o botão com o mouse ou o dedo. Bom para dar pulsos, como um clique de "próximo" num contador.',
  },
  {
    kind: 'clock', group: 'Entradas',
    what: 'Um relógio (clock) alterna sozinho entre 0 e 1 num ritmo fixo. É o "coração" dos circuitos sequenciais.',
    use: 'Clique nele para trocar a frequência (0,5 a 8 Hz). O botão de pausa na barra de cima congela todos os clocks.',
  },
  {
    kind: 'const', group: 'Entradas',
    what: 'Uma fonte que está sempre em 1, como ligar um fio direto no positivo da alimentação.',
    use: 'Use quando uma entrada precisa ficar fixa em 1.',
  },
  {
    kind: 'not', group: 'Portas lógicas',
    what: 'A porta NOT (inversor) troca o sinal: entra 1, sai 0; entra 0, sai 1.',
    use: 'Serve para negar uma condição, por exemplo "acender quando a chave estiver desligada".',
    table: { head: ['A', 'saída'], rows: [['0', '1'], ['1', '0']] },
  },
  {
    kind: 'and', group: 'Portas lógicas',
    what: 'A porta AND (E) só dá 1 quando as duas entradas são 1 ao mesmo tempo.',
    use: 'Pense em "A e B": as duas condições precisam ser verdadeiras. No meio somador ela gera o "vai um".',
    table: t2((a, b) => a & b),
  },
  {
    kind: 'or', group: 'Portas lógicas',
    what: 'A porta OR (OU) dá 1 quando pelo menos uma das entradas é 1.',
    use: 'Pense em "A ou B": basta uma condição ser verdadeira.',
    table: t2((a, b) => a | b),
  },
  {
    kind: 'xor', group: 'Portas lógicas',
    what: 'A porta XOR (OU exclusivo) dá 1 quando as entradas são diferentes entre si.',
    use: 'Detecta diferença. No meio somador ela dá o bit da soma: 1 + 1 = 0 (e vai um).',
    table: t2((a, b) => a ^ b),
  },
  {
    kind: 'nand', group: 'Portas lógicas',
    what: 'A porta NAND (NÃO-E) é uma AND seguida de NOT: só dá 0 quando as duas entradas são 1.',
    use: 'É uma porta "universal": dá para montar qualquer outra porta usando só NANDs.',
    table: t2((a, b) => 1 - (a & b)),
  },
  {
    kind: 'nor', group: 'Portas lógicas',
    what: 'A porta NOR (NÃO-OU) é uma OR seguida de NOT: só dá 1 quando as duas entradas são 0.',
    use: 'Também é universal. Duas NORs ligadas em cruz formam o latch SR, uma memória de 1 bit.',
    table: t2((a, b) => 1 - (a | b)),
  },
  {
    kind: 'xnor', group: 'Portas lógicas',
    what: 'A porta XNOR é uma XOR seguida de NOT: dá 1 quando as entradas são iguais.',
    use: 'Serve como comparador de igualdade de dois bits.',
    table: t2((a, b) => 1 - (a ^ b)),
  },
  {
    kind: 'dff', group: 'Memória',
    what: 'O flip-flop D guarda 1 bit. No instante em que o CLK sobe de 0 para 1, ele copia o valor de D para a saída Q e segura até a próxima subida. Q̄ é sempre o inverso de Q.',
    use: 'Ligue Q̄ de volta em D e ele inverte a cada pulso de clock, dividindo a frequência por 2. Encadeando vários assim você tem um contador (veja o exemplo "Contador 4 bits").',
    table: { head: ['CLK', 'D', 'Q depois'], rows: [['↑', '0', '0'], ['↑', '1', '1'], ['sem subida', 'x', 'mantém']] },
  },
  {
    kind: 'led', group: 'Saídas',
    what: 'Um LED acende quando chega 1 na entrada dele e apaga com 0.',
    use: 'Ligue na saída de uma porta para ver o resultado. Clique no LED para trocar a cor.',
  },
  {
    kind: 'seg7', group: 'Saídas',
    what: 'Um display de 7 segmentos que mostra em hexadecimal (0 a F) o número formado pelas 4 entradas.',
    use: 'As entradas valem 1, 2, 4 e 8. Somando as que estão em 1 você tem o número mostrado: 1 e 4 ligadas mostram 5.',
  },
];
