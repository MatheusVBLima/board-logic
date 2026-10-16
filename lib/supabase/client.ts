'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Accounts only work once the Supabase URL and public key are set. */
export const authEnabled = !!(URL && KEY);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient | null {
  if (!authEnabled) return null;
  return (client ??= createBrowserClient(URL!, KEY!));
}

/** Signed-in user; `undefined` while the session is still being read. */
export function useUser() {
  const [user, setUser] = useState<User | null | undefined>(authEnabled ? undefined : null);
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return user;
}
