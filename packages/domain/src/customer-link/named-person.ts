import type { LinkPhase } from './vocabulary';

/**
 * The person a link names, in every phase (`F5-55`, `F5-73`, `T-F5-001`) — and the person every
 * task and notification a customer's act raises goes to, so the page and the work never name two
 * people. Active members only: someone who left never leaves a dead number on a customer's page.
 */
export interface NamedPersonCandidates {
  readonly phase: LinkPhase;
  /** The lead's current owner; `null` for an unassigned lead. */
  readonly leadOwnerId: string | null;
  /** The project's manager, once the deal is won. */
  readonly projectManagerId: string | null;
  /** Whoever minted the link. */
  readonly minterId: string | null;
  /** The company's EPC Owners, the recipient of last resort. */
  readonly epcOwnerIds: readonly string[];
  /** The members who are active now (`F2-20`: a member is deactivated, never deleted). */
  readonly activeIds: ReadonlySet<string>;
}

/**
 * Before Won the lead's owner, then whoever minted the link, then an EPC Owner. After Won the
 * project's manager first — a customer mid-install is served by the person they deal with, never
 * by the sales rep (`T-F5-002`) — then the same fallback. `null` only where no active member is
 * left to name, which a company with an owner never reaches.
 */
export function namedPersonOf(candidates: NamedPersonCandidates): string | null {
  const first =
    candidates.phase === 'proposal' ? candidates.leadOwnerId : candidates.projectManagerId;
  const chain = [first, candidates.minterId, ...candidates.epcOwnerIds];
  return chain.find((id) => id !== null && candidates.activeIds.has(id)) ?? null;
}
