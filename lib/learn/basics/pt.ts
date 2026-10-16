import type { Basic } from '../types.ts';

const basics: Basic[] = [
  {
    id: 'sinais', title: 'Sinais digitais: 0 e 1',
    body: [
      'Um circuito digital representa informações usando dois estados: 0 e 1. Cada valor é um bit. Dependendo do problema, esses estados podem significar falso e verdadeiro, porta aberta e fechada ou ausência e presença de um sinal.',
      'No board, um fio aceso transporta 1 e um fio escuro transporta 0. A cor mostra o valor lógico naquele instante; o pulso que percorre o fio destaca uma mudança de estado.',
    ],
    sections: [
      { title: 'Um bit não é uma tensão específica', body: [
        'Em um circuito físico, 0 e 1 correspondem a faixas de tensão reconhecidas pelos componentes. Os limites dependem da tecnologia e da alimentação: 1 não significa necessariamente 1 volt. Tensões entre as faixas válidas podem produzir leituras indefinidas.',
        'Este simulador trabalha com valores lógicos ideais. Ele não calcula tensão, corrente, ruído nem o tempo que um sinal leva para atravessar uma porta. Use-o para entender a lógica; um projeto eletrônico real precisa considerar essas outras grandezas.',
      ] },
      { title: 'De um estado a uma informação', body: [
        'Uma chave mantém o estado escolhido até você clicar de novo. Um botão envia 1 enquanto está pressionado e volta a 0 quando é solto. Um clock alterna os dois valores automaticamente. Os três produzem bits, mas mudam de formas diferentes.',
        'O significado vem da ligação e da regra do circuito. Um LED pode representar uma lâmpada, uma autorização ou um resultado. Antes de montar, defina o que 0 e 1 significam em cada entrada e o que você espera da saída.',
      ] },
      { title: 'Vários bits representam números', body: [
        'Com dois bits existem quatro combinações: 00, 01, 10 e 11. Interpretadas como números binários, elas representam 0, 1, 2 e 3. O bit à esquerda vale 2 e o da direita vale 1.',
        'Com quatro bits, os pesos são 8, 4, 2 e 1. Por exemplo, 0101 representa 4 + 1 = 5. Em geral, n bits permitem 2ⁿ combinações. Um único fio do board transporta um bit, então um número de quatro bits precisa de quatro sinais.',
      ], table: { head: ['Binário', 'Cálculo', 'Decimal'], rows: [['00', '0×2 + 0×1', '0'], ['01', '0×2 + 1×1', '1'], ['10', '1×2 + 0×1', '2'], ['11', '1×2 + 1×1', '3']] } },
    ],
    practice: { title: 'Acompanhe um bit da chave até o LED', demo: 'led', steps: [
      'Abra a demonstração: uma chave está ligada diretamente a um LED.',
      'Clique na chave A e observe a mudança no fio e no LED. Clique de novo para voltar a 0.',
      'Troque a cor do LED. O significado do sinal mudou ou apenas sua aparência?',
    ], explanation: 'O LED acompanha o bit da chave: A = 0 deixa a saída apagada e A = 1 acende a saída. Mudar a cor não altera o valor lógico nem as conexões.' },
  },
  {
    id: 'fios', title: 'Entradas, saídas e fios',
    body: [
      'Um circuito é uma rede de componentes. As entradas recebem sinais, cada componente aplica sua regra e as saídas entregam o resultado para a próxima etapa. No board, as entradas ficam à esquerda da peça e as saídas à direita.',
      'Para criar uma conexão, arraste de um pino de saída até um de entrada. Você também pode tocar em um pino e depois no outro. A posição da peça ajuda a organizar o desenho, mas são os fios que definem o circuito.',
    ],
    sections: [
      { title: 'Siga o caminho do sinal', body: [
        'Comece por uma fonte: chave, botão, clock ou fonte 1. Siga o fio até a entrada de uma porta, aplique a regra dessa porta e continue pela saída. Um LED permite observar o valor no fim do caminho.',
        'Não confunda um pino com o corpo do componente. Para ligar peças, use os pequenos pontos de conexão. Cruzar dois fios no desenho não cria uma junção: cada fio mantém os pinos de origem e destino que você escolheu.',
      ] },
      { title: 'Uma saída pode ter vários destinos', body: [
        'No simulador, a mesma saída pode alimentar diversas entradas. Esse compartilhamento é útil para enviar A a duas portas ou para ligar A aos dois pinos de uma NAND. Todos esses destinos recebem o mesmo bit.',
        'Cada entrada aceita um único fio. Se você conectar outra saída a uma entrada ocupada, o fio novo substitui o anterior. Não é uma forma de somar sinais: para combinar A e B, use uma porta como AND, OR ou XOR.',
      ] },
      { title: 'Ligação ausente e diagnóstico', body: [
        'Uma entrada sem fio vale 0 neste simulador. Em hardware real, uma entrada solta pode flutuar e precisa de um nível definido, por exemplo com resistores de pull-up ou pull-down. A regra do board é uma simplificação, não uma recomendação de montagem física.',
        'Quando o resultado não sair como esperado, confira a fonte, o pino de destino e a saída observada, nessa ordem. Selecione um fio e apague para refazer a conexão. Mover uma peça mantém suas ligações; arrastá-la até o menu de peças a remove com os fios ligados a ela.',
      ] },
    ],
    practice: { title: 'Use o mesmo sinal em duas entradas', demo: 'nand', steps: [
      'Abra a demonstração NAND e observe as duas chaves conectadas à porta.',
      'Ligue a saída da chave A ao pino da NAND que recebe B. A ligação nova substitui a anterior.',
      'Alterne A. Depois alterne B, que agora está desconectada da porta, e compare os efeitos.',
    ], explanation: 'As duas entradas da NAND passam a receber A. Com A = 0, o LED acende; com A = 1, apaga. B deixa de influenciar a saída, pois seu fio foi substituído.' },
  },
  {
    id: 'tabela', title: 'Tabela-verdade',
    body: [
      'Uma tabela-verdade descreve o comportamento de um circuito combinacional em todas as combinações das entradas. Cada linha é um teste completo: escolha os valores das entradas e registre os valores esperados nas saídas.',
      'Com n entradas independentes existem 2ⁿ combinações. Uma entrada gera duas linhas, duas geram quatro, três geram oito e quatro geram dezesseis. A tabela ajuda a transformar uma regra em algo que você consegue verificar.',
    ],
    sections: [
      { title: 'Liste as combinações sem pular nenhuma', body: [
        'Uma forma segura é contar em binário. Para A e B, use 00, 01, 10 e 11. Para A, B e C, vá de 000 até 111. A ordem das linhas pode variar, mas cada combinação precisa aparecer exatamente uma vez.',
        'Separe as colunas de entrada das de saída. Um circuito com duas saídas, como o meio somador, tem uma coluna para cada resultado na mesma linha. Não precisa de mais linhas só por ter mais saídas.',
      ] },
      { title: 'Exemplo: AND, OR e XOR', body: [
        'AND exige que as duas condições sejam verdadeiras. OR aceita uma ou as duas. XOR exige valores diferentes. A linha 11 é especialmente útil: ela distingue a OR, que produz 1, da XOR, que produz 0.',
      ], table: { head: ['A', 'B', 'AND', 'OR', 'XOR'], rows: [['0', '0', '0', '0', '0'], ['0', '1', '0', '1', '1'], ['1', '0', '0', '1', '1'], ['1', '1', '1', '1', '0']] } },
      { title: 'Da tabela ao teste do circuito', body: [
        'Monte uma chave para cada entrada e um LED para cada saída. Passe por todas as linhas e compare o resultado. Uma única linha diferente já mostra que o circuito não implementa a regra completa, mesmo que acerte os outros casos.',
        'O painel de tabela-verdade automatiza esse processo, e o botão Verificar dos desafios compara as linhas com a resposta esperada. Uma tabela de entradas atuais não descreve sozinha uma memória: circuitos sequenciais também precisam considerar o estado anterior e os eventos do clock.',
      ] },
    ],
    practice: { title: 'Teste a diferença entre OR e XOR', demo: 'xor', steps: [
      'Abra a demonstração XOR e percorra 00, 01, 10 e 11 com as chaves A e B.',
      'Anote o LED em cada linha antes de consultar a tabela acima.',
      'Troque a XOR por uma OR, refaça as conexões e descubra qual linha muda.',
    ], explanation: 'A XOR produz 0, 1, 1, 0; a OR produz 0, 1, 1, 1. Só a combinação A = B = 1 muda. Testar apenas 00, 01 e 10 não distingue esses dois circuitos.' },
  },
  {
    id: 'boole', title: 'Álgebra de Boole',
    body: [
      'A álgebra de Boole permite escrever e transformar regras com os valores 0 e 1. Em vez de desenhar cada fio primeiro, você descreve a saída com uma expressão e depois escolhe as portas que a realizam.',
      'Neste guia, A·B significa AND, A+B significa OR, ¬A significa NOT e A⊕B significa XOR. A barra sobre uma letra, como Ā, também indica negação. Os símbolos representam operações lógicas, não a soma comum de números.',
    ],
    sections: [
      { title: 'Leia uma expressão por etapas', body: [
        'Na expressão Y = A·¬B, primeiro inverta B e depois faça AND com A. A saída só vale 1 quando A está ligada e B está desligada. Para montar, use uma NOT em B e conecte sua saída a uma AND junto com A.',
        'Use parênteses para tornar a ordem explícita. ¬(A·B) inverte o resultado da AND e corresponde a uma NAND; (¬A)·B inverte apenas A. As duas expressões não são equivalentes.',
      ], expression: 'Y = A·¬B' },
      { title: 'Simplifique antes de montar', body: [
        'Algumas identidades eliminam trabalho: A·1 = A, A+0 = A, A·0 = 0 e A+1 = 1. Também vale A·A = A e A+A = A. Note que 1+1 = 1 na operação OR; isso não é a soma binária 1+1 = 10.',
        'Por exemplo, A·B + A·¬B = A·(B+¬B) = A·1 = A. O circuito pode parecer depender de B, mas o resultado sempre é A. Compare as quatro linhas de uma tabela-verdade para confirmar a equivalência.',
      ], expression: 'A·B + A·¬B = A' },
      { title: 'De Morgan e portas universais', body: [
        'As leis de De Morgan dizem que ¬(A·B) = ¬A+¬B e ¬(A+B) = ¬A·¬B. Ao levar a negação para dentro dos parênteses, troque AND por OR ou OR por AND e negue cada entrada.',
        'Uma NAND com suas duas entradas ligadas a A produz ¬A. Duas NAND podem formar uma AND, invertendo de novo a primeira saída. Com inversões e De Morgan, você também constrói OR. É por isso que NAND é universal; uma construção equivalente existe usando apenas NOR.',
      ], table: { head: ['A', 'B', '¬(A·B)', '¬A+¬B'], rows: [['0', '0', '1', '1'], ['0', '1', '1', '1'], ['1', '0', '1', '1'], ['1', '1', '0', '0']] } },
    ],
    practice: { title: 'Transforme NAND em NOT', demo: 'nand', steps: [
      'Abra a demonstração NAND e conecte a chave A às duas entradas da porta.',
      'Preveja a saída para A = 0 e A = 1 usando a expressão ¬(A·A).',
      'Compare com uma porta NOT recebendo o mesmo sinal.',
    ], explanation: 'Como A·A = A, a expressão ¬(A·A) simplifica para ¬A. As duas montagens produzem 1 com A = 0 e 0 com A = 1. Elas são logicamente equivalentes, embora usem componentes diferentes.' },
  },
  {
    id: 'combinacional', title: 'Combinacional e sequencial',
    body: [
      'A diferença central é a presença de estado. Em um circuito combinacional, conhecer as entradas atuais basta para determinar as saídas. Em um circuito sequencial, também é preciso saber o que foi guardado antes.',
      'Um somador é combinacional. Um registrador ou contador é sequencial. As mesmas entradas podem produzir resultados diferentes em momentos diferentes se o estado armazenado tiver mudado.',
    ],
    sections: [
      { title: 'Combinacional: uma função das entradas', body: [
        'AND, OR, XOR, MUX e somadores são exemplos de funções combinacionais. Se você repetir a mesma combinação de entradas, obtém a mesma saída depois que o circuito se estabilizar.',
        'No simulador, isso parece imediato. Na eletrônica real, cada porta tem um atraso de propagação e caminhos diferentes podem produzir pulsos transitórios. A tabela-verdade descreve o resultado estável, não esses detalhes de tempo.',
      ] },
      { title: 'Sequencial: o passado faz parte da resposta', body: [
        'Um flip-flop D guarda um bit em Q. D é o dado a armazenar e CLK é o sinal que determina quando a captura acontece. No flip-flop do board, Q recebe D apenas na borda de subida: quando CLK passa de 0 para 1.',
        'Depois da captura, mudar D não altera Q até a próxima borda de subida. Manter CLK em 1 também não captura novos dados continuamente. A descida de 1 para 0 prepara outro pulso, mas não grava D neste modelo.',
      ], table: { head: ['Evento em CLK', 'D', 'Próximo Q'], rows: [['Sem subida', '0 ou 1', 'Q anterior'], ['0 → 1', '0', '0'], ['0 → 1', '1', '1'], ['1 → 0', '0 ou 1', 'Q anterior']] } },
      { title: 'Clock, latches e realimentação', body: [
        'Um clock organiza atualizações em intervalos regulares. Sua frequência em hertz indica ciclos por segundo: 2 Hz são dois ciclos completos a cada segundo. A borda é um evento dentro do ciclo, não o ciclo inteiro.',
        'Nem toda memória usa um clock: um latch SR responde às entradas de controle, por exemplo. A realimentação pode guardar estado, mas ligar saídas de volta às entradas sem analisar o circuito também pode causar oscilação. O aviso de instabilidade indica que o simulador não encontrou um estado estável.',
      ] },
    ],
    practice: { title: 'Grave um bit e mude a entrada', demo: 'dff', steps: [
      'Abra a demonstração do flip-flop D. A chave fornece D e o botão está ligado ao CLK.',
      'Coloque D em 1, pressione e solte o botão. Observe Q no primeiro LED.',
      'Mude D para 0 sem apertar o botão. Depois pressione o botão de novo e compare.',
    ], explanation: 'A primeira subida do botão grava Q = 1. Trocar D para 0 deixa Q em 1, pois o bit está armazenado. A próxima subida grava Q = 0. O outro LED mostra Q̄, o complemento de Q.' },
  },
  {
    id: 'somador', title: 'Exemplo: meio somador',
    body: [
      'O meio somador junta os fundamentos em um circuito útil: ele soma dois bits, A e B. O resultado tem dois bits, porque 1+1 ultrapassa o maior valor que cabe em um único bit.',
      'As saídas são S, o bit da soma, e C, o transporte ou “vai um”. Para ler o número completo, escreva C à esquerda de S. A ordem numérica é CS, mesmo que os LEDs da montagem sejam apresentados como S e C.',
    ],
    sections: [
      { title: 'Comece pela soma, não pelas portas', body: [
        'Liste as quatro possibilidades de A e B e faça a soma em binário. 0+0 dá 00; 0+1 e 1+0 dão 01; 1+1 dá 10. O primeiro dígito do resultado é C e o segundo é S.',
        'Separar o resultado em colunas mostra o papel de cada saída: S vale 1 quando as entradas são diferentes, e C vale 1 apenas quando as duas entradas são 1.',
      ], table: { head: ['A', 'B', 'S', 'C', 'CS'], rows: [['0', '0', '0', '0', '00'], ['0', '1', '1', '0', '01'], ['1', '0', '1', '0', '01'], ['1', '1', '0', '1', '10']] } },
      { title: 'Traduza a tabela em componentes', body: [
        'A coluna S é a tabela de uma XOR: S = A⊕B. A coluna C é a de uma AND: C = A·B. Cada chave precisa alimentar as duas portas, usando dois fios saindo do mesmo pino.',
        'Conecte a XOR ao LED de soma e a AND ao LED de transporte. Não ligue as duas saídas ao mesmo pino: elas representam bits diferentes e devem ser observadas separadamente.',
      ], expression: 'S = A⊕B; C = A·B' },
      { title: 'Do meio somador à soma de vários bits', body: [
        'O meio somador não recebe um transporte da coluna anterior. Para as próximas colunas de uma soma, use um somador completo: ele soma A, B e Cin, o vai um recebido, e produz S e Cout.',
        'Em uma soma de dois bits, comece somando os bits menos significativos. Ligue o C dessa etapa ao Cin da seguinte. O primeiro estágio pode ser um meio somador; os demais precisam aceitar transporte. O último Cout acrescenta um bit ao resultado quando necessário.',
      ] },
    ],
    practice: { title: 'Confira os dois bits do resultado', demo: 'halfadder', steps: [
      'Abra a demonstração do meio somador. O primeiro LED mostra S e o segundo mostra C.',
      'Teste as quatro combinações de A e B e compare com a tabela.',
      'Deixe as duas chaves em 1. Leia o resultado como C seguido de S e converta para decimal.',
    ], explanation: 'Com A = B = 1, o LED de S apaga e o de C acende. Isso representa CS = 10₂, que vale 2 em decimal. A saída apagada da soma não significa que o resultado completo seja zero.' },
  },
];

export default basics;
