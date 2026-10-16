'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n/client';
import { PROJECT_LIMIT } from '@/lib/projects';

/** Asks for a name before saving a circuit as a new project. `onSubmit` returns an error message or null. */
export function SaveDialog({ open, onOpenChange, used, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void; used: number; onSubmit: (name: string) => Promise<string | null>;
}) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setName(t.board.defaultName); setError(null); } }, [open, t]);
  const full = used >= PROJECT_LIMIT;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(await onSubmit(name.trim().slice(0, 80)));
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-edge bg-panel font-mono sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-[14px] font-normal tracking-[0.12em] text-ink-hi uppercase">{t.board.saveTitle}</DialogTitle>
            <DialogDescription className="text-xs text-ink">{t.board.saveDesc(used, PROJECT_LIMIT)}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name" className="text-xs text-ink">{t.board.projectName}</Label>
            <Input id="project-name" value={name} maxLength={80} autoFocus onChange={e => setName(e.target.value)} className="border-edge" />
          </div>
          {(error || full) && <p className="text-xs text-destructive">{error ?? t.board.limitReached(PROJECT_LIMIT)}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t.board.cancel}</Button>
            <Button type="submit" disabled={busy || full || !name.trim()}>{busy ? t.board.saving : t.board.save}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
