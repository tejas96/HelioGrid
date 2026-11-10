'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { DOOR_PATH } from '../../shell';

/**
 * The web's half of the phone's add action reopening quick add in place: the page stays mounted
 * once its capture has closed (the address is the leads page's by then — `usePathname` follows
 * `history.replaceState`), so an *Add lead* pressed on that page comes back to this address with
 * the last capture still closed. Each return here opens a fresh one.
 */
export function useReopenOnArrival(reopen: () => void): void {
  const pathname = usePathname();
  const latest = useRef(reopen);
  latest.current = reopen;
  const was = useRef(pathname);
  useEffect(() => {
    if (was.current !== pathname && pathname === DOOR_PATH.add_lead) latest.current();
    was.current = pathname;
  }, [pathname]);
}
