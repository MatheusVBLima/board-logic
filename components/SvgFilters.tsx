/** Glow filters shared by every drawing on the page (board, dock, learning pages). */
export function SvgFilters() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <filter id="glow" filterUnits="userSpaceOnUse" x="-20000" y="-20000" width="60000" height="60000">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="soft" filterUnits="userSpaceOnUse" x="-20000" y="-20000" width="60000" height="60000">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* the same glows for shapes drawn inside a board-plane (cell unit) transform */}
        <filter id="soft-p" filterUnits="userSpaceOnUse" x="-1000" y="-1000" width="3000" height="3000">
          <feGaussianBlur stdDeviation="0.1" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="bloom-p" filterUnits="userSpaceOnUse" x="-1000" y="-1000" width="3000" height="3000">
          <feGaussianBlur stdDeviation="0.45" />
        </filter>
      </defs>
    </svg>
  );
}
