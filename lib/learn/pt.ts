// Textos de ensino em português: um resumo por peça para o painel "Aprender" e o
// guia completo da página /pt/learn.

import type { Basic, Lesson, LearnContent } from './types.ts';

const t2 = (f: (a: number, b: number) => number) => ({
  head: ['A', 'B', 'saída'],
  rows: [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => [a, b, f(a, b)].map(String)),
});

const GROUP_NAMES = { inputs: 'Entradas', gates: 'Portas lógicas', memory: 'Memória', outputs: 'Saídas' };

const LESSONS: Lesson[] = [
  {
    kind: 'switch', group: 'inputs',
    summary: 'Liga e desliga: na posição 1 manda sinal, na 0 não manda.',
    guide: [
      { title: 'O que é', body: [
        'A chave (ou interruptor deslizante) é a entrada mais simples de um circuito digital. Ela tem duas posições fixas: 0, desligada, e 1, ligada. Ela fica na posição em que você deixou até alguém mexer de novo.',
        'Num circuito real, a chave liga a saída ao positivo da alimentação (1, nível alto) ou ao negativo (0, nível baixo). Em eletrônica digital de 5 V, "1" costuma ser algo perto de 5 V e "0" algo perto de 0 V.',
      ] },
      { title: 'Como usar no board', body: [
        'Clique na chave para mudar de posição. Cada chave recebe uma letra (A, B, C...) impressa ao lado, e você também pode apertar essa letra no teclado.',
        'A saída fica à direita da peça. Puxe um fio dela até a entrada de uma porta para usar o valor da chave no circuito.',
      ] },
      { title: 'Para que serve', body: [
        'Use chaves para dar as entradas de uma tabela-verdade: com duas chaves você testa as quatro combinações (00, 01, 10, 11) de qualquer porta de duas entradas.',
      ] },
    ],
  },
  {
    kind: 'button', group: 'inputs',
    summary: 'Manda 1 só enquanto está apertado.',
    guide: [
      { title: 'O que é', body: [
        'O botão de pressão (push button) é uma entrada momentânea. Ele vale 1 apenas enquanto está pressionado e volta sozinho para 0 quando você solta.',
        'A diferença para a chave é a memória mecânica: a chave fica onde você deixou, o botão sempre volta.',
      ] },
      { title: 'Como usar no board', body: [
        'Segure o botão com o mouse ou o dedo. Enquanto ele estiver para baixo, a saída fica acesa.',
      ] },
      { title: 'Para que serve', body: [
        'Botões são bons para gerar pulsos: avançar um contador um passo de cada vez, dar "reset" num latch ou simular uma campainha.',
        'Em circuitos reais, botões "trepidam" (bounce): o contato abre e fecha várias vezes em poucos milissegundos. No simulador o sinal é limpo, mas vale saber que na bancada é preciso tratar isso.',
      ] },
    ],
  },
  {
    kind: 'clock', group: 'inputs',
    summary: 'Alterna sozinho entre 0 e 1 num ritmo fixo.',
    guide: [
      { title: 'O que é', body: [
        'O clock é um oscilador: ele troca entre 0 e 1 sozinho, sem parar, sempre no mesmo ritmo. Esse ritmo é a frequência, medida em hertz (Hz). 1 Hz significa um ciclo completo (0 e depois 1) por segundo.',
        'O momento em que o sinal passa de 0 para 1 é chamado de borda de subida. É nele que circuitos sequenciais, como o flip-flop D, fazem alguma coisa.',
      ] },
      { title: 'Como usar no board', body: [
        'Clique no clock para trocar a frequência entre 0,5, 1, 2, 4 e 8 Hz. O LED pequeno em cima dele mostra o nível atual.',
        'O botão de pausa na barra de cima congela todos os clocks, para você examinar o circuito com calma.',
      ] },
      { title: 'Para que serve', body: [
        'É o "coração" de qualquer circuito sequencial: contadores, registradores, processadores. Um computador moderno tem um clock de bilhões de hertz (GHz).',
      ] },
    ],
  },
  {
    kind: 'const', group: 'inputs',
    summary: 'Sempre em 1, como um fio ligado no positivo.',
    guide: [
      { title: 'O que é', body: [
        'A fonte 1 é uma constante: a saída dela é sempre 1. É o equivalente a ligar um fio direto no positivo da alimentação (VCC).',
      ] },
      { title: 'Para que serve', body: [
        'Use quando uma entrada precisa ficar fixa em 1, por exemplo para habilitar uma porta permanentemente, ou ligando uma das entradas de uma XOR em 1 para transformá-la num inversor.',
      ] },
    ],
  },
  {
    kind: 'not', group: 'gates',
    summary: 'Inverte o sinal: entra 1, sai 0; entra 0, sai 1.',
    expr: 'S = Ā  (lê-se "não A")',
    table: { head: ['A', 'saída'], rows: [['0', '1'], ['1', '0']] },
    guide: [
      { title: 'O que é', body: [
        'A porta NOT, também chamada de inversor, tem uma entrada e uma saída. A saída é sempre o contrário da entrada.',
        'No símbolo tradicional ela é um triângulo com uma bolinha na ponta. A bolinha é o sinal de inversão e aparece também nas portas NAND, NOR e XNOR.',
      ] },
      { title: 'No mundo real', body: [
        'O chip 74·04 tem seis inversores independentes num único encapsulamento de 14 pinos.',
      ] },
      { title: 'Para que serve', body: [
        'Negar uma condição: "acender o LED quando a chave estiver desligada". Também é peça básica de osciladores: um número ímpar de inversores ligados em anel nunca se estabiliza. Se você ligar a saída de uma NOT na própria entrada, o simulador avisa que o circuito está oscilando.',
      ] },
    ],
  },
  {
    kind: 'and', group: 'gates',
    summary: 'Só dá 1 quando as duas entradas são 1.',
    expr: 'S = A · B  (lê-se "A e B")',
    table: t2((a, b) => a & b),
    guide: [
      { title: 'O que é', body: [
        'A porta AND (E) dá 1 apenas quando todas as entradas são 1. Basta uma entrada em 0 para a saída ser 0.',
        'Pense em duas chaves em série num fio: a luz só acende se as duas estiverem fechadas.',
      ] },
      { title: 'Álgebra de Boole', body: [
        'A operação AND é escrita como uma multiplicação: A · B. E funciona como multiplicação mesmo: 1·1 = 1 e qualquer coisa vezes 0 dá 0.',
      ] },
      { title: 'No mundo real', body: [
        'O chip 74·08 traz quatro portas AND de duas entradas.',
      ] },
      { title: 'Para que serve', body: [
        'Exigir que várias condições sejam verdadeiras ao mesmo tempo, e "deixar passar" um sinal só quando um controle está em 1 (a outra entrada funciona como um portão). No meio somador, a AND calcula o "vai um" (carry): 1 + 1 gera vai um.',
      ] },
    ],
  },
  {
    kind: 'or', group: 'gates',
    summary: 'Dá 1 quando pelo menos uma entrada é 1.',
    expr: 'S = A + B  (lê-se "A ou B")',
    table: t2((a, b) => a | b),
    guide: [
      { title: 'O que é', body: [
        'A porta OR (OU) dá 1 quando pelo menos uma das entradas é 1. Só dá 0 quando todas estão em 0.',
        'Pense em duas chaves em paralelo: qualquer uma fechada já acende a luz.',
      ] },
      { title: 'Álgebra de Boole', body: [
        'A operação OR é escrita como soma: A + B. Mas cuidado: na lógica, 1 + 1 = 1, porque não existe "2", só verdadeiro ou falso.',
      ] },
      { title: 'No mundo real', body: [
        'O chip 74·32 traz quatro portas OR de duas entradas.',
      ] },
      { title: 'Para que serve', body: [
        'Juntar alarmes: "se a porta OU a janela abrir, toque a sirene". Também é usada para combinar vários sinais num só.',
      ] },
    ],
  },
  {
    kind: 'xor', group: 'gates',
    summary: 'Dá 1 quando as entradas são diferentes.',
    expr: 'S = A ⊕ B = A·B̄ + Ā·B',
    table: t2((a, b) => a ^ b),
    guide: [
      { title: 'O que é', body: [
        'A porta XOR (OU exclusivo) dá 1 quando exatamente uma das entradas é 1, ou seja, quando as entradas são diferentes. Se as duas forem iguais, a saída é 0.',
      ] },
      { title: 'Propriedades úteis', body: [
        'A ⊕ 0 = A: com uma entrada em 0, a XOR deixa o sinal passar igual.',
        'A ⊕ 1 = Ā: com uma entrada em 1, ela vira um inversor controlável.',
        'A ⊕ A = 0, e fazer XOR duas vezes com o mesmo valor desfaz a operação. Isso é a base de muitas cifras e de paridade.',
      ] },
      { title: 'No mundo real', body: [
        'O chip 74·86 traz quatro portas XOR.',
      ] },
      { title: 'Para que serve', body: [
        'Somar bits: no meio somador, a XOR dá o bit da soma (1 + 1 = 0, e vai um). Também detecta diferenças, calcula paridade para detectar erros de transmissão e faz o "pisca-pisca" de inverter um sinal sob controle.',
      ] },
    ],
  },
  {
    kind: 'nand', group: 'gates',
    summary: 'É uma AND invertida: só dá 0 quando as duas são 1.',
    expr: 'S = ‾(A · B)',
    table: t2((a, b) => 1 - (a & b)),
    guide: [
      { title: 'O que é', body: [
        'A NAND (NÃO-E) é uma AND seguida de uma NOT. A saída é 0 só quando todas as entradas são 1; em qualquer outro caso, é 1.',
      ] },
      { title: 'A porta universal', body: [
        'Com NANDs dá para montar qualquer outra porta, e portanto qualquer circuito digital:',
        'NOT: ligue as duas entradas da NAND juntas.',
        'AND: uma NAND seguida de uma NOT feita com NAND.',
        'OR: inverta cada entrada com uma NAND e junte numa terceira NAND (teorema de De Morgan: A + B = ‾(Ā · B̄)).',
        'Por ser barata de fabricar com transistores, a NAND é a base de muita memória flash (a "NAND flash" do seu celular).',
      ] },
      { title: 'No mundo real', body: [
        'O chip 74·00 traz quatro NANDs e foi um dos primeiros chips da família 7400.',
      ] },
    ],
  },
  {
    kind: 'nor', group: 'gates',
    summary: 'É uma OR invertida: só dá 1 quando as duas são 0.',
    expr: 'S = ‾(A + B)',
    table: t2((a, b) => 1 - (a | b)),
    guide: [
      { title: 'O que é', body: [
        'A NOR (NÃO-OU) é uma OR seguida de uma NOT. A saída só é 1 quando todas as entradas são 0.',
      ] },
      { title: 'Também é universal', body: [
        'Assim como a NAND, a NOR sozinha consegue montar qualquer circuito. O computador de bordo da Apollo, que levou o homem à Lua, foi construído inteiro com portas NOR.',
      ] },
      { title: 'Memória com duas NORs', body: [
        'Ligando a saída de uma NOR na entrada da outra, e vice-versa, você cria um latch SR: uma memória de 1 bit. Ligar S grava 1, ligar R apaga, e com as duas desligadas o circuito lembra o último valor. Carregue o exemplo "Latch SR" para ver.',
      ] },
      { title: 'No mundo real', body: [
        'O chip 74·02 traz quatro NORs de duas entradas.',
      ] },
    ],
  },
  {
    kind: 'xnor', group: 'gates',
    summary: 'Dá 1 quando as entradas são iguais.',
    expr: 'S = ‾(A ⊕ B)',
    table: t2((a, b) => 1 - (a ^ b)),
    guide: [
      { title: 'O que é', body: [
        'A XNOR é uma XOR invertida: dá 1 quando as entradas são iguais (00 ou 11) e 0 quando são diferentes. Por isso também é chamada de porta de equivalência.',
      ] },
      { title: 'Para que serve', body: [
        'Comparar números: para saber se dois números de 4 bits são iguais, use uma XNOR por par de bits e junte as quatro saídas numa AND. A AND só acende se todos os bits baterem.',
      ] },
      { title: 'No mundo real', body: [
        'O chip 74·266 traz quatro XNORs.',
      ] },
    ],
  },
  {
    kind: 'dff', group: 'memory',
    summary: 'Guarda 1 bit: copia D para Q quando o clock sobe.',
    expr: 'Q ← D  na borda de subida do CLK',
    table: { head: ['CLK', 'D', 'Q depois'], rows: [['↑', '0', '0'], ['↑', '1', '1'], ['sem subida', 'x', 'mantém']] },
    guide: [
      { title: 'O que é', body: [
        'O flip-flop D é uma memória de 1 bit. Ele tem duas entradas, D (dado) e CLK (clock), e duas saídas, Q e Q̄ (o inverso de Q).',
        'No instante em que o CLK passa de 0 para 1 (borda de subida), o flip-flop copia o valor de D para Q. No resto do tempo, Q fica parado, não importa o que aconteça em D.',
      ] },
      { title: 'Por que isso importa', body: [
        'Portas lógicas sozinhas são combinacionais: a saída depende só das entradas daquele instante. Com flip-flops o circuito passa a ter estado, isto é, lembra o passado. É isso que permite contar, guardar números e executar programas passo a passo.',
      ] },
      { title: 'Divisor por 2 e contador', body: [
        'Ligue Q̄ de volta em D. A cada subida do clock, o flip-flop grava o contrário do que tinha, então Q inverte a cada pulso. O resultado é um sinal com metade da frequência do clock.',
        'Encadeando vários assim, com o Q̄ de um servindo de clock para o próximo, você tem um contador binário. Carregue o exemplo "Contador 4 bits": o display mostra 0, 1, 2... até F e recomeça.',
      ] },
      { title: 'No mundo real', body: [
        'O chip 74·74 traz dois flip-flops D, com entradas extras de preset e clear para forçar Q em 1 ou 0.',
      ] },
    ],
  },
  {
    kind: 'led', group: 'outputs',
    summary: 'Acende quando chega 1 na entrada.',
    guide: [
      { title: 'O que é', body: [
        'O LED (diodo emissor de luz) é a saída mais simples: acende com 1 e apaga com 0. É o jeito de "ver" o valor de um fio.',
      ] },
      { title: 'Como usar no board', body: [
        'Ligue a saída de uma porta na entrada do LED (à esquerda dele). Clique no LED para trocar a cor. A primeira opção acompanha a cor do brilho escolhida na barra de cima.',
      ] },
      { title: 'No mundo real', body: [
        'Um LED de verdade precisa de um resistor em série para limitar a corrente, geralmente entre 220 Ω e 1 kΩ. Sem ele, o LED queima. Ele também tem polaridade: a perna mais longa (ânodo) vai no positivo.',
      ] },
    ],
  },
  {
    kind: 'seg7', group: 'outputs',
    summary: 'Mostra em hexadecimal (0 a F) o número das 4 entradas.',
    table: { head: ['8', '4', '2', '1', 'mostra'], rows: [
      ['0', '0', '0', '0', '0'], ['0', '0', '1', '1', '3'], ['0', '1', '0', '1', '5'],
      ['1', '0', '0', '1', '9'], ['1', '0', '1', '0', 'A'], ['1', '1', '1', '1', 'F'],
    ] },
    guide: [
      { title: 'O que é', body: [
        'O display de 7 segmentos tem sete barrinhas (a até g) que, acesas em combinações diferentes, formam números. Este display já inclui o decodificador: você liga 4 bits e ele mostra o número correspondente em hexadecimal.',
      ] },
      { title: 'Binário para hexadecimal', body: [
        'As 4 entradas valem 1, 2, 4 e 8. O número mostrado é a soma das entradas que estão em 1. Exemplo: entradas 1 e 4 ligadas dão 5.',
        'Com 4 bits dá para contar de 0 a 15. Do 10 em diante o hexadecimal usa letras: A = 10, B = 11, C = 12, D = 13, E = 14 e F = 15.',
      ] },
      { title: 'No mundo real', body: [
        'Displays comuns não decodificam sozinhos: usa-se um chip decodificador como o 74·47 (para BCD), que recebe os 4 bits e acende os segmentos certos.',
      ] },
    ],
  },
];

const BASICS: Basic[] = [
  {
    id: 'sinais', title: 'Sinais digitais: 0 e 1',
    body: [
      'Circuitos digitais trabalham com só dois valores: 0 (desligado, falso, nível baixo) e 1 (ligado, verdadeiro, nível alto). Cada um desses valores é um bit.',
      'No board, um fio aceso está em 1 e um fio apagado está em 0. Quando um sinal muda, um pulso de luz corre pelo fio mostrando o caminho.',
    ],
  },
  {
    id: 'fios', title: 'Entradas, saídas e fios',
    body: [
      'Toda peça tem as entradas do lado esquerdo e as saídas do lado direito. Um fio sempre liga uma saída a uma entrada: arraste de um pino até o outro, ou no celular toque num pino e depois no outro.',
      'Uma saída pode alimentar quantas entradas você quiser, mas cada entrada recebe um único fio. Se você ligar um fio novo numa entrada ocupada, ele substitui o antigo. Uma entrada sem fio vale 0.',
    ],
  },
  {
    id: 'tabela', title: 'Tabela-verdade',
    body: [
      'A tabela-verdade lista todas as combinações de entrada e a saída de cada uma. Uma porta de 2 entradas tem 4 linhas (2²), e uma de 3 entradas tem 8 (2³).',
      'Para testar no board, ponha duas chaves nas entradas e um LED na saída, e passe pelas quatro combinações apertando A e B. Ou abra o painel da tabela-verdade e o board preenche tudo para você.',
    ],
  },
  {
    id: 'boole', title: 'Álgebra de Boole',
    body: [
      'George Boole criou, em 1854, uma álgebra só com verdadeiro e falso. Nela, AND é escrito como multiplicação (A·B), OR como soma (A+B) e NOT com uma barra em cima (Ā).',
      'As leis de De Morgan mostram como trocar uma porta por outra: ‾(A·B) = Ā + B̄ e ‾(A+B) = Ā · B̄. Por isso NAND e NOR conseguem montar todas as outras portas.',
    ],
  },
  {
    id: 'combinacional', title: 'Combinacional e sequencial',
    body: [
      'Circuitos combinacionais, feitos só de portas, respondem na hora: a saída depende apenas das entradas atuais. O meio somador é um exemplo.',
      'Circuitos sequenciais têm memória (latches e flip-flops), então a saída depende também do que aconteceu antes. O contador e o latch SR são exemplos. Normalmente eles andam no ritmo de um clock.',
    ],
  },
  {
    id: 'somador', title: 'Exemplo: meio somador',
    body: [
      'Somar dois bits A e B dá um resultado de 2 bits: a soma (S) e o vai um (C). 0+0 = 00, 0+1 = 01, 1+0 = 01 e 1+1 = 10.',
      'Olhando a tabela, S é exatamente uma XOR e C é exatamente uma AND. Juntando várias dessas peças (somadores completos), um computador soma números de qualquer tamanho. Carregue o exemplo "Meio somador" para testar.',
    ],
  },
];

const content: LearnContent = { groupNames: GROUP_NAMES, lessons: LESSONS, basics: BASICS };
export default content;
