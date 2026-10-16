import { cn } from '@/lib/utils';

/** The site mark, drawn the same as the favicon (app/icon.svg): a wire running into a lit LED. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-5 shrink-0', className)}>
      <defs>
        <radialGradient id="logo-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff7a1a" stopOpacity=".55" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="#0c0d0e" stroke="#2b2e30" />
      <path d="M6 23 H12.5 V11 H19" fill="none" stroke="#ff7a1a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="23" r="2.1" fill="#ffb070" />
      <circle cx="22.5" cy="11" r="8.5" fill="url(#logo-glow)" />
      <circle cx="22.5" cy="11" r="4" fill="#ffb070" stroke="#ff7a1a" strokeWidth="1.2" />
    </svg>
  );
}
