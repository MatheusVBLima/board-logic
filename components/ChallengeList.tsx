'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { CHALLENGES, solvedChallenges } from '@/lib/challenges';
import { useI18n } from '@/lib/i18n/client';
import { switchLabel } from '@/lib/truth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/optics/card';
import { CircuitMotif } from '@/components/CircuitMotif';

export function ChallengeList() {
  const { t, locale, href } = useI18n();
  const [solved, setSolved] = useState<Set<string>>(() => new Set());
  useEffect(() => { setSolved(solvedChallenges()); }, []);
  const levels = [...new Set(CHALLENGES.map(c => c.level))].sort();
  const completed = CHALLENGES.filter(c => solved.has(c.id)).length;

  return (
    <>
      <div className="mt-6 flex max-w-sm items-center gap-4">
        <div role="progressbar" aria-label={t.challengesPage.title} aria-valuenow={completed} aria-valuemin={0} aria-valuemax={CHALLENGES.length}
          className="h-1 flex-1 overflow-hidden rounded-full bg-edge">
          <div className="h-full rounded-full bg-glow" style={{ width: `${completed / CHALLENGES.length * 100}%` }} />
        </div>
        <p className="text-[11px] text-ink">{t.challengesPage.progress(completed, CHALLENGES.length)}</p>
      </div>
      {levels.map(level => (
        <section key={level} className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-7 place-items-center rounded-md border border-edge text-[11px] text-glow">0{level}</span>
            <h2 className="text-[11px] tracking-[0.16em] text-ink-hi uppercase">{t.challengesPage.levels[level]}</h2>
            <span className="h-px flex-1 bg-edge" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {CHALLENGES.filter(c => c.level === level).map(c => {
              const done = solved.has(c.id);
              const txt = c.text[locale];
              return (
                <Card key={c.id} decorations className="relative flex gap-0 border border-edge bg-panel py-0 ring-0 transition-colors hover:border-ink/40">
                  <div className="relative flex min-w-0 flex-1 flex-col">
                    <div className="relative overflow-hidden px-6 pt-6 pb-4">
                      <CircuitMotif className="pointer-events-none absolute -top-8 -right-6 h-36 w-40 text-ink/15 opacity-60" />
                      <div className="relative flex items-center justify-between text-[10px] tracking-[0.12em] text-ink uppercase">
                        <span>{t.challenge.label} {String(CHALLENGES.indexOf(c) + 1).padStart(2, '0')}</span>
                        {done && <span className="flex items-center gap-1.5 text-glow"><CheckCircle2 className="size-3.5" />{t.challengesPage.done}</span>}
                      </div>
                      <h3 className="relative mt-4 max-w-[85%] text-[18px] leading-snug tracking-[-0.03em] text-ink-hi">{txt.title}</h3>
                    </div>
                    <p className="flex-1 px-6 text-[12px] leading-6 text-ink">{txt.goal}</p>
                    <div className="mt-5 flex flex-wrap gap-1.5 px-6 pb-5">
                      {c.allowed?.map(k => <span key={k} className="challenge-pin">{t.parts[k]}</span>)}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge bg-background/40 px-6 py-4">
                      <span className="text-[10px] text-ink">
                        {c.inputs.length > 1 ? `${switchLabel(0)}–${switchLabel(c.inputs.length - 1)}` : switchLabel(0)} → {c.outputs.length} LED
                      </span>
                      <Button asChild size="sm" variant={done ? 'outline' : 'default'} className="text-[11px]">
                        <a href={`${href('/board')}?challenge=${c.id}`}>{done ? t.challengesPage.retry : t.challengesPage.start}<ArrowRight className="size-3.5" /></a>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
