'use client';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { QuickAddLead } from './components/QuickAddLead';
import { useAddLeadMoves } from './hooks/use-add-lead-moves';

/**
 * `/add-lead` (`SCR-M02-01`, `M02-06`): the primary add action opens quick add in one tap, over
 * the leads page drawn behind it. Once the capture's panel has gone — closed, or its lead saved —
 * the address becomes the leads page's in place, and the toast it left stays over that page. Each
 * arrival at this address — that page's *Add lead* included — opens a fresh capture.
 */
export function AddLeadScreen({
  referredBy,
  behind,
}: {
  /** The referring lead, from its *Add a referral* (`M02-16`); `null` for a plain capture. */
  referredBy: string | null;
  /** The leads page the capture stands over. */
  behind: ReactNode;
}) {
  const moves = useAddLeadMoves();
  /* A closed toast hands focus back to the page it spoke over. */
  const page = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={page} tabIndex={-1} className="hg-focus-target">
        {behind}
      </div>
      <QuickAddLead
        referredBy={referredBy}
        onLeft={moves.stayOnLeads}
        onOpenLead={moves.openLead}
        focusAfter={page}
      />
    </>
  );
}
