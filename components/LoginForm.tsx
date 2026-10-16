'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/optics/card';
import { useI18n } from '@/lib/i18n/client';
import { authEnabled, supabase } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

export function LoginForm() {
  const { t, href, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get('next');
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : href('/projects');
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'reset' ? 'reset' : params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get('auth_error') ? t.auth.error : null);
  const [info, setInfo] = useState<string | null>(null);

  if (!authEnabled) return <p className="text-sm leading-relaxed text-ink">{t.auth.notConfigured}</p>;

  const callback = (to: string) => `${location.origin}/auth/callback?next=${encodeURIComponent(to)}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = supabase()!;
    setBusy(true); setError(null); setInfo(null);
    try {
      if (mode === 'signin') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) { setError(error.status === 400 ? t.auth.invalid : t.auth.error); return; }
        router.replace(next); router.refresh();
      } else if (mode === 'signup') {
        if (password.length < 6) { setError(t.auth.weakPassword); return; }
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: callback(next), data: { locale } } });
        if (error) { setError(error.message || t.auth.error); return; }
        if (data.session) { router.replace(next); router.refresh(); } else setInfo(t.auth.checkEmail);
      } else if (mode === 'forgot') {
        await sb.auth.resetPasswordForEmail(email, { redirectTo: callback(`${href('/login')}?mode=reset`) });
        setInfo(t.auth.resetSent);
      } else {
        if (password.length < 6) { setError(t.auth.weakPassword); return; }
        const { error } = await sb.auth.updateUser({ password });
        if (error) { setError(error.message || t.auth.error); return; }
        setInfo(t.auth.passwordUpdated);
        router.replace(href('/projects'));
      }
    } catch { setError(t.auth.error); } finally { setBusy(false); }
  };

  const title = mode === 'signup' ? t.auth.signUpTitle : mode === 'reset' ? t.auth.newPassword : mode === 'forgot' ? t.auth.forgot : t.auth.signInTitle;
  const desc = mode === 'signup' ? t.auth.signUpDesc : mode === 'signin' ? t.auth.signInDesc : null;
  const go = (m: Mode) => { setMode(m); setError(null); setInfo(null); };

  return (
    <Card decorations className="gap-5 pt-6">
    <form onSubmit={submit} className="contents">
      <CardHeader className="px-6">
        <CardTitle className="text-lg font-normal tracking-[0.06em] text-ink-hi"><h1>{title}</h1></CardTitle>
        {desc && <CardDescription className="text-[12.5px] leading-relaxed text-ink">{desc}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-6">
      {mode !== 'reset' && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-xs text-ink">{t.auth.email}</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="border-edge" />
        </div>
      )}
      {mode !== 'forgot' && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-xs text-ink">{mode === 'reset' ? t.auth.newPassword : t.auth.password}</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} className="border-edge" />
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {info && <p className="text-xs leading-relaxed" style={{ color: 'var(--glow)' }}>{info}</p>}
      <Button type="submit" disabled={busy}>
        {mode === 'signup' ? t.auth.submitSignUp : mode === 'signin' ? t.auth.submitSignIn : mode === 'reset' ? t.auth.setPassword : t.auth.forgot}
      </Button>
      </CardContent>
      <CardFooter background className="flex-col items-start gap-1 text-[12px] text-ink">
        {mode === 'signin' && <>
          <span>{t.auth.noAccount} <button type="button" className="text-ink-hi underline underline-offset-4" onClick={() => go('signup')}>{t.auth.submitSignUp}</button></span>
          <button type="button" className="self-start text-ink underline underline-offset-4 hover:text-ink-hi" onClick={() => go('forgot')}>{t.auth.forgot}</button>
        </>}
        {(mode === 'signup' || mode === 'forgot') && (
          <span>{t.auth.haveAccount} <button type="button" className="text-ink-hi underline underline-offset-4" onClick={() => go('signin')}>{t.auth.submitSignIn}</button></span>
        )}
      </CardFooter>
    </form>
    </Card>
  );
}
