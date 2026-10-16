# Board Lógica

Simulador de circuitos lógicos com visual isométrico de linhas finas, onde tudo que está ligado brilha.
Arraste peças do menu de baixo para o board, puxe fios entre os pinos e veja o sinal acender.

## Peças

- **Entradas:** chave (liga/desliga), botão (momentâneo), clock (0,5 a 8 Hz), fonte 1
- **Portas:** NOT, AND, OR, XOR, NAND, NOR, XNOR
- **Memória:** flip-flop D (sensível à borda de subida)
- **Saídas:** LED (clique para trocar a cor), display hexadecimal de 7 segmentos

## Como usar

- Arraste uma peça do menu para o board (ou clique nela para soltar no centro).
- Arraste de um pino de saída para um de entrada para criar um fio. No celular, toque num pino e depois no outro.
- Clique numa chave para ligar; segure um botão; clique no clock para mudar a frequência.
- Clique num fio para selecionar; clique de novo para mudar a dobra. `Delete` apaga a seleção.
- Solte uma peça em cima do menu para removê-la. `Ctrl+Z` desfaz, `Ctrl+Shift+Z` refaz.
- ISO/2D troca a vista, o ícone de link copia uma URL com o circuito, e o circuito fica salvo no navegador.

## Desenvolvimento

```bash
bun install
bun dev        # http://localhost:3000
bun test       # testes do simulador
bun run build
```

Next.js 16 (App Router), React 19, Tailwind CSS 4 e shadcn/ui. A simulação fica em `lib/sim.ts`
(propagação iterativa até estabilizar, o que permite latches e realimentação) e o desenho isométrico
em `lib/iso.ts` + `components/Part.tsx`.

## Deploy na Vercel

Importe o repositório em https://vercel.com/new. A Vercel detecta Next.js e o `bun.lock` automaticamente;
não há variáveis de ambiente.

Visual inspirado em [iso-glow](https://isoglow.dev) e [iso-figure](https://github.com/MrBongoC/ai-iso-skill).
