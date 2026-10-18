import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FlaskConical, Trophy } from 'lucide-react';
import { SPECS, encodeCircuit } from '@/lib/circuit';
import { demoFor } from '@/lib/demos';
import { getDict } from '@/lib/i18n/server';
import { GROUPS, getLearn, type Lesson } from '@/lib/learn';
import { PartIcon } from '@/components/PartIcon';
import { LearnToc } from '@/components/LearnToc';
import { SiteHeader } from '@/components/SiteHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/optics/card';

export async function generateMetadata({ params }: PageProps<'/[lang]/learn'>): Promise<Metadata> {
  const { t } = await getDict(params);
  return { title: t.meta.learnTitle, description: t.meta.learnDescription };
}

function Table({ t }: { t: NonNullable<Lesson['table']> }) {
  return (
    <table className="w-full max-w-sm border-collapse text-center text-[13px]">
      <thead>
        <tr>{t.head.map(h => <th key={h} scope="col" className="border-b border-edge px-2 pb-1.5 font-normal text-ink">{h}</th>)}</tr>
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

export default async function LearnPage({ params }: PageProps<'/[lang]/learn'>) {
  const { t, locale } = await getDict(params);
  const L = getLearn(locale);
  const board = `/${locale}/board`;

  return (
    <div className="min-h-dvh overflow-y-auto" style={{ height: '100dvh' }}>
      <SiteHeader />

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-8 sm:px-6">
        <LearnToc label={t.learn.contents} groups={[
          { title: t.learn.basics, items: L.basics.map(b => ({ id: b.id, label: b.title })) },
          ...GROUPS.map(g => ({ title: L.groupNames[g], items: L.lessons.filter(l => l.group === g).map(l => ({ id: l.kind, label: t.parts[l.kind] })) })),
        ]} />

        <main className="min-w-0 flex-1 pb-24">
          <h1 className="text-2xl tracking-[0.06em] text-ink-hi">{t.learn.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink">{t.learn.intro}</p>
          <Button asChild variant="outline" size="sm" className="mt-5 border-edge text-ink-hi">
            <Link href={`/${locale}/challenges`}><Trophy style={{ color: 'var(--glow)' }} />{t.learn.challengesCta}</Link>
          </Button>

          <section className="mt-10" aria-labelledby="fundamentals-title">
            <h2 id="fundamentals-title" className="mb-5 text-[11px] tracking-[0.16em] text-ink uppercase">{t.learn.basics}</h2>
            <nav aria-label={t.learn.basics} className="mb-8 grid gap-2 sm:grid-cols-2 lg:hidden">
              {L.basics.map(b => <a key={b.id} href={`#${b.id}`} className="rounded-md border border-edge px-3 py-2 text-xs text-ink hover:border-ink hover:text-ink-hi">{b.title}</a>)}
            </nav>
            <div className="flex flex-col gap-12">
              {L.basics.map(b => (
                <section key={b.id} id={b.id} aria-labelledby={`${b.id}-title`} data-fundamental className="scroll-mt-24 border-t border-edge pt-8">
                  <h3 id={`${b.id}-title`} className="text-xl leading-snug tracking-[-0.03em] text-ink-hi sm:text-2xl">{b.title}</h3>
                  <div className="mt-5 max-w-[70ch] space-y-3 text-[14px] leading-7 text-ink">
                    {b.body.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                  <div className="mt-8 space-y-8">
                    {b.sections.map(section => (
                      <div key={section.title}>
                        <h4 className="text-[15px] leading-relaxed text-ink-hi">{section.title}</h4>
                        <div className="mt-3 max-w-[70ch] space-y-3 text-[13px] leading-7 text-ink">
                          {section.body.map((p, i) => <p key={i}>{p}</p>)}
                        </div>
                        {section.expression && <p className="mt-4 overflow-x-auto rounded-lg border border-edge bg-panel px-4 py-3 text-sm" style={{ color: 'var(--glow-hi)' }}>{section.expression}</p>}
                        {section.table && <div className="mt-5 overflow-x-auto rounded-lg border border-edge bg-panel p-4"><Table t={section.table} /></div>}
                      </div>
                    ))}
                  </div>
                  <aside className="mt-8 rounded-xl border border-edge bg-panel p-5 sm:p-6" aria-labelledby={`${b.id}-practice`}>
                    <p className="flex items-center gap-2 text-xs text-glow"><FlaskConical className="size-4" />{t.learn.practice}</p>
                    <h4 id={`${b.id}-practice`} className="mt-3 text-[15px] leading-relaxed text-ink-hi">{b.practice.title}</h4>
                    <ol className="mt-4 list-decimal space-y-3 pl-5 text-[13px] leading-relaxed text-ink marker:text-glow">
                      {b.practice.steps.map(step => <li key={step} className="pl-1">{step}</li>)}
                    </ol>
                    <Button asChild variant="outline" size="sm" className="mt-5 border-edge bg-background text-ink-hi">
                      <a href={`${board}#c=${encodeCircuit(demoFor(b.practice.demo))}`}><FlaskConical />{t.learn.tryIt}</a>
                    </Button>
                    <details className="mt-5 border-t border-edge pt-4 text-[13px] leading-relaxed">
                      <summary className="cursor-pointer text-ink-hi">{t.learn.showExplanation}</summary>
                      <p className="mt-3 text-ink">{b.practice.explanation}</p>
                    </details>
                  </aside>
                </section>
              ))}
            </div>
          </section>

          {GROUPS.map(g => (
            <section key={g} id={g} className="mt-14">
              <h2 className="mb-4 text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--line)' }}>{L.groupNames[g]}</h2>
              <div className="flex flex-col gap-5">
                {L.lessons.filter(l => l.group === g).map(l => {
                  const s = SPECS[l.kind];
                  return (
                    <Card key={l.kind} id={l.kind} decorations className="scroll-mt-20 gap-0 pt-5 sm:pt-6">
                      <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                      <div className="flex flex-wrap items-center gap-5">
                        <div className="grid h-[96px] w-[150px] place-items-center rounded-xl border border-edge bg-background">
                          <PartIcon kind={l.kind} className="h-[80px] w-[130px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-xl font-normal tracking-[0.08em] text-ink-hi uppercase"><h3>{t.parts[l.kind]}</h3></CardTitle>
                          <CardDescription className="mt-2 text-sm text-ink-hi/90">{l.summary}</CardDescription>
                        </div>
                      </div>

                      {(l.expr || l.table) && (
                        <div className="mt-5 flex flex-wrap items-start gap-x-10 gap-y-4 rounded-xl border border-edge bg-background/60 p-4">
                          {l.expr && (
                            <div>
                              <div className="mb-1.5 text-[10.5px] tracking-[0.14em] uppercase" style={{ color: 'var(--line)' }}>{t.learn.expression}</div>
                              <div className="text-[15px] text-ink-hi">{l.expr}</div>
                            </div>
                          )}
                          {l.table && (
                            <div className="min-w-[200px] flex-1">
                              <div className="mb-1.5 text-[10.5px] tracking-[0.14em] uppercase" style={{ color: 'var(--line)' }}>{t.learn.truthTable}</div>
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
                      </CardContent>
                      <CardFooter background className="justify-between gap-3">
                        <span className="text-xs text-ink">{s.part ? `${t.learn.chip} ${s.part}` : ''}</span>
                        <Button asChild variant="outline" size="sm" className="border-edge bg-panel text-ink-hi">
                          <a href={`${board}#c=${encodeCircuit(demoFor(l.kind))}`}><FlaskConical style={{ color: 'var(--glow)' }} />{t.learn.tryIt}</a>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="mt-14 flex justify-center">
            <Button asChild variant="outline" className="border-edge text-ink-hi">
              <Link href={board}>{t.nav.openBoard}<ArrowRight /></Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
