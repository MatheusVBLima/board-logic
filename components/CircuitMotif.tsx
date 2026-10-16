/** Decorative circuit traces, kept outside the reading area of challenge headings. */
export function CircuitMotif({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 140" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1">
        <path d="M0 30h36l18 18h26M0 60h24l20 20h36M12 112h28l18-18h22M112 48h22l24-24h22M112 70h38l18-18h12M112 94h18l22 22h28" />
        <rect x="80" y="36" width="32" height="70" rx="4" />
        <path d="M87 29v7m10-7v7m9-7v7M87 106v7m10-7v7m9-7v7M87 55h18v28H87z" />
        <circle cx="12" cy="112" r="3" /><circle cx="158" cy="24" r="3" />
      </g>
      <g stroke="var(--glow)" strokeWidth="1.5">
        <path d="M0 60h24l20 20h36M112 70h38l18-18h12" />
        <circle cx="24" cy="60" r="3" fill="var(--panel)" />
        <circle cx="150" cy="70" r="3" fill="var(--panel)" />
      </g>
    </svg>
  );
}
