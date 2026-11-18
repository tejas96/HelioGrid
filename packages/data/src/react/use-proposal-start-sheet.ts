'use client';
import type { ProposalRow } from '@heliogrid/contracts';
import { can, type ProposalStartMode, type Read } from '@heliogrid/domain';
import { useEffect, useRef, useState } from 'react';
import type { ProposalActFailure } from './proposal-cache';
import { type DesignActFailure, designActFailureOf, useCreateDesign } from './use-create-design';
import { useProposalStart } from './use-proposal-start';
import { useSession } from './use-session';

/** The ways a proposal starts on a lead (`M06-19`, `T-M05-001b`): four steps, all eleven, or a 3D design. */
export type LeadStartMode = ProposalStartMode;

/** Where a start leads: the builder on the draft, or the Site details of the design just made. */
export interface ProposalStartMoves {
  toBuilder(proposalId: string): void;
  toSiteDetails(designId: string): void;
}

/** The start sheet (`T-M06-001`): Quick, Full or With 3D design, or the same as a recent proposal. */
export interface ProposalStartSheetState {
  readonly open: boolean;
  readonly mode: LeadStartMode;
  setMode(mode: LeadStartMode): void;
  /** The reader may design (`studio.create_edit_designs`): *With 3D design* is offered. */
  readonly canDesign: boolean;
  /** The reader's latest proposals — *Same as {customer}*. */
  readonly recent: Read<readonly ProposalRow[]>;
  /** Starts as a copy of a recent proposal. */
  copy(proposalId: string): void;
  go(): void;
  close(): void;
  readonly starting: boolean;
  readonly failure: ProposalActFailure | null;
  /** *With 3D design* came back undone. */
  readonly designFailure: DesignActFailure | null;
}

export interface ProposalStartSheetHandle {
  readonly sheet: ProposalStartSheetState;
  /** Opens the sheet with the lead's own default picked. */
  show(): void;
}

/**
 * The one start sheet every way in opens (`T-M06-001`): on the lead and after *New proposal*'s
 * capture alike. Quick is picked first on a home lead and Full on any other, read from the lead the
 * server holds — never from a form that has already reset — and one tap changes it. *With 3D
 * design* makes the lead's next design and opens its Site details (`T-M05-001b`).
 */
export function useProposalStartSheet(
  leadId: string | null,
  homeLead: boolean,
  moves: ProposalStartMoves,
): ProposalStartSheetHandle {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<LeadStartMode | null>(null);
  const start = useProposalStart(open);
  const { user } = useSession();
  const canDesign = can(user?.tenant?.roles ?? [], 'studio.create_edit_designs');
  const latestMoves = useRef(moves);
  latestMoves.current = moves;
  const design = useCreateDesign((designId) => {
    setOpen(false);
    latestMoves.current.toSiteDetails(designId);
  });
  const clear = useRef(start.clear);
  clear.current = start.clear;
  const { started } = start;
  useEffect(() => {
    if (started === null) return;
    setOpen(false);
    clear.current();
    latestMoves.current.toBuilder(started.proposal.id);
  }, [started]);

  const home = homeLead ? 'quick' : 'full';
  const mode = picked === 'design' && !canDesign ? home : (picked ?? home);
  /* Each start shows its own failure: the other way's last one goes first. */
  const go = (copyOf: string | null) => {
    if (leadId === null) return;
    if (copyOf === null && mode === 'design') {
      start.clear();
      void design.run({ leadId, copyOf: null });
      return;
    }
    design.clear();
    start.start({ leadId, quickMode: mode === 'quick', copyOf });
  };
  const starting = start.starting || design.pending;
  return {
    show: () => {
      start.clear();
      design.clear();
      setPicked(null);
      setOpen(true);
    },
    sheet: {
      open,
      mode,
      setMode: (next) => {
        design.clear();
        setPicked(next);
      },
      canDesign,
      recent: start.recent,
      copy: (proposalId) => go(proposalId),
      go: () => go(null),
      close: () => {
        if (starting) return;
        setOpen(false);
      },
      starting,
      failure: start.failure,
      designFailure: designActFailureOf(design.failure),
    },
  };
}
