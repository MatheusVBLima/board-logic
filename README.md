# Board Lógica

Simulador de circuitos lógicos com visual isométrico de linhas finas, onde tudo que está ligado brilha.
Arraste peças do menu de baixo para o board, puxe fios entre os pinos e veja o sinal acender.

## Peças

- **Entradas:** chave (liga/desliga), botão (momentâneo), clock (0,5 a 8 Hz), fonte 1
- **Portas:** NOT, AND, OR, XOR, NAND, NOR, XNOR, buffer, AND e OR de três entradas
- **Roteamento:** multiplexador 2:1 (MUX) e demultiplexador 1:2 (DEMUX)
- **Aritmética:** meio somador e somador completo de um bit
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

Para configurar sua própria conta Supabase, siga o [`setup.md`](setup.md): ele inclui o SQL
completo e as instruções para preencher o [`.env.example`](.env.example).

```bash
bun install
bun dev        # http://localhost:3000
bun test       # testes do simulador
bun run build
```

Next.js 16 (App Router), React 19, Tailwind CSS 4 e shadcn/ui. A simulação fica em `lib/sim.ts`
(propagação iterativa até estabilizar, o que permite latches e realimentação) e o desenho isométrico
em `lib/iso.ts` + `components/Part.tsx`.

## Idiomas, contas e projetos

- O site é em inglês por padrão (`/en/...`) e em português em `/pt/...`. Os textos ficam em `lib/i18n/en.ts` e
  `lib/i18n/pt.ts`, e o guia em `lib/learn/en.ts` e `lib/learn/pt.ts`. Quem escolhe um idioma fica nele (cookie).
- O guia inclui expressões, tabelas-verdade e demonstrações para todas as peças. Os 18 desafios vão de portas universais a roteamento de sinais, decodificação e soma de dois bits. As referências e simplificações dos novos componentes estão em [`docs/logic-components.md`](docs/logic-components.md).
- Rotas: `/[lang]` landing, `/[lang]/board` simulador, `/[lang]/learn` guia, `/[lang]/challenges` desafios,
  `/[lang]/login` e `/[lang]/projects`.
- Contas e projetos salvos usam Supabase (até 10 projetos por usuário). Siga o [`setup.md`](setup.md)
  e defina `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (ou a chave legada `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Sem essas variáveis o site funciona normalmente, só sem login.
- No Supabase (Authentication > URL Configuration) use o domínio do site como Site URL e libere
  `https://<domínio>/**` nas Redirect URLs (o link de e-mail volta em `/auth/callback?next=...`).

## Deploy na Vercel

Importe o repositório em https://vercel.com/new. A Vercel detecta Next.js e o `bun.lock` automaticamente;
defina as duas variáveis do Supabase acima.

Visual inspirado em [iso-glow](https://isoglow.dev) e [iso-figure](https://github.com/MrBongoC/ai-iso-skill).
