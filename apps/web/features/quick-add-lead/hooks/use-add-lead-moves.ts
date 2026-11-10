'use client';
import { useRouter } from 'next/navigation';
import { DOOR_PATH } from '../../shell';

/**
 * Quick add's ways out on the web — the platform adapter. The capture opens over the leads page at
 * its own address; once its sheet has left, the address becomes the leads page's in place: no
 * navigation and no remount, so the page behind and the toast the capture left both stay (Next
 * keeps its router in step with `history.replaceState`). A lead opens at its address.
 */
export function useAddLeadMoves() {
  const router = useRouter();
  return {
    stayOnLeads: () => window.history.replaceState(null, '', DOOR_PATH.leads),
    openLead: (address: string) => router.push(`/${address}`),
  };
}
