'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, FolderOpen, GraduationCap, Languages, LogIn, LogOut, Trophy, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n, useSwitchLocale } from '@/lib/i18n/client';
import { LOCALES, LOCALE_NAMES } from '@/lib/i18n/config';
import { authEnabled, supabase, useUser } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/** Account + language menu shared by the board and the other pages. */
export function AccountMenu({ className, showLearn = false }: { className?: string; showLearn?: boolean }) {
  const { t, locale, href } = useI18n();
  const switchTo = useSwitchLocale();
  const user = useUser();
  const router = useRouter();
  const signOut = async () => { await supabase()?.auth.signOut(); router.refresh(); };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('text-ink hover:text-ink-hi', className)} aria-label={t.nav.account}>
          <User style={user ? { color: 'var(--glow)' } : undefined} />
          <span className="max-w-[9rem] truncate max-sm:hidden">{user ? user.email?.split('@')[0] : authEnabled ? t.nav.signIn : locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52 font-mono">
        {user && <DropdownMenuLabel className="truncate text-xs text-ink">{user.email}</DropdownMenuLabel>}
        {user && <DropdownMenuSeparator />}
        {authEnabled && (user
          ? <DropdownMenuItem asChild><Link href={href('/projects')}><FolderOpen />{t.nav.projects}</Link></DropdownMenuItem>
          : <DropdownMenuItem onSelect={() => router.push(`${href('/login')}?next=${encodeURIComponent(location.pathname + location.search)}`)}><LogIn />{t.nav.signIn}</DropdownMenuItem>)}
        {showLearn && <DropdownMenuItem asChild><Link href={href('/learn')}><GraduationCap />{t.nav.guide}</Link></DropdownMenuItem>}
        <DropdownMenuItem asChild><Link href={href('/challenges')}><Trophy />{t.nav.challenges}</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-ink"><Languages className="size-3.5" />{t.nav.language}</DropdownMenuLabel>
        {LOCALES.map(l => (
          <DropdownMenuItem key={l} onSelect={() => { location.href = switchTo(l); }}>
            <span className="flex-1">{LOCALE_NAMES[l]}</span>{l === locale && <Check />}
          </DropdownMenuItem>
        ))}
        {user && <DropdownMenuSeparator />}
        {user && <DropdownMenuItem onSelect={signOut}><LogOut />{t.nav.signOut}</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
