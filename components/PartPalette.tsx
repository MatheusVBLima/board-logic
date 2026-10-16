'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDownToLine, ChevronUp, CircuitBoard, Cpu, GitBranch, Lightbulb, Plus, Trophy, X } from 'lucide-react';
import type { Kind } from '@/lib/circuit';
import { PART_GROUP, PART_GROUPS, type PartGroup } from '@/lib/palette';
import { useI18n } from '@/lib/i18n/client';
import { PartIcon } from '@/components/PartIcon';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

const GROUP_ICONS = { inputs: ArrowDownToLine, gates: CircuitBoard, routing: GitBranch, arithmetic: Plus, memory: Cpu, outputs: Lightbulb, challenge: Trophy };
type Category = PartGroup | 'challenge';

interface PartPaletteProps {
  kinds: Kind[];
  restricted: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onStartDrag: (kind: Kind, event: React.PointerEvent) => void;
  onAdd: (kind: Kind) => void;
  removing: boolean;
  children?: React.ReactNode;
}

/** Category disclosures on desktop; the same categories in a bottom drawer on mobile. */
export function PartPalette({ kinds, restricted, mobileOpen, onMobileOpenChange, onStartDrag, onAdd, removing, children }: PartPaletteProps) {
  const { t } = useI18n();
  const panelId = useId();
  const categories: Category[] = [
    ...(restricted ? ['challenge' as const] : []),
    ...PART_GROUPS.filter(group => kinds.some(kind => PART_GROUP[kind] === group)),
  ];
  const [selected, setSelected] = useState<Category>(restricted ? 'challenge' : 'inputs');
  const [desktopOpen, setDesktopOpen] = useState(false);
  const active = categories.includes(selected) ? selected : categories[0];
  const visible = active === 'challenge' ? kinds : kinds.filter(kind => PART_GROUP[kind] === active);
  const label = (category: Category) => category === 'challenge' ? t.challenge.allowed : t.board.partGroups[category];
  const swipeY = useRef<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const closeMobile = () => { if (media.matches) onMobileOpenChange(false); };
    media.addEventListener('change', closeMobile);
    return () => media.removeEventListener('change', closeMobile);
  }, [onMobileOpenChange]);

  const closeDesktop = () => { setDesktopOpen(false); triggerRef.current?.focus(); };
  const addWithKeyboard = (kind: Kind, mobile: boolean, event: React.MouseEvent) => {
    // Pointer insertion is handled by the simulator's drag-or-click gesture.
    if (event.detail !== 0) return;
    onAdd(kind);
    if (mobile) { onMobileOpenChange(false); mobileTriggerRef.current?.focus(); }
  };

  const categoryButtons = (mobile: boolean) => categories.map(category => {
    const Icon = GROUP_ICONS[category];
    const expanded = active === category && (mobile || desktopOpen);
    const count = category === 'challenge' ? kinds.length : kinds.filter(kind => PART_GROUP[kind] === category).length;
    return (
      <button key={category} type="button" data-part-category={category} data-vaul-no-drag
        aria-expanded={expanded} aria-controls={`${panelId}-${mobile ? 'mobile' : 'desktop'}`}
        className={cn('parts-category', expanded && 'parts-category-active')}
        onClick={event => {
          setSelected(category);
          if (!mobile) { triggerRef.current = event.currentTarget; setDesktopOpen(active !== category || !desktopOpen); }
        }}>
        <Icon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1">{label(category)}</span>
        <span className="parts-category-count">{count}</span>
      </button>
    );
  });

  const pieces = (mobile: boolean) => visible.map(kind => (
    <button key={kind} type="button" data-part-kind={kind} data-vaul-no-drag
      onPointerDown={event => onStartDrag(kind, event)} onClick={event => addWithKeyboard(kind, mobile, event)}
      className="parts-piece" style={{ touchAction: 'none' }}
      aria-label={t.learn.placeNamed(t.parts[kind])} title={t.board.dragToBoard(t.parts[kind])}>
      <PartIcon kind={kind} className="h-12 w-20 max-w-full" />
      <span>{t.parts[kind]}</span>
    </button>
  ));

  return (
    <>
      <div className="relative z-30 hidden shrink-0 md:block" onKeyDown={event => {
        if (event.key === 'Escape' && desktopOpen) { event.preventDefault(); event.stopPropagation(); closeDesktop(); }
      }}>
        {desktopOpen && <section id={`${panelId}-desktop`} aria-label={label(active)} data-part-panel data-dock
          className="parts-popover">
          <div className="flex items-start justify-between gap-4 border-b border-edge px-4 py-3">
            <div>
              <h2 className="text-[13px] text-ink-hi">{label(active)}</h2>
              <p className="mt-1 text-[11px] text-ink">{t.board.partsDesc}</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={t.board.closeParts} onClick={closeDesktop}><X /></Button>
          </div>
          <div className="parts-piece-grid">{pieces(false)}</div>
        </section>}
        <nav data-dock aria-label={t.board.partsCategories}
          className={cn('parts-categories rounded-[18px] border border-edge bg-panel p-2', removing && 'border-destructive bg-destructive/10')}>
          {categoryButtons(false)}
        </nav>
      </div>

      <button ref={mobileTriggerRef} type="button" data-dock aria-label={t.board.openParts} aria-haspopup="dialog" aria-expanded={mobileOpen}
        className={cn('flex shrink-0 flex-col items-center gap-1.5 rounded-[18px] border border-edge bg-panel px-4 pt-2 pb-2.5 text-[11px] tracking-[0.12em] text-ink uppercase md:hidden', removing && 'border-destructive bg-destructive/10 text-ink-hi')}
        style={{ touchAction: 'none' }} onClick={() => onMobileOpenChange(true)}
        onPointerDown={event => { swipeY.current = event.clientY; }}
        onPointerMove={event => { if (swipeY.current !== null && swipeY.current - event.clientY > 12) { swipeY.current = null; onMobileOpenChange(true); } }}
        onPointerUp={() => { swipeY.current = null; }} onPointerCancel={() => { swipeY.current = null; }}>
        <span className="h-1.5 w-12 rounded-full bg-muted" style={{ background: 'var(--line)' }} />
        <span className="flex items-center gap-2">{removing ? t.board.dropToRemove : t.board.partsPullUp}<ChevronUp className="size-3.5" /></span>
      </button>
      <Drawer open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <DrawerContent className="border-edge bg-panel font-mono">
          <DrawerHeader className="relative shrink-0 px-4 pt-3 pb-3">
            <DrawerTitle className="text-[14px] font-normal text-ink-hi">{t.board.partsTitle}</DrawerTitle>
            <DrawerDescription className="text-[11px] text-ink">{t.board.partsDesc}</DrawerDescription>
            <Button variant="ghost" size="icon-sm" className="absolute right-3 top-1" aria-label={t.board.closeParts} onClick={() => onMobileOpenChange(false)}><X /></Button>
          </DrawerHeader>
          <nav aria-label={t.board.partsCategories} className="parts-categories parts-categories-mobile shrink-0 border-y border-edge px-3 py-2">
            {categoryButtons(true)}
          </nav>
          <section id={`${panelId}-mobile`} aria-label={label(active)} data-part-panel className="min-h-0 overflow-y-auto overscroll-contain">
            <h2 className="px-5 pt-4 text-[12px] text-ink-hi">{label(active)}</h2>
            <div className="parts-piece-grid parts-piece-grid-mobile">{pieces(true)}</div>
          </section>
          {children}
        </DrawerContent>
      </Drawer>
    </>
  );
}
