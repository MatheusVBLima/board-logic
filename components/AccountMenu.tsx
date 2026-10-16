'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Check, FolderOpen, Languages, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n, useSwitchLocale } from '@/lib/i18n/client';
import { LOCALES, LOCALE_NAMES } from '@/lib/i18n/config';
import { authEnabled, supabase, useUser } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/** Language switch shown next to the account controls. */
function LanguageMenu() {
  const { t, locale } = useI18n();
  const switchTo = useSwitchLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-ink hover:text-ink-hi" aria-label={t.nav.language}>
          <Languages />{locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40 font-mono">
        {LOCALES.map(l => (
          <DropdownMenuItem key={l} onSelect={() => { location.href = switchTo(l); }}>
            <span className="flex-1">{LOCALE_NAMES[l]}</span>{l === locale && <Check />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Language switch plus the account control shared by the board and the other pages: a Sign in button
 * when signed out, a menu with projects and Sign out when signed in.
 */
export function AccountMenu({ className }: { className?: string }) {
  const { t, href } = useI18n();
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const signOut = async () => { await supabase()?.auth.signOut(); router.refresh(); };
  const onLogin = /\/login\/?$/.test(pathname);

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <LanguageMenu />
      {authEnabled && !user && !onLogin && (
        <Button size="sm" onClick={() => router.push(`${href('/login')}?next=${encodeURIComponent(location.pathname + location.search)}`)}>
          <LogIn />{t.nav.signIn}
        </Button>
      )}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-ink hover:text-ink-hi" aria-label={t.nav.account}>
              <User style={{ color: 'var(--glow)' }} />
              <span className="max-w-[9rem] truncate max-sm:hidden">{user.email?.split('@')[0]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52 font-mono">
            <DropdownMenuLabel className="truncate text-xs text-ink">{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href={href('/projects')}><FolderOpen />{t.nav.projects}</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut}><LogOut />{t.nav.signOut}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
