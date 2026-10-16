'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpenText, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, RotateCcw, Trophy } from 'lucide-react';
import { type Circuit } from '@/lib/circuit';
import { CHALLENGES, checkChallenge, markSolved, type Challenge, type ChallengeIssue, type ChallengeResult } from '@/lib/challenges';
import { useI18n } from '@/lib/i18n/client';
import { switchLabel, ledLabel } from '@/lib/truth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/optics/card';
import { CircuitMotif } from '@/components/CircuitMotif';
import { cn } from '@/lib/utils';

/** A separate challenge brief: it reserves space rather than covering the circuit. */
export function ChallengeCard({ challenge, circ, onReset }: { challenge: Challenge; circ: Circuit; onReset: () => void }) {
  const { t, locale, href } = useI18n();
  const text = challenge.text[locale];
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(window.matchMedia('(min-width: 1024px)').matches); }, []);
  const [hint, setHint] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const contentId = useId();
  const hintId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) scrollRef.current?.scrollTo({ top: 0 }); }, [open]);
  const hintRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (hint) hintRef.current?.scrollIntoView({ block: 'nearest' }); }, [hint]);
  useEffect(() => { if (result) resultRef.current?.scrollIntoView({ block: 'start' }); }, [result]);
  useEffect(() => { setResult(null); }, [circ, challenge.id]);
  const index = CHALLENGES.indexOf(challenge);
  const next = CHALLENGES[index + 1];

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
    <Card decorations role="region" aria-label={t.challenge.label} data-challenge-panel data-open={open}
      className="relative mx-3 mt-3 flex max-h-[min(60dvh,calc(100%-140px))] min-h-0 shrink-0 flex-col gap-0 border border-edge bg-background py-0 ring-0 lg:my-3 lg:mr-0 lg:max-h-none lg:w-[340px]">
      <div className="relative shrink-0 overflow-hidden border-b border-edge px-5 py-4">
        <CircuitMotif className="pointer-events-none absolute -top-5 -right-10 h-40 w-44 text-ink/25 opacity-60" />
        <div className="relative flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[10px] tracking-[0.13em] text-ink uppercase">
            <Trophy className="size-3.5 text-glow" />{t.challenge.label} {String(index + 1).padStart(2, '0')}
            <span className="text-ink/40">/</span>{String(CHALLENGES.length).padStart(2, '0')}
          </p>
          <Button size="icon-sm" variant="ghost" className="-mr-2 text-ink" aria-expanded={open} aria-controls={contentId}
            aria-label={open ? t.challenge.collapse : t.challenge.expand} onClick={() => setOpen(o => !o)}>
            {open ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
        <h2 className="relative mt-1 max-w-[245px] text-[19px] leading-snug tracking-[-0.03em] text-ink-hi">{text.title}</h2>
        {open && <p className="relative mt-2 text-[10px] tracking-[0.12em] text-glow uppercase">{t.challengesPage.levels[challenge.level]}</p>}
      </div>
      <div id={contentId} hidden={!open} className={cn('min-h-0 flex-1 flex-col', open && 'flex')}>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 text-[12px] leading-relaxed">
          <h3 className="challenge-caption">{t.challenge.goal}</h3>
          <p className="mt-2 text-[13px] leading-6 text-ink-hi/90">{text.goal}</p>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-edge bg-panel px-3 py-3">
              <dt className="challenge-caption">{t.challenge.inputs}</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">{challenge.inputs.map((n, i) => <span key={i} className="challenge-pin">{switchLabel(i) === n ? n : `${switchLabel(i)}=${n}`}</span>)}</dd>
            </div>
            <div className="rounded-lg border border-edge bg-panel px-3 py-3">
              <dt className="challenge-caption">{t.challenge.outputs}</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">{challenge.outputs.map((n, i) => <span key={i} className="challenge-pin">{ledLabel(i)}={n}</span>)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="challenge-caption">{t.challenge.allowed}</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">{challenge.allowed
                ? challenge.allowed.map(k => <Link key={k} href={`${href('/learn')}#${k}`} className="challenge-pin hover:border-ink hover:text-glow">{t.parts[k]}</Link>)
                : <span className="text-ink-hi">{t.challenge.anyParts}</span>}</dd>
            </div>
          </dl>
          <Link href={href('/learn')} className="mt-5 inline-flex items-center gap-2 text-[11px] text-ink hover:text-ink-hi"><BookOpenText className="size-3.5" />{t.learn.fullGuide}<ArrowRight className="size-3" /></Link>
          <div ref={hintRef} id={hintId} hidden={!hint} className="mt-4 rounded-lg border border-glow/20 bg-glow/5 p-3 text-ink-hi/90">
            <p className="mb-1.5 flex items-center gap-2 text-glow"><Lightbulb className="size-3.5" />{t.challenge.hint}</p><p>{text.hint}</p>
          </div>
          <div aria-live="polite" aria-atomic="true">
            {result && <div ref={resultRef} className="mt-5 border-t border-edge pt-4">
              <p className={cn('text-[13px] leading-6', result.ok ? 'text-glow' : 'text-ink-hi')}>
                {result.ok ? t.challenge.solved : result.rows.length ? t.challenge.notYet : t.challenge.review}
              </p>
              {result.issues.map((issue, i) => <p key={i} className="mt-2 text-destructive">{issueText(issue)}</p>)}
              {result.rows.length > 0 && <>
                <p className="mt-2 text-ink">{t.challenge.matches(result.rows.filter(r => r.ok).length, result.rows.length)}</p>
                <details className="mt-3 rounded-lg border border-edge bg-panel p-3" open={!result.ok}>
                  <summary className="cursor-pointer text-ink-hi">{t.learn.truthTable}</summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-center tabular-nums text-[11px]">
                      <caption className="sr-only">{t.challenge.expected} / {t.challenge.got}</caption>
                      <thead><tr className="border-b border-edge text-ink">
                        {challenge.inputs.map((_, i) => <th key={i} scope="col" className="px-2 pb-2 font-normal">{switchLabel(i)}</th>)}
                        {challenge.outputs.map((_, i) => <th key={`o${i}`} scope="col" className="border-l border-edge px-2 pb-2 font-normal text-ink-hi">{ledLabel(i)}</th>)}
                      </tr></thead>
                      <tbody>{result.rows.map((r, m) => <tr key={m} className={cn('border-b border-edge/40 last:border-0', !r.ok && 'bg-destructive/10')}>
                        {r.ins.map((v, j) => <td key={j} className="py-1.5 text-ink">{v}</td>)}
                        {r.got.map((v, j) => <td key={`o${j}`} className={cn('border-l border-edge px-2 py-1.5', v === r.expected[j] ? 'text-ink-hi' : 'text-destructive')}
                          aria-label={`${ledLabel(j)}: ${t.challenge.got} ${v}, ${t.challenge.expected} ${r.expected[j]}`}>
                          {v === r.expected[j] ? v : `${v}→${r.expected[j]}`}
                        </td>)}
                      </tr>)}</tbody>
                    </table>
                  </div>
                </details>
              </>}
              {result.ok && <div className="mt-4 flex flex-col gap-2">
                {next && <Button asChild size="sm"><a href={`${href('/board')}?challenge=${next.id}`}>{t.challenge.next}<ArrowRight /></a></Button>}
                <Link href={href('/challenges')} className="py-2 text-center text-ink hover:text-ink-hi">{t.challenge.all}</Link>
              </div>}
            </div>}
          </div>
        </div>
        <div className="shrink-0 border-t border-edge bg-panel px-4 py-3">
          <Button className="h-10 w-full text-[12px]" onClick={check}><CheckCircle2 />{t.challenge.check}<ArrowRight className="ml-auto" /></Button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button size="sm" variant="ghost" className="text-[11px] text-ink hover:text-ink-hi" aria-expanded={hint} aria-controls={hintId} onClick={() => setHint(h => !h)}><Lightbulb />{t.challenge.hint}</Button>
            <Button size="sm" variant="ghost" className="text-[11px] text-ink hover:text-ink-hi" onClick={() => { setHint(false); scrollRef.current?.scrollTo({ top: 0 }); onReset(); }}><RotateCcw />{t.challenge.reset}</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
