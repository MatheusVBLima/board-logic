import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SPECS } from '@/lib/circuit';
import { BASICS, GROUPS, LESSONS, type Lesson } from '@/lib/learn';
import { PartIcon } from '@/components/PartIcon';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Aprender · Board Lógica',
  description: 'Guia completo das peças do Board Lógica: sinais digitais, portas lógicas, flip-flop, LED e display, com tabelas-verdade e exemplos.',
};

const slug = (g: string) => g.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');

function Table({ t }: { t: NonNullable<Lesson['table']> }) {
  return (
    <table className="w-full max-w-sm border-collapse text-center text-[13px]">
      <thead>
        <tr>{t.head.map(h => <th key={h} className="border-b border-edge px-2 pb-1.5 font-normal text-ink">{h}</th>)}</tr>
      </thead>
      <tbody>
        {t.rows.map((r, i) => (
          <tr key={i} className="border-b border-edge/50 last:border-0">
            {r.map((v, j) => (
              <td key={j} className={j === r.length - 1 ? (v === '1' ? 'py-1 text-glow' : 'py-1 text-ink-hi') : 'py-1 text-ink'}
                style={j === r.length - 1 && v === '1' ? { textShadow: '0 0 8px var(--glow)' } : undefined}>{v}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function LearnPage() {
  return (
    <div className="min-h-dvh overflow-y-auto" style={{ height: '100dvh' }}>
      <header className="sticky top-0 z-10 border-b border-edge bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 text-[13px] tracking-[0.14em] text-ink-hi uppercase">
            <span className="inline-block size-1.5 rounded-full" style={{ background: 'var(--glow)', boxShadow: '0 0 8px var(--glow)' }} />
            <span>Aprender</span>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-ink hover:text-ink-hi">
            <Link href="/"><ArrowLeft />Voltar ao board</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-8 sm:px-6">
        <nav aria-label="Conteúdo" className="sticky top-20 hidden h-fit w-56 shrink-0 flex-col gap-4 text-[12.5px] lg:flex">
          <div>
            <div className="mb-1.5 text-[10.5px] tracking-[0.14em] uppercase" style={{ color: 'var(--line)' }}>Fundamentos</div>
            {BASICS.map(b => <a key={b.id} href={`#${b.id}`} className="block py-0.5 text-ink hover:text-ink-hi">{b.title}</a>)}
          </div>
          {GROUPS.map(g => (
            <div key={g}>
              <div className="mb-1.5 text-[10.5px] tracking-[0.14em] uppercase" style={{ color: 'var(--line)' }}>{g}</div>
              {LESSONS.filter(l => l.group === g).map(l => (
                <a key={l.kind} href={`#${l.kind}`} className="block py-0.5 text-ink hover:text-ink-hi">{SPECS[l.kind].name}</a>
              ))}
            </div>
          ))}
        </nav>

        <main className="min-w-0 flex-1 pb-24">
          <h1 className="text-2xl tracking-[0.06em] text-ink-hi">Guia de lógica digital</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink">
            Tudo o que você precisa para montar circuitos no board: como os sinais funcionam, o que cada peça faz,
            a tabela-verdade das portas e ideias de circuitos para testar.
          </p>

          <section className="mt-10">
            <h2 className="mb-4 text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--line)' }}>Fundamentos</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {BASICS.map(b => (
                <article key={b.id} id={b.id} className="scroll-mt-20 rounded-2xl border border-edge bg-panel p-5">
                  <h3 className="text-[15px] text-ink-hi">{b.title}</h3>
                  {b.body.map((p, i) => <p key={i} className="mt-2.5 text-[13px] leading-relaxed text-ink">{p}</p>)}
                </article>
              ))}
            </div>
          </section>

          {GROUPS.map(g => (
            <section key={g} id={slug(g)} className="mt-14">
              <h2 className="mb-4 text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--line)' }}>{g}</h2>
              <div className="flex flex-col gap-5">
                {LESSONS.filter(l => l.group === g).map(l => {
                  const s = SPECS[l.kind];
                  return (
                    <article key={l.kind} id={l.kind} className="scroll-mt-20 rounded-2xl border border-edge bg-panel p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-5">
                        <div className="grid h-[96px] w-[150px] place-items-center rounded-xl border border-edge bg-background">
                          <PartIcon kind={l.kind} className="h-[80px] w-[130px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl tracking-[0.08em] text-ink-hi uppercase">{s.name}</h3>
                          {s.part && <div className="mt-0.5 text-xs text-ink">chip {s.part}</div>}
                          <p className="mt-2 text-sm text-ink-hi/90">{l.summary}</p>
                        </div>
                      </div>

                      {(l.expr || l.table) && (
                        <div className="mt-5 flex flex-wrap items-start gap-x-10 gap-y-4 rounded-xl border border-edge bg-background/60 p-4">
                          {l.expr && (
                            <div>
                              <div className="mb-1.5 text-[10.5px] tracking-[0.14em] uppercase" style={{ color: 'var(--line)' }}>Expressão</div>
                              <div className="text-[15px] text-ink-hi">{l.expr}</div>
                            </div>
                          )}
                          {l.table && (
                            <div className="min-w-[200px] flex-1">
                              <div className="mb-1.5 text-[10.5px] tracking-[0.14em] uppercase" style={{ color: 'var(--line)' }}>Tabela-verdade</div>
                              <Table t={l.table} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
                        {l.guide.map(b => (
                          <div key={b.title}>
                            <h4 className="text-[12px] tracking-[0.12em] text-ink-hi uppercase">{b.title}</h4>
                            {b.body.map((p, i) => <p key={i} className="mt-2 text-[13px] leading-relaxed text-ink">{p}</p>)}
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="mt-14 flex justify-center">
            <Button asChild variant="outline" className="border-edge text-ink-hi">
              <Link href="/"><ArrowLeft />Voltar ao board e testar</Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
