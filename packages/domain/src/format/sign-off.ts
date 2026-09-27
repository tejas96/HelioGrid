/**
 * Whether a design is structurally signed off (`F8-26`, `F8-27`). The product never decides
 * adequacy: it reads the decisions people recorded and says whether one of them approved the
 * design that exists now. Decided by comparison, never stored as a flag — the rule `freshnessOf`
 * applies to a design pin — so an edit un-approves and an undo to the reviewed version does not.
 */

/** The two decisions a sign-off holder records; the log is append-only. */
export const SIGN_OFF_DECISIONS = ['approved', 'returned'] as const;
export type SignOffDecision = (typeof SIGN_OFF_DECISIONS)[number];

/** One recorded decision: what was decided, by whom, when, on which version of the design. */
export interface SignOffRecord {
  readonly decision: SignOffDecision;
  /** The member who decided. */
  readonly decidedBy: string;
  /** Epoch milliseconds. */
  readonly decidedAt: number;
  /** The design fingerprint reviewed — the string `InputPins.design` pins. */
  readonly designVersion: string;
}

type SignOffState = {
  /** The design version this answer was read against; the gate compares it with the version now. */
  readonly readAgainst: string;
} & (
  | { readonly kind: 'awaiting' }
  | { readonly kind: 'approved' | 'outdated' | 'returned'; readonly decision: SignOffRecord }
);

declare const SIGN_OFF: unique symbol;

/**
 * Branded, so nothing outside this file can write `approved` — the product never implies a
 * decision that no one made (`F8-26`). Kept on one line: the brand registry reads this shape.
 */
export type SignOff = SignOffState & { readonly [SIGN_OFF]: 'sign-off' };

function minted(state: SignOffState): SignOff {
  return state as SignOff;
}

/**
 * The design's sign-off as the log stands. The latest instant decides, and the answer never
 * depends on the order the log was read in: when decisions share that instant, a return outranks
 * an approval, and an approval counts only if every approval there describes the design. A
 * decision with no readable time cannot be placed, so it is read as the latest and never approves.
 * An approval counts only while it names its approver and the version it reviewed is the one that
 * exists now; otherwise it no longer describes the design (`F8-27`).
 */
export function signOffOf(log: readonly SignOffRecord[], currentVersion: string): SignOff {
  const latestAt = log.reduce(
    (latest, entry) => Math.max(latest, instantOf(entry)),
    Number.NEGATIVE_INFINITY,
  );
  const latest = log.filter((entry) => instantOf(entry) === latestAt);
  const [first] = latest;
  if (first === undefined) return minted({ kind: 'awaiting', readAgainst: currentVersion });
  const giveBack = latest.find((entry) => entry.decision === 'returned');
  if (giveBack !== undefined) {
    return minted({ kind: 'returned', decision: giveBack, readAgainst: currentVersion });
  }
  const lapsed = latest.find((approval) => !approvesVersion(approval, currentVersion));
  return lapsed === undefined
    ? minted({ kind: 'approved', decision: first, readAgainst: currentVersion })
    : minted({ kind: 'outdated', decision: lapsed, readAgainst: currentVersion });
}

/**
 * Whether a customer-facing surface may show the design as it is now (`F8-29`) — only when its
 * sign-off was read against this very version, so an answer kept from before an edit cannot open
 * the gate.
 */
export function mayReachCustomer(signOff: SignOff, currentVersion: string): boolean {
  return (
    signOff.kind === 'approved' && isNamed(currentVersion) && signOff.readAgainst === currentVersion
  );
}

/** A decision's instant; one that cannot be read is placed last, where it can never approve. */
function instantOf(entry: SignOffRecord): number {
  return Number.isFinite(entry.decidedAt) ? entry.decidedAt : Number.POSITIVE_INFINITY;
}

function approvesVersion(approval: SignOffRecord, currentVersion: string): boolean {
  return (
    Number.isFinite(approval.decidedAt) &&
    isNamed(approval.decidedBy) &&
    isNamed(approval.designVersion) &&
    approval.designVersion === currentVersion
  );
}

/** Not empty and not blank — a blank approver or fingerprint names nothing. */
function isNamed(value: string): boolean {
  return value.trim() !== '';
}
