'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { DOOR_PATH } from '../../shell';

/** The web's own moves off Customer Merge: the router and the page's Esc. */
export interface CustomerMergeMoves {
  /** A lead at domain's address for it — *Open customer*. */
  openLead(address: string): void;
  toLeads(): void;
  /** Back where the person came from — the lead — else the leads list. Nothing changes. */
  cancel(): void;
}

export function useCustomerMergeMoves(): CustomerMergeMoves {
  const router = useRouter();
  return {
    openLead: (address) => router.push(`/${address}`),
    toLeads: () => router.push(DOOR_PATH.leads),
    cancel: () => (window.history.length > 1 ? router.back() : router.push(DOOR_PATH.leads)),
  };
}

/**
 * Esc cancels, as the page's Cancel does — and waits while a merge is out: the merge's answer
 * decides where the person goes, so no way out runs under it. `isMerging` reads the lock itself,
 * so an Esc in the same frame as the press finds it.
 */
export function useMergeEscape(active: boolean, isMerging: () => boolean, cancel: () => void) {
  const latest = useRef({ isMerging, cancel });
  latest.current = { isMerging, cancel };
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || latest.current.isMerging()) return;
      latest.current.cancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}
