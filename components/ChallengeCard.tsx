'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, RotateCcw, Trophy } from 'lucide-react';
import { type Circuit } from '@/lib/circuit';
import { CHALLENGES, checkChallenge, markSolved, type Challenge, type ChallengeIssue, type ChallengeResult } from '@/lib/challenges';
import { useI18n } from '@/lib/i18n/client';
import { switchLabel, ledLabel } from '@/lib/truth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Goal of the current challenge, with a button that checks every row of the truth table. */
export function ChallengeCard({ challenge, circ, onReset }: { challenge: Challenge; circ: Circuit; onReset: () => void }) {
  const { t, locale, href } = useI18n();
  const text = challenge.text[locale];
  const [open, setOpen] = useState(true);
  const [hint, setHint] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  useEffect(() => { setResult(null); }, [circ]);   // a change on the board invalidates the last check
  const next = CHALLENGES[CHALLENGES.indexOf(challenge) + 1];

  const check = () => {
    const r = checkChallenge(challenge, circ);
    setResult(r);
    if (r.ok) markSolved(challenge.id);
  };

  const issueText = (i: ChallengeIssue) =>
    i.type === 'switches' ? t.challenge.needSwitches(i.n)
    : i.type === 'leds' ? t.challenge.needLeds(i.n)
    : i.type === 'forbidden' ? t.challenge.forbidden(i.kinds.map(k => t.parts[k]).join(', '))
    : t.challenge.oscillates;

  return (
    <section aria-label={t.challenge.label}
      className="absolute top-3 left-3 z-10 flex max-h-[calc(100%-24px)] w-[min(340px,calc(100%-24px))] flex-col rounded-xl border border-edge bg-panel/95 shadow-xl shadow-black/50 backdrop-blur">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center gap-2 px-3 pt-2.5 pb-2 text-left">
        <Trophy className="size-4 shrink-0" style={{ color: 'var(--glow)' }} />
        <span className="min-w-0 flex-1">
          <span className="block text-[10.5px] tracking-[0.14em] text-ink uppercase">{t.challenge.label} · {t.challengesPage.levels[challenge.level]}</span>
          <span className="block truncate text-[13px] tracking-[0.06em] text-ink-hi">{text.title}</span>
        </span>
        {open ? <ChevronUp className="size-4 text-ink" /> : <ChevronDown className="size-4 text-ink" />}
      </button>
      {open && (
        <div className="min-h-0 overflow-y-auto px-3 pb-3 text-[12px] leading-relaxed">
          <p className="text-ink-hi/90">{text.goal}</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-ink">
            <dt>{t.challenge.inputs}</dt>
            <dd className="text-ink-hi">{challenge.inputs.map((n, i) => (switchLabel(i) === n ? n : `${switchLabel(i)}=${n}`)).join(' · ')}</dd>
            <dt>{t.challenge.outputs}</dt>
            <dd className="text-ink-hi">{challenge.outputs.map((n, i) => `${ledLabel(i)}=${n}`).join(' · ')}</dd>
            {challenge.allowed && <>
              <dt>{t.challenge.allowed}</dt>
              <dd className="text-ink-hi">{challenge.allowed.map(k => t.parts[k]).join(', ')}</dd>
            </>}
          </dl>
          {hint && <p className="mt-2 rounded-md border border-edge bg-background/60 px-2 py-1.5 text-ink-hi/90"><Lightbulb className="mr-1 inline size-3.5" style={{ color: 'var(--glow)' }} />{text.hint}</p>}

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button size="sm" onClick={check}><CheckCircle2 />{t.challenge.check}</Button>
            {!hint && <Button size="sm" variant="ghost" className="text-ink hover:text-ink-hi" onClick={() => setHint(true)}><Lightbulb />{t.challenge.hint}</Button>}
            <Button size="sm" variant="ghost" className="text-ink hover:text-ink-hi" onClick={onReset}><RotateCcw />{t.challenge.reset}</Button>
          </div>

          {result && (
            <div className="mt-3 border-t border-edge pt-2">
              {result.ok
                ? <p className="text-ink-hi" style={{ color: 'var(--glow)' }}>{t.challenge.solved}</p>
                : result.issues.length && !result.rows.length
                  ? result.issues.map((i, k) => <p key={k} className="text-destructive">{issueText(i)}</p>)
                  : <p className="text-ink-hi/90">{result.issues.some(i => i.type === 'unstable') ? t.challenge.oscillates : t.challenge.notYet}</p>}
              {result.rows.length > 0 && (
                <table className="mt-2 w-full border-collapse text-center tabular-nums">
                  <thead>
                    <tr className="border-b border-edge text-ink">
                      {challenge.inputs.map((_, i) => <th key={i} className="px-1 pb-1 font-normal">{switchLabel(i)}</th>)}
                      {challenge.outputs.map((_, i) => <th key={`o${i}`} className={cn('px-1 pb-1 font-normal text-ink-hi', i === 0 && 'border-l border-edge')}>{ledLabel(i)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r, m) => (
                      <tr key={m} className={cn('border-b border-edge/40 last:border-0', !r.ok && 'bg-destructive/15')}>
                        {r.ins.map((v, j) => <td key={j} className="py-0.5 text-ink">{v}</td>)}
                        {r.got.map((v, j) => (
                          <td key={`o${j}`} className={cn('py-0.5', j === 0 && 'border-l border-edge', v === r.expected[j] ? 'text-ink-hi' : 'text-destructive')}
                            title={`${t.challenge.expected} ${r.expected[j]} · ${t.challenge.got} ${v}`}>
                            {v === r.expected[j] ? v : `${v}→${r.expected[j]}`}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {result.ok && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {next && <Button asChild size="sm"><a href={`${href('/board')}?challenge=${next.id}`}>{t.challenge.next}<ArrowRight /></a></Button>}
                  <Button asChild size="sm" variant="ghost" className="text-ink hover:text-ink-hi"><Link href={href('/challenges')}>{t.challenge.all}</Link></Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
