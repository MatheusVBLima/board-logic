'use client';

import { useEffect } from 'react';

/** Old share links pointed at "/#c=...": send them on to the board, keeping the circuit. */
export function SharedLinkRedirect({ to }: { to: string }) {
  useEffect(() => {
    if (/c=[\w-]+/.test(location.hash)) location.replace(to + location.hash);
  }, [to]);
  return null;
}
