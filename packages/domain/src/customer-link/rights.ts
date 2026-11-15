import { isClosedState } from '../crm/lifecycle-model';
import type { LeadLifecycleState } from '../crm/vocabulary';
import type { ProjectStage } from '../projects/stages';
import type { ProposalStatus } from '../proposals/vocabulary';
import {
  LINK_CEILINGS,
  LINK_SCOPES,
  type LinkFailureReason,
  type LinkPhase,
  type LinkScope,
  type LinkStatus,
} from './vocabulary';

/**
 * What a link may do at this moment (`F5-21`, `F5-19`). The link holds no state machine: its phase
 * is read from the deal on every open, and a token's rights are its scopes intersected with that
 * phase — so a respond scope grants nothing once the deal has moved past answering.
 */

/** Every scope a newly minted link carries (`F5-21`): the phase, never the token, narrows them. */
export const DEFAULT_LINK_SCOPES: readonly LinkScope[] = LINK_SCOPES;

/**
 * The phase, from the deal's own state (`F5-19`, `T-F5-006`): no project yet is the proposal; a
 * project is the progress, cancelled included — it keeps serving its honest state; a handed-over
 * project is the solar file, for life.
 */
export function linkPhaseOf(projectStage: ProjectStage | null): LinkPhase {
  if (projectStage === null) return 'proposal';
  return projectStage === 'handed_over' ? 'handover' : 'progress';
}

const SCOPES_IN_PHASE: Readonly<Record<LinkPhase, readonly LinkScope[]>> = {
  proposal: ['view_proposal', 'respond'],
  progress: ['view_progress'],
  handover: ['view_handover_pack'],
};

/** `F5-21` — a token's scopes ∩ the phase's, in `LINK_SCOPES` order. */
export function effectiveRights(
  scopes: readonly LinkScope[],
  phase: LinkPhase,
): readonly LinkScope[] {
  return LINK_SCOPES.filter(
    (scope) => scopes.includes(scope) && SCOPES_IN_PHASE[phase].includes(scope),
  );
}

/** What the server knows when a token is presented. Billing state and money owed are NOT here (`F5-23`, `F5-24`). */
export interface LinkFacts {
  /** `null` for a token the product never minted — it is answered exactly as a revoked one is. */
  readonly link: {
    readonly status: LinkStatus;
    readonly tokenRevoked: boolean;
    readonly scopes: readonly LinkScope[];
  } | null;
  /** Views of this link in the trailing window, this one included. */
  readonly viewsInWindow: number;
  readonly leadState: LeadLifecycleState | null;
  readonly projectStage: ProjectStage | null;
  /** The status of the proposal the link's lead shares, or `null` where none is shared. */
  readonly proposalStatus: ProposalStatus | null;
}

export type LinkServing =
  | { readonly kind: 'serves'; readonly phase: LinkPhase; readonly rights: readonly LinkScope[] }
  | { readonly kind: 'fails'; readonly reason: LinkFailureReason };

function fails(reason: LinkFailureReason): LinkServing {
  return { kind: 'fails', reason };
}

/**
 * What a presented token is served (`F5-25`, `F5-76`, `F5-78`, `T-F5-004`). A revoked, expired or
 * unknown token dies at once; a link over its ceiling says so; before Won, a closed lead's link
 * reads "no longer active", and an open lead with no live proposal — never shared, withdrawn by a
 * person, superseded — reads "no active proposal" until a version is shared again. After Won
 * the link always serves — whatever is owed, whatever the project's state.
 */
export function linkServing(facts: LinkFacts): LinkServing {
  const { link } = facts;
  if (link === null || link.tokenRevoked || link.status !== 'active') return fails('revoked');
  if (facts.viewsInWindow > LINK_CEILINGS.viewsPerHour) return fails('busy');
  const phase = linkPhaseOf(facts.projectStage);
  if (phase === 'proposal') {
    if (isClosedState(facts.leadState)) return fails('ended');
    const live =
      facts.proposalStatus === 'shared' ||
      facts.proposalStatus === 'accepted' ||
      facts.proposalStatus === 'declined';
    if (!live) return fails('none');
  }
  return { kind: 'serves', phase, rights: effectiveRights(link.scopes, phase) };
}

/** Whether one more respond act fits under the link's ceiling (`F5-78`); `sent` counts the trailing window. */
export function mayRespond(rights: readonly LinkScope[], sentInWindow: number): boolean {
  return rights.includes('respond') && sentInWindow < LINK_CEILINGS.respondsPerHour;
}
