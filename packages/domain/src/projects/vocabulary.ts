/**
 * `M08`'s closed, market-neutral sets. Readonly tuples, so contracts derives each `z.enum` and the
 * migration mirrors each pgEnum from this one list (invariant `enum-parity`). What a user reads for
 * a party or a reason is the market pack's (`format/vocabulary.ts`).
 */

/**
 * Who a project waits on (`M08-20`): exactly four, `company` the tenant itself. The order is the
 * working view's — the company's own waits first (`M08-23`, `PS-34`).
 */
export const BLOCKER_PARTIES = ['company', 'customer', 'utility', 'material'] as const;
export type BlockerParty = (typeof BLOCKER_PARTIES)[number];

/**
 * Why a project waits, as a class the customer link can say in any language (`M08-29`): closed
 * and market-neutral; the person's own words are the internal note beside it,
 * never published (`M08-25`). `other` fits every party.
 */
export const BLOCKER_REASONS = [
  'crew_availability',
  'internal_paperwork',
  'site_access',
  'customer_documents',
  'customer_payment',
  'customer_decision',
  'utility_approval',
  'utility_inspection',
  'utility_meter',
  'incentive_rejected',
  'incentive_payout',
  'material_supply',
  'material_transport',
  'other',
] as const;
export type BlockerReason = (typeof BLOCKER_REASONS)[number];

/** The reasons each party offers, in the order a person is shown them. */
export const BLOCKER_REASONS_BY_PARTY: Readonly<Record<BlockerParty, readonly BlockerReason[]>> = {
  company: ['crew_availability', 'internal_paperwork', 'other'],
  customer: ['site_access', 'customer_documents', 'customer_payment', 'customer_decision', 'other'],
  utility: [
    'utility_approval',
    'utility_inspection',
    'utility_meter',
    'incentive_rejected',
    'incentive_payout',
    'other',
  ],
  material: ['material_supply', 'material_transport', 'other'],
};

/** Whether a reason belongs to the party it is recorded against. */
export function isReasonOfParty(party: BlockerParty, reason: BlockerReason): boolean {
  return BLOCKER_REASONS_BY_PARTY[party].includes(reason);
}

/**
 * What moved a project (`M08-14`, owner ruling 2026-11-10): a person's tap, a proof landing (an
 * install tick, a document), the handover, a cancellation, or a person's undo of their own move.
 */
export const PROJECT_MOVE_CAUSES = ['person', 'proof', 'handover', 'cancel', 'undo'] as const;
export type ProjectMoveCause = (typeof PROJECT_MOVE_CAUSES)[number];

/**
 * A checklist row's one state (`M08-31` as ruled 2026-11-10): waiting, done, or not needed with a
 * reason. No verify step — uploading the file is the doing.
 */
export const DOCUMENT_STATES = ['pending', 'done', 'not_needed'] as const;
export type DocumentState = (typeof DOCUMENT_STATES)[number];

/** How a wait ended: a person said it was over, or a forward move closed it (ruling 2026-11-10). */
export const BLOCKER_CLEARS = ['person', 'stage_move', 'cancel'] as const;
export type BlockerClear = (typeof BLOCKER_CLEARS)[number];

/** Why a project act is refused — the api answers each with its error code. */
export const PROJECT_ACT_REFUSALS = [
  'project_closed',
  'not_next_stage',
  'needs_handover',
  'nothing_behind',
  'no_proof_ahead',
  'already_moved',
  'not_undoable',
  'documents_pending',
  'wait_open',
  'no_open_wait',
  'reason_not_of_party',
  'date_in_future',
  'reason_needed',
  'step_ticked',
  'step_not_ticked',
  'file_not_ready',
  'row_unknown',
  'step_unknown',
  'not_a_manager',
  'not_on_crew',
  'needs_crew',
  'date_in_past',
  'date_before_stage',
  'file_unknown',
  'made_at_handover',
] as const;
export type ProjectActRefusal = (typeof PROJECT_ACT_REFUSALS)[number];

/**
 * Why a project is cancelled (`M08-51`; the picked design, 2026-11-11): one tap per reason, and
 * `something_else` carries the person's own words — the one reason a note is needed for.
 */
export const CANCEL_REASONS = [
  'customer_backed_out',
  'won_by_mistake',
  'site_not_suitable',
  'lost_to_another_company',
  'something_else',
] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];

/**
 * Where a file sits on a project (rulings 2026-11-10): a checklist row's document, an install
 * step's photo, or one of the other files a person names — which never block handover.
 */
export const PROJECT_FILE_SLOTS = ['document', 'step', 'other'] as const;
export type ProjectFileSlot = (typeof PROJECT_FILE_SLOTS)[number];
