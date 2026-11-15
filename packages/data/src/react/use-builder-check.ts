'use client';
import type { FormatPack, GenerateVerdict, ProposalStep } from '@heliogrid/domain';
import { useMemo, useState } from 'react';
import { generateVerdictOf } from '../proposals/verdict';
import type { MadeFileRead } from './use-made-file';
import {
  type GeneratedVersion,
  type GenerateFailure,
  useProposalGenerate,
} from './use-proposal-generate';
import { useProposalVersions } from './use-proposal-versions';

/** The check before Generate (`M06-22`, `M06-23`, `T-M06-022`, `T-M06-028`). */
export interface BuilderCheck {
  readonly open: boolean;
  /** A commit is still out: the checklist is about to move. */
  readonly checking: boolean;
  /** The checklist as the server last worked it out; `null` before the proposal is read. */
  readonly verdict: GenerateVerdict | null;
  readonly generating: boolean;
  readonly failure: GenerateFailure | null;
  /** Opens a failing step — in the full rail where Quick mode hid it — and closes the sheet. */
  fix(step: ProposalStep): void;
  /**
   * From version 2 on: what changed and why, as the person types it (`M06-42`); `null` for a first
   * version, which carries none. Generate is not sent while it is asked for and still empty.
   */
  readonly changeNote: { readonly text: string; type(text: string): void } | null;
  /** The note is asked for and empty: the sheet says so instead of sending a Generate the server refuses. */
  readonly noteMissing: boolean;
  /** Generate was asked for: from then on a step marks the fields its blocks name (`T-M06-022`). */
  readonly asked: boolean;
  /** *Generate*, or *Generate anyway* over warnings: pressing it is the below-cost confirmation. */
  generate(): void;
  close(): void;
}

/** The screen after Generate (`T-M06-022`). */
export interface BuilderReady {
  readonly made: GeneratedVersion;
  readonly pdf: MadeFileRead;
  share(): void;
  back(): void;
}

interface CheckDeps {
  readonly saving: boolean;
  readonly asksChangeNote: boolean;
  readonly formats: FormatPack;
  readonly goStep: (step: ProposalStep) => void;
  readonly toProposal: () => void;
  readonly toLead: () => void;
}

/** The check sheet and what follows it: one Generate, its refusals, and the version it made. */
export function useBuilderCheck(proposalId: string, deps: CheckDeps) {
  const generate = useProposalGenerate(proposalId);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [noteMissing, setNoteMissing] = useState(false);
  /* Once Generate was asked for, a step shows its own missing field where the person lands. */
  const [asked, setAsked] = useState(false);
  const made = generate.generated;
  const wire = generate.verdict;
  const verdict = useMemo(
    () => (wire === null ? null : generateVerdictOf(wire, deps.formats)),
    [wire, deps.formats],
  );
  const versions = useProposalVersions(proposalId, made?.version ?? null);
  const shut = () => {
    setOpen(false);
    generate.clear();
  };
  const check: BuilderCheck = {
    open: open && made === null,
    checking: deps.saving,
    verdict,
    generating: generate.generating,
    failure: generate.failure,
    fix: (step) => {
      shut();
      deps.goStep(step);
    },
    changeNote: deps.asksChangeNote
      ? {
          text: note,
          type: (text) => {
            setNote(text);
            if (text.trim() !== '') setNoteMissing(false);
          },
        }
      : null,
    noteMissing,
    asked,
    generate: () => {
      const changeNote = note.trim();
      if (deps.asksChangeNote && changeNote === '') {
        setNoteMissing(true);
        return;
      }
      generate.generate({
        changeNote: deps.asksChangeNote ? changeNote : null,
        belowCostConfirmed:
          verdict?.warnings.some((warning) => warning.check === 'below_cost') ?? false,
      });
    },
    close: shut,
  };
  const ready: BuilderReady | null =
    made === null ? null : { made, pdf: versions.pdf, share: deps.toProposal, back: deps.toLead };
  return {
    check,
    ready,
    blocks: wire?.blocks.length ?? 0,
    asked,
    openCheck: () => {
      generate.clear();
      setNoteMissing(false);
      setAsked(true);
      setOpen(true);
    },
  };
}
