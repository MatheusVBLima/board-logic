'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { CHALLENGES, solvedChallenges } from '@/lib/challenges';
import { useI18n } from '@/lib/i18n/client';
import { switchLabel } from '@/lib/truth';
import { Button } from '@/components/ui/button';

export function ChallengeList() {
  const { t, locale, href } = useI18n();
  const [solved, setSolved] = useState<Set<string>>(() => new Set());
  useEffect(() => { setSolved(solvedChallenges()); }, []);
  const levels = [...new Set(CHALLENGES.map(c => c.level))].sort();

  return (
    <>
      <p className="mt-4 text-[12px] tracking-[0.12em] uppercase" style={{ color: 'var(--glow)' }}>
        {t.challengesPage.progress(CHALLENGES.filter(c => solved.has(c.id)).length, CHALLENGES.length)}
      </p>
      {levels.map(level => (
        <section key={level} className="mt-8">
          <h2 className="mb-3 text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--line)' }}>{t.challengesPage.levels[level]}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHALLENGES.filter(c => c.level === level).map(c => {
              const done = solved.has(c.id);
              const txt = c.text[locale];
              return (
                <article key={c.id} className="flex flex-col rounded-2xl border border-edge bg-panel p-4">
                  <div className="flex items-start gap-2">
                    {done
                      ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--glow)' }} aria-label={t.challengesPage.done} />
                      : <Circle className="mt-0.5 size-4 shrink-0 text-ink" />}
                    <h3 className="text-[14px] tracking-[0.06em] text-ink-hi">{txt.title}</h3>
                  </div>
                  <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-ink">{txt.goal}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-ink">
                      {c.inputs.length > 1 ? `${switchLabel(0)}…${switchLabel(c.inputs.length - 1)}` : switchLabel(0)} → {c.outputs.length} LED
                      {c.allowed && ` · ${c.allowed.map(k => t.parts[k]).join(', ')}`}
                    </span>
                    <Button asChild size="sm" variant={done ? 'outline' : 'default'} className={done ? 'border-edge text-ink-hi' : undefined}>
                      <a href={`${href('/board')}?challenge=${c.id}`}>{done ? t.challengesPage.retry : t.challengesPage.start}</a>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
