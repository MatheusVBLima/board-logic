'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { DEFAULT_GLOW } from '@/lib/circuit';
import { GLOW_STORAGE_KEY, isGlowColor } from '@/lib/glow';

const GlowContext = createContext<{ glow: string; setGlow: (color: string) => void } | null>(null);

function applyGlow(color: string) {
  document.documentElement.style.setProperty('--glow', color);
  document.documentElement.style.setProperty('--glow-hi', `color-mix(in srgb, ${color} 55%, white)`);
}

/** One persisted accent for the board, guide, challenges and account pages. */
export function GlowProvider({ children }: { children: React.ReactNode }) {
  const [glow, setGlowState] = useState(DEFAULT_GLOW);

  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem(GLOW_STORAGE_KEY);
      if (isGlowColor(saved)) { setGlowState(saved); applyGlow(saved); }
    } catch { /* Storage may be unavailable; keep the default accent. */ }
  }, []);

  const setGlow = useCallback((color: string) => {
    if (!isGlowColor(color)) return;
    setGlowState(color);
    applyGlow(color);
    try { localStorage.setItem(GLOW_STORAGE_KEY, color); } catch { /* Keep the in-memory preference. */ }
  }, []);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== GLOW_STORAGE_KEY && event.key !== null) return;
      const color = isGlowColor(event.newValue) ? event.newValue : DEFAULT_GLOW;
      setGlowState(color);
      applyGlow(color);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return <GlowContext.Provider value={{ glow, setGlow }}>{children}</GlowContext.Provider>;
}

export function useGlow() {
  const context = useContext(GlowContext);
  if (!context) throw new Error('useGlow must be used within GlowProvider');
  return context;
}
