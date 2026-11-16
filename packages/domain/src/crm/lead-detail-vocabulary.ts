/**
 * Lead Detail's closed sets (`SCR-M02-04`, `M02-32`): the actions, the sections and the state acts
 * in the order they stand, and why a number is not dialled.
 */

/** The five actions on every lead (`M02-32`), in the order they stand: Call first. */
export const LEAD_DETAIL_ACTIONS = ['call', 'message', 'log', 'visit', 'design'] as const;
export type LeadDetailAction = (typeof LEAD_DETAIL_ACTIONS)[number];

/** The six sections (`M02-32`), in the order their tabs stand. */
export const LEAD_DETAIL_SECTIONS = [
  'timeline',
  'site',
  'designs',
  'proposals',
  'tasks',
  'files',
] as const;
export type LeadDetailSection = (typeof LEAD_DETAIL_SECTIONS)[number];

/** The R9 acts a person takes on a lead (`M02-51`…`M02-56`); Mark qualified sits on the qualify card. */
export const LEAD_STATE_ACTS = ['snooze', 'wake', 'disqualify', 'junk', 'reopen'] as const;
export type LeadStateAct = (typeof LEAD_STATE_ACTS)[number];

/** Why no call is offered for the customer's number (`M02-44`). */
export type DialBlock = 'do_not_call' | 'wrong_number';

export type DialOffer =
  | { readonly kind: 'dial'; readonly phoneE164: string }
  | { readonly kind: 'blocked'; readonly reason: DialBlock };
