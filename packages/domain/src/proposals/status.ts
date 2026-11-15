import { advanceStage } from '../crm/lifecycle';
import {
  isClosed,
  type LeadLifecycle,
  type LeadTransition,
  stateMove,
} from '../crm/lifecycle-model';
import type { LeadStage, TaskProvenance } from '../crm/vocabulary';
import { type Freshness, issueBlockedBy } from '../format/freshness';
import type { ProposalAnswer, ProposalStatus } from './vocabulary';

/**
 * The proposal status machine (`M06-45`, `M06-58`): status moves by ACTS, never by edits. Sharing
 * is a person's explicit mark; accept, negotiate and decline arrive from the customer's link, one
 * answer per version; a newer proposal shared on the lead supersedes an older one; a person, or
 * the lead closing, withdraws. Each act is a pure function over these facts — the api stamps who
 * and when and writes the answer in one transaction.
 */
export interface ProposalStatusFacts {
  readonly status: ProposalStatus;
  /** The newest generated version; `null` for a draft never generated. */
  readonly latestVersion: number | null;
  /** The version the customer's link serves — the latest SHARED one; `null` before the first share. */
  readonly sharedVersion: number | null;
  /** What the customer answered on the shared version; `null` while it is unanswered. */
  readonly answer: ProposalAnswer | null;
}

/** Why an act is refused — the api answers each with its error code, and nothing changes. */
export const PROPOSAL_ACT_REFUSALS = [
  /** No version exists: a draft has nothing to share or withdraw. */
  'not_generated',
  /** The lead is lost, disqualified or junk: reopen it first (`M06-45`). */
  'lead_closed',
  /** Withdrawn or superseded, and nothing newer was generated: nothing revives by itself. */
  'nothing_new_to_share',
  /** The customer's link serves no version of this proposal. */
  'not_shared',
  /** This version already took its one answer (`M06-45`, `F5-43`). */
  'already_answered',
  /** The answer names a version the link no longer serves (`F5-47`). */
  'version_not_current',
  /** The deal is already won: the link has no answer to give (`F5-47`). */
  'deal_won',
  /** Already withdrawn or superseded. */
  'not_active',
  /** A version exists: a generated proposal is withdrawn, never discarded. */
  'already_generated',
  /** The newest version's figures are no longer current (`F8-17`): generate again before sharing. */
  'figures_not_current',
] as const;
export type ProposalActRefusal = (typeof PROPOSAL_ACT_REFUSALS)[number];

interface LeadEffect {
  readonly lead: LeadLifecycle;
  readonly transitions: readonly LeadTransition[];
}

export type ProposalActResult =
  | {
      readonly kind: 'moved';
      readonly next: ProposalStatusFacts;
      /** The lead after the act and every move it made, in order; empty when nothing moved. */
      readonly lead: LeadEffect;
      /** The task the act raises on the lead's owner (`M06-55`); `null` for none. */
      readonly raisesTask: TaskProvenance | null;
      /** The open proposal follow-up closes: the customer answered (`M06-55`). */
      readonly closesFollowUp: boolean;
      /** A newer proposal went live: every other live proposal on the lead turns superseded. */
      readonly supersedesOthers: boolean;
    }
  | { readonly kind: 'refused'; readonly refusal: ProposalActRefusal };

function refused(refusal: ProposalActRefusal): ProposalActResult {
  return { kind: 'refused', refusal };
}

/**
 * What an act on a proposal does to its lead (`M06-45`, `T-F5-008`): a parked lead wakes, since the
 * act is activity on it, and the stage moves forward to `to` where it is not already there or past —
 * reaching it already is success, never a refusal, and the funnel never runs back.
 */
function leadAfter(lead: LeadLifecycle, to: LeadStage | null): LeadEffect {
  const parked = lead.state === 'snoozed' || lead.state === 'dormant';
  const woken: LeadEffect = parked
    ? {
        lead: { ...lead, state: null, wakeOn: null },
        transitions: stateMove(lead, null, 'automation'),
      }
    : { lead, transitions: [] };
  if (to === null) return woken;
  const advanced = advanceStage(woken.lead, to, 'automation');
  if (advanced.kind !== 'moved') return woken;
  return { lead: advanced.next, transitions: [...woken.transitions, ...advanced.transitions] };
}

/**
 * *Share* (`M06-53`, `M06-45`): the person's mark that the latest version went out. A newer version
 * than the link serves goes live — the status reads `shared`, answering opens on it, and the lead
 * reads `proposal` — and a version already live is simply shared again. Each share raises the
 * follow-up, so a second one moves its date — except a share again of a version the customer
 * already answered: nobody chases an answer (`M06-55`).
 */
export function shareProposal(
  proposal: ProposalStatusFacts,
  lead: LeadLifecycle,
): ProposalActResult {
  if (proposal.latestVersion === null) return refused('not_generated');
  if (isClosed(lead)) return refused('lead_closed');
  const goesLive = proposal.latestVersion !== proposal.sharedVersion;
  const dead = proposal.status === 'withdrawn' || proposal.status === 'superseded';
  if (!goesLive && dead) return refused('nothing_new_to_share');
  return {
    kind: 'moved',
    next: goesLive
      ? { ...proposal, status: 'shared', sharedVersion: proposal.latestVersion, answer: null }
      : proposal,
    lead: leadAfter(lead, 'proposal'),
    raisesTask: goesLive || proposal.answer === null ? 'proposal_shared' : null,
    closesFollowUp: false,
    supersedesOthers: goesLive,
  };
}

const AFTER_ANSWER: Readonly<
  Record<
    ProposalAnswer,
    {
      readonly status: ProposalStatus;
      readonly leadStage: LeadStage | null;
      readonly raisesTask: TaskProvenance | null;
      readonly closesFollowUp: boolean;
    }
  >
> = {
  /** An Accept never makes the lead won — a person's Mark won does (`M07-62`, `F5-49`). */
  accept: {
    status: 'accepted',
    leadStage: null,
    raisesTask: 'proposal_accepted',
    closesFollowUp: true,
  },
  /** The proposal stays shared while the rep prepares a new version (`F5-50`). */
  negotiate: {
    status: 'shared',
    leadStage: 'negotiating',
    raisesTask: null,
    closesFollowUp: false,
  },
  /** A decline never marks the lead lost: a person gives the reason (`F5-51`). */
  decline: {
    status: 'declined',
    leadStage: null,
    raisesTask: 'proposal_declined',
    closesFollowUp: true,
  },
};

/**
 * The customer's answer from their link (`M06-45`, `F5-43`, `F5-47`): on the version the link
 * serves, once. Refused on a version the link no longer serves, on one already answered, on a
 * deal already won or closed, and — an Accept alone, the one answer that commits money — on
 * figures no longer current (`F8-12`). A refusal records nothing.
 */
export function answerProposal(
  proposal: ProposalStatusFacts,
  lead: LeadLifecycle,
  answer: ProposalAnswer,
  version: number,
  /** The served version's figures as they stand now — what Share also reads. */
  figures: Freshness,
): ProposalActResult {
  if (proposal.sharedVersion === null || proposal.status === 'draft') return refused('not_shared');
  if (proposal.status === 'withdrawn' || proposal.status === 'superseded') {
    return refused('not_active');
  }
  if (isClosed(lead)) return refused('lead_closed');
  if (lead.stage === 'won') return refused('deal_won');
  if (version !== proposal.sharedVersion) return refused('version_not_current');
  if (proposal.answer !== null) return refused('already_answered');
  if (answer === 'accept' && issueBlockedBy(figures) !== null) {
    return refused('figures_not_current');
  }
  const after = AFTER_ANSWER[answer];
  return {
    kind: 'moved',
    next: { ...proposal, status: after.status, answer },
    lead: leadAfter(lead, after.leadStage),
    raisesTask: after.raisesTask,
    closesFollowUp: after.closesFollowUp,
    supersedesOthers: false,
  };
}

/** The statuses of a proposal the customer's link is serving: shared, and answered or not. */
export const PROPOSAL_STATUSES_ON_A_LINK = [
  'shared',
  'accepted',
  'declined',
] as const satisfies readonly ProposalStatus[];

function isLive(status: ProposalStatus): boolean {
  return (PROPOSAL_STATUSES_ON_A_LINK as readonly ProposalStatus[]).includes(status);
}

/**
 * What a proposal reads once a NEWER proposal on its lead is marked shared (`M06-45`): a live one
 * turns superseded; a draft, and one already withdrawn or superseded, stays as it is. A newer
 * proposal that only generated supersedes nothing.
 */
export function statusWhenSuperseded(status: ProposalStatus): ProposalStatus {
  return isLive(status) ? 'superseded' : status;
}

/**
 * What a proposal reads once its lead is marked lost, disqualified or junk (`M06-45`): a live one
 * is withdrawn, and its link shows the no-longer-active page. A draft stays a draft — no link was
 * ever minted for it.
 */
export function statusWhenLeadCloses(status: ProposalStatus): ProposalStatus {
  return isLive(status) ? 'withdrawn' : status;
}

/**
 * A proposal the lead is still working with — its draft, or one the customer's link serves — so two
 * of them is the collision a person settles (`M06-58`). A won deal has none: its project runs on
 * one proposal and the rest are history.
 */
export function liveOnItsLead(status: ProposalStatus, won: boolean): boolean {
  return !won && (status === 'draft' || isLive(status));
}

/**
 * A person withdraws their proposal (`M06-58`): any generated proposal that is not already
 * withdrawn or superseded, on a deal not yet won — a won deal's project runs on its proposal.
 * Nothing withdraws by itself, and the lead does not move.
 */
export function withdrawProposal(
  proposal: ProposalStatusFacts,
  lead: LeadLifecycle,
): ProposalActResult {
  if (proposal.latestVersion === null) return refused('not_generated');
  if (lead.stage === 'won') return refused('deal_won');
  if (proposal.status === 'withdrawn' || proposal.status === 'superseded') {
    return refused('not_active');
  }
  return {
    kind: 'moved',
    next: { ...proposal, status: 'withdrawn' },
    lead: { lead, transitions: [] },
    raisesTask: null,
    closesFollowUp: true,
    supersedesOthers: false,
  };
}

/** What Mark won may take from a proposal (`M07-62`, `T-M06-025`). */
export type WonBasis =
  /** The latest shared version was accepted: its payable and its payment plan stand, untyped. */
  | { readonly kind: 'accepted_version'; readonly version: number }
  /** An earlier version was accepted and a newer shared one is not answered: the typed value stands. */
  | {
      readonly kind: 'newer_version_unanswered';
      readonly acceptedVersion: number;
      readonly sharedVersion: number;
    }
  /** Nothing was accepted: the typed value and the company's default payment terms stand. */
  | { readonly kind: 'no_acceptance' };

/**
 * The basis Mark won opens on. Only an acceptance of the latest shared version pre-fills it; the
 * server reads this from the lead itself and refuses a value or a version that disagrees (`F4-04`).
 */
export function wonBasisOf(
  proposal: ProposalStatusFacts | null,
  earlierAcceptedVersion: number | null,
): WonBasis {
  if (proposal !== null && proposal.sharedVersion !== null) {
    if (proposal.status === 'accepted' && proposal.answer === 'accept') {
      return { kind: 'accepted_version', version: proposal.sharedVersion };
    }
    if (proposal.status === 'shared' && earlierAcceptedVersion !== null) {
      return {
        kind: 'newer_version_unanswered',
        acceptedVersion: earlierAcceptedVersion,
        sharedVersion: proposal.sharedVersion,
      };
    }
  }
  return { kind: 'no_acceptance' };
}
