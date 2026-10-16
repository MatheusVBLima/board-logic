/** Decorative input/output matrix for the truth-table header. */
export function TruthTableMotif({ className = '' }: { className?: string }) {
  const rows = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]];

  return (
    <svg viewBox="0 0 180 140" fill="none" className={className} aria-hidden="true">
      <rect x="124" y="24" width="36" height="96" fill="var(--glow)" opacity=".07" />
      <g stroke="currentColor" strokeWidth="1">
        <rect x="52" y="24" width="108" height="96" rx="3" />
        <path d="M52 44h108M52 63h108M52 82h108M52 101h108M88 24v96M124 24v96" />
        <path d="M14 54h20l10-10h8M14 92h16l14-10h8" />
        <circle cx="14" cy="54" r="2.5" /><circle cx="14" cy="92" r="2.5" />
      </g>
      <g fontFamily="var(--mono)" fontSize="9" textAnchor="middle">
        {['A', 'B', 'Y'].map((label, column) => (
          <text key={label} x={70 + column * 36} y="38" fill={column === 2 ? 'var(--glow)' : 'currentColor'}>{label}</text>
        ))}
        {rows.map((row, index) => row.map((bit, column) => (
          <text key={`${index}-${column}`} x={70 + column * 36} y={57 + index * 19}
            fill={column === 2 ? 'var(--glow)' : 'currentColor'}>{bit}</text>
        )))}
      </g>
      <path d="M124 44v76M160 82h10l10-10" stroke="var(--glow)" strokeWidth="1.5" />
    </svg>
  );
}
