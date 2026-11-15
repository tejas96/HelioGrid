'use client';
import type { ProposalRow } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useEffect, useRef, useState } from 'react';
import type { ProposalActFailure } from './proposal-cache';
import { useProposalStart } from './use-proposal-start';

/** The two ways a proposal starts on a lead (`M06-19`): four steps, or all eleven. */
export type LeadStartMode = 'quick' | 'full';

/** The start sheet (`T-M06-001`): Quick or Full, or the same as a recent proposal. */
export interface ProposalStartSheetState {
  readonly open: boolean;
  readonly mode: LeadStartMode;
  setMode(mode: LeadStartMode): void;
  /** The reader's latest proposals — *Same as {customer}*. */
  readonly recent: Read<readonly ProposalRow[]>;
  /** Starts as a copy of a recent proposal. */
  copy(proposalId: string): void;
  go(): void;
  close(): void;
  readonly starting: boolean;
  readonly failure: ProposalActFailure | null;
}

export interface ProposalStartSheetHandle {
  readonly sheet: ProposalStartSheetState;
  /** Opens the sheet with the lead's own default picked. */
  show(): void;
}

/**
 * The one start sheet every way in opens (`T-M06-001`): on the lead and after *New proposal*'s
 * capture alike. Quick is picked first on a home lead and Full on any other, read from the lead the
 * server holds — never from a form that has already reset — and one tap changes it.
 */
export function useProposalStartSheet(
  leadId: string | null,
  homeLead: boolean,
  onStarted: (proposalId: string) => void,
): ProposalStartSheetHandle {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<LeadStartMode | null>(null);
  const start = useProposalStart(open);
  const latestStarted = useRef(onStarted);
  latestStarted.current = onStarted;
  const clear = useRef(start.clear);
  clear.current = start.clear;
  const { started } = start;
  useEffect(() => {
    if (started === null) return;
    setOpen(false);
    clear.current();
    latestStarted.current(started.proposal.id);
  }, [started]);

  const mode = picked ?? (homeLead ? 'quick' : 'full');
  const go = (copyOf: string | null) => {
    if (leadId !== null) start.start({ leadId, quickMode: mode === 'quick', copyOf });
  };
  return {
    show: () => {
      start.clear();
      setPicked(null);
      setOpen(true);
    },
    sheet: {
      open,
      mode,
      setMode: setPicked,
      recent: start.recent,
      copy: (proposalId) => go(proposalId),
      go: () => go(null),
      close: () => {
        if (start.starting) return;
        setOpen(false);
      },
      starting: start.starting,
      failure: start.failure,
    },
  };
}
