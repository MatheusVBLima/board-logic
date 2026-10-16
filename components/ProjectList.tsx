'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FilePlus2, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/client';
import { PROJECT_LIMIT, deleteProject, listProjects, updateProject, type ProjectSummary } from '@/lib/projects';
import { authEnabled, useUser } from '@/lib/supabase/client';

export function ProjectList() {
  const { t, locale, href } = useI18n();
  const user = useUser();
  const [items, setItems] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');

  const load = useCallback(() => { listProjects().then(setItems).catch(() => setError(true)); }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  if (!authEnabled) return <p className="text-sm text-ink">{t.auth.notConfigured}</p>;
  if (user === null) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-ink">{t.projects.signInFirst}</p>
        <Button asChild><Link href={`${href('/login')}?next=${encodeURIComponent(href('/projects'))}`}>{t.nav.signIn}</Link></Button>
      </div>
    );
  }

  const fmt = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en', { dateStyle: 'medium', timeStyle: 'short' });
  const rename = async (id: string) => {
    const n = name.trim().slice(0, 80);
    setEditing(null);
    if (!n) return;
    setItems(xs => xs?.map(x => (x.id === id ? { ...x, name: n } : x)) ?? null);
    await updateProject(id, { name: n }).catch(() => setError(true));
  };
  const remove = async (p: ProjectSummary) => {
    if (!confirm(t.projects.confirmDelete(p.name))) return;
    setItems(xs => xs?.filter(x => x.id !== p.id) ?? null);
    await deleteProject(p.id).catch(() => { setError(true); load(); });
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl tracking-[0.06em] text-ink-hi">{t.projects.title}</h1>
          {items && <p className="mt-2 text-[12px] tracking-[0.12em] uppercase" style={{ color: 'var(--glow)' }}>{t.projects.count(items.length, PROJECT_LIMIT)}</p>}
        </div>
        <Button asChild variant="outline" className="border-edge text-ink-hi"><a href={href('/board')}><FilePlus2 />{t.projects.newOnBoard}</a></Button>
      </div>
      {error && <p className="mt-4 text-xs text-destructive">{t.auth.error}</p>}
      {items && !items.length && <p className="mt-8 text-sm text-ink">{t.projects.empty}</p>}
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {items?.map(p => (
          <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-edge bg-panel p-4">
            {editing === p.id ? (
              <form onSubmit={e => { e.preventDefault(); rename(p.id); }}>
                <Input autoFocus value={name} maxLength={80} onChange={e => setName(e.target.value)} onBlur={() => rename(p.id)} className="border-edge" />
              </form>
            ) : (
              <a href={`${href('/board')}?p=${p.id}`} className="text-[15px] tracking-[0.04em] text-ink-hi hover:underline">{p.name}</a>
            )}
            <p className="text-[11.5px] text-ink">{t.projects.parts(p.parts)} · {t.projects.updated} {fmt.format(new Date(p.updated_at))}</p>
            <div className="flex gap-1">
              <Button asChild size="sm"><a href={`${href('/board')}?p=${p.id}`}><FolderOpen />{t.projects.open}</a></Button>
              <Button size="sm" variant="ghost" className="text-ink hover:text-ink-hi" onClick={() => { setEditing(p.id); setName(p.name); }}><Pencil />{t.projects.rename}</Button>
              <Button size="sm" variant="ghost" className="text-ink hover:text-destructive" onClick={() => remove(p)}><Trash2 />{t.projects.delete}</Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
