export const GLOW_STORAGE_KEY = 'board-logica:v1:glow';

export function isGlowColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

// Restore before the page is painted, including on direct visits to the guide.
export const GLOW_INIT_SCRIPT = `try {
  const color = localStorage.getItem(${JSON.stringify(GLOW_STORAGE_KEY)});
  if (/^#[0-9a-f]{6}$/i.test(color || '')) {
    document.documentElement.style.setProperty('--glow', color);
    document.documentElement.style.setProperty('--glow-hi', 'color-mix(in srgb, ' + color + ' 55%, white)');
  }
} catch {}`;
