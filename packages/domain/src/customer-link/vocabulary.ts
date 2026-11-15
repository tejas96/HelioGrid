/**
 * The customer link's closed word lists (`F5`). Each is a readonly tuple, so contracts derives its
 * `z.enum` and each migration mirrors its pgEnum from this one list.
 */

/**
 * What a token may grant, fixed at product level (`F5-21`). No write scope exists for a survey, a
 * design or a figure, and none may be added (`F5-56`).
 */
export const LINK_SCOPES = [
  'view_proposal',
  'respond',
  'view_progress',
  'view_handover_pack',
] as const;
export type LinkScope = (typeof LINK_SCOPES)[number];

/** One link, its whole life (`F5-19`): the proposal, then the progress, then the solar file. */
export const LINK_PHASES = ['proposal', 'progress', 'handover'] as const;
export type LinkPhase = (typeof LINK_PHASES)[number];

/**
 * A named link's own state (`F5-22`, `F5-76`). `expired` survives only for a token minted under the
 * old twelve-month horizon; no link minted here can reach it.
 */
export const LINK_STATUSES = ['active', 'revoked', 'expired'] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

/** The five events a link stores, append-only (`F5-27`, `T-F5-007`). Analytics ride another stream. */
export const LINK_EVENT_TYPES = [
  'opened',
  'section_viewed',
  'accepted',
  'negotiate_requested',
  'declined',
] as const;
export type LinkEventType = (typeof LINK_EVENT_TYPES)[number];

/** All an open records beside its link and its moment (`F5-29`): never an address, never a person. */
export const DEVICE_CLASSES = ['phone', 'tablet', 'desktop', 'other'] as const;
export type DeviceClass = (typeof DEVICE_CLASSES)[number];

/** The parts of the customer's page a view is timed on (`F5-28`, `M06-54`): "looked longest at the price". */
export const LINK_SECTIONS = [
  'price',
  'savings',
  'generation',
  'parts',
  'payment',
  'timeline',
  'terms',
] as const;
export type LinkSection = (typeof LINK_SECTIONS)[number];

/**
 * Why a link shows the honest failure page (`F5-25`, `T-F5-004`): the proposal is no longer active,
 * the link was turned off, too many visits, or no proposal is active yet. Each names a person and a
 * number, and none shows customer data.
 */
export const LINK_FAILURE_REASONS = ['ended', 'revoked', 'busy', 'none'] as const;
export type LinkFailureReason = (typeof LINK_FAILURE_REASONS)[number];

/** A question's two states, and no third (`F5-53`): the reply is a call the page never claims. */
export const QUESTION_STATES = ['submitted', 'received'] as const;
export type QuestionState = (typeof QUESTION_STATES)[number];

/** Whether the acceptance challenge ran (`F5-44`, `F5-46`). It is off for every company in V1. */
export const ACCEPTANCE_CHALLENGES = ['off', 'satisfied'] as const;
export type AcceptanceChallenge = (typeof ACCEPTANCE_CHALLENGES)[number];

/** What a customer may send from the link (`F5-56`): the three answers, a question, a call request. */
export const LINK_RESPOND_ACTS = [
  'accept',
  'negotiate',
  'decline',
  'question',
  'call_request',
] as const;
export type LinkRespondAct = (typeof LINK_RESPOND_ACTS)[number];

/**
 * The ceilings on the public surface (`F5-78`): per link, sixty views and five respond acts in any
 * trailing hour — set so a family reading a proposal across an evening never meets one — then each
 * network address's share of the public routes, with the wait it is given once met, and a backstop
 * over every public route together.
 */
export const LINK_CEILINGS = {
  viewsPerHour: 60,
  respondsPerHour: 5,
  /** The trailing window both per-link counts are taken over, minutes. */
  windowMinutes: 60,
  /**
   * One network address's share of the public routes, per minute: what keeps one caller from
   * shutting out every other. Generous, since a mobile carrier puts many customers behind one address.
   */
  publicRequestsPerAddressPerMinute: 300,
  /** Every public route together, per minute, across all links: a backstop far above one address's share. */
  publicRequestsPerMinute: 30_000,
  /** How long an address over its share is told to wait, seconds. */
  publicBackoffSeconds: 60,
} as const;

/** The longest a question or a change request runs, characters. */
export const LINK_TEXT_LIMIT = 1000;
