import type { GenerateVerdictWire } from '@heliogrid/contracts';
import { ApiError } from '../errors/errors';

/**
 * The three refusals a proposal's screen answers in place, each kept with what it was refused
 * over so the screen says why without asking again (`F4-16`).
 */

/** An act the proposal's status or its lead's state does not allow (`M06-45`), with domain's reason. */
export class ProposalActRefusedError extends ApiError {
  constructor(
    /** Domain's `ProposalActRefusal` — or one a newer server has learned. */
    readonly refusal: string,
    message: string,
    code: string,
  ) {
    super(422, message, { code });
    this.name = 'ProposalActRefusedError';
  }
}

/**
 * A commit the draft could not take (`M06-25`): another device changed it first, or the lead was
 * given to someone else. Nothing was overwritten; the typed value stays on screen.
 */
export class ProposalConflictError extends ApiError {
  constructor(
    /** `PROPOSAL_CHANGED_ELSEWHERE`, `PROPOSAL_LEAD_MOVED`, or one a newer server has learned. */
    code: string,
    /** The revision now stored — what a reload reads. */
    readonly revision: number,
    /** Who the lead moved to; `null` when the draft only changed elsewhere. */
    readonly movedTo: { readonly userId: string; readonly name: string } | null,
    message: string,
  ) {
    super(409, message, { code });
    this.name = 'ProposalConflictError';
  }
}

/** Generate stopped by its checklist (`M06-23`): every block, as the server found them. */
export class ProposalNotReadyError extends ApiError {
  constructor(
    readonly verdict: GenerateVerdictWire,
    message: string,
    code: string,
  ) {
    super(422, message, { code });
    this.name = 'ProposalNotReadyError';
  }
}
