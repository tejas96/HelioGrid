/**
 * The soft-block contract (`BM-32`, `BM-35`, `BM-36`) — which capability groups work in which
 * billing phase. The product soft-blocks and never hard-blocks: no state stops a tenant reading,
 * exporting, opening a billing screen, or their own customer opening a link.
 *
 * This is the FLOOR, not the enforcement. `M12` implements it as the billing-state gate on every
 * mutation and may add detail; `BM-35` forbids it moving an `available` cell to a block. The
 * blocked-mutation experience — the typed error, the banner, the route to reactivate — is `M12`'s,
 * and nothing here describes it.
 *
 * No data is ever deleted for non-payment. Deletion happens only through the data-rights erasure
 * workflow (`F1-24`), so no clock and no state in this package may ever key on one.
 */

/**
 * The matrix's column axis — and it is NOT `BillingState` (`BM-33`). Six state names produce
 * seven columns, because `past_due` behaves as two: days 0–3 keep full function behind a banner,
 * days 4–7 pause the metered features. `cancelled` is qualified too — it runs out its paid period
 * behaving as `active`, and only afterwards reads as its own column.
 *
 * Which phase a tenant is in RIGHT NOW is `M12`'s to resolve, because it needs the tenant's clock
 * and their period end, and `F1-10` puts every such comparison on the tenant's clock — which this
 * package deliberately does not hold. This authors what each phase may do; `M12` says which one
 * you are in.
 */
export const BILLING_PHASES = [
  'trialing',
  'active',
  'past_due_full_function',
  'past_due_metered_paused',
  'halted',
  'expired',
  'cancelled_post_period',
] as const;

export type BillingPhase = (typeof BILLING_PHASES)[number];

/**
 * The matrix's row axis — capability GROUPS, phrased as acts (`BM-35`). Twelve rows for the
 * PRD's eleven: `BM-36` is its own P0 requirement and its whole point is that it must never be
 * forgotten, so the upload row is split rather than carrying the carve-out as a footnote beside
 * the matrix. `new_file_upload` is the PRD's row unchanged; `pending_field_photo_upload` is
 * `BM-36`, and it is `available` in every phase because a photograph already on a device is not
 * a new mutation from the UI.
 *
 * WHO inside the tenant may exercise a group is `F2`'s question and is untouched by billing
 * phase (`authz/`). This says whether the tenant may at all.
 */
export const BILLING_CAPABILITIES = [
  'read_and_search',
  'export',
  'customer_links',
  'billing_screens',
  'create_edit_records',
  'studio_design_edit',
  'sell_and_deliver',
  'new_file_upload',
  'pending_field_photo_upload',
  'voice_agent',
  'ai_roof_detections',
  'team_invites',
] as const;

export type BillingCapability = (typeof BILLING_CAPABILITIES)[number];

/**
 * One cell. Three values because the PRD's table has three marks, and `within_allowance` is a
 * real third: `✓*` is not a weaker `✓` — it is the capability working, bounded by the plan's or
 * trial's own allowance, which is book data resolved elsewhere. Collapsing it into `available`
 * would lose the only cell that says "this one costs per use".
 */
export type CapabilityStanding = 'available' | 'within_allowance' | 'paused';

const AVAILABLE: CapabilityStanding = 'available';
const WITHIN_ALLOWANCE: CapabilityStanding = 'within_allowance';
const PAUSED: CapabilityStanding = 'paused';

/**
 * `BM-35` — the state capability matrix, product law, every cell written out.
 *
 * The nested `Record` is the mechanism and not decoration: an eighth phase or a thirteenth
 * capability fails to compile until every cell is stated. There is no default, because an
 * unstated cell is exactly how a block silently widens.
 *
 * Rows are ordered as the PRD's table orders them, so an audit pairs them line for line
 * (`BM-35`'s "no ✓ has become a block"). Where this file and that table differ, the TABLE wins.
 */
export const STATE_CAPABILITY_MATRIX: Readonly<
  Record<BillingCapability, Readonly<Record<BillingPhase, CapabilityStanding>>>
> = {
  /* "Read everything, search, dashboards" — the first of `BM-32`'s teeth. */
  read_and_search: {
    trialing: AVAILABLE,
    active: AVAILABLE,
    past_due_full_function: AVAILABLE,
    past_due_metered_paused: AVAILABLE,
    halted: AVAILABLE,
    expired: AVAILABLE,
    cancelled_post_period: AVAILABLE,
  },
  /* "Export: CSV, data export, existing proposal PDFs, invoices" — a tenant can always leave. */
  export: {
    trialing: AVAILABLE,
    active: AVAILABLE,
    past_due_full_function: AVAILABLE,
    past_due_metered_paused: AVAILABLE,
    halted: AVAILABLE,
    expired: AVAILABLE,
    cancelled_post_period: AVAILABLE,
  },
  /* "Customer links (view AND respond) + progress pages" — the tenant's customer is never
     punished for the tenant's billing state, and never sees a billing message at all. */
  customer_links: {
    trialing: AVAILABLE,
    active: AVAILABLE,
    past_due_full_function: AVAILABLE,
    past_due_metered_paused: AVAILABLE,
    halted: AVAILABLE,
    expired: AVAILABLE,
    cancelled_post_period: AVAILABLE,
  },
  /* "Billing screens; pay / upgrade / reactivate" — reactivation is always one payment away. */
  billing_screens: {
    trialing: AVAILABLE,
    active: AVAILABLE,
    past_due_full_function: AVAILABLE,
    past_due_metered_paused: AVAILABLE,
    halted: AVAILABLE,
    expired: AVAILABLE,
    cancelled_post_period: AVAILABLE,
  },
  /* "Create/edit leads, tasks, activities, surveys" — core selling runs the whole grace window. */
  create_edit_records: {
    trialing: AVAILABLE,
    active: AVAILABLE,
    past_due_full_function: AVAILABLE,
    past_due_metered_paused: AVAILABLE,
    halted: PAUSED,
    expired: PAUSED,
    cancelled_post_period: PAUSED,
  },
  /* "Studio: create/edit designs" — opening one read-only is `read_and_search`, always on. */
  studio_design_edit: {
    trialing: AVAILABLE,
    active: AVAILABLE,
    past_due_full_function: AVAILABLE,
    past_due_metered_paused: AVAILABLE,
    halted: PAUSED,
    expired: PAUSED,
    cancelled_post_period: PAUSED,
  },
  /* "Generate/send proposals; mark won/lost; project updates". */
  sell_and_deliver: {
    trialing: AVAILABLE,
    active: AVAILABLE,
    past_due_full_function: AVAILABLE,
    past_due_metered_paused: AVAILABLE,
    halted: PAUSED,
    expired: PAUSED,
    cancelled_post_period: PAUSED,
  },
  /* "File/photo uploads" as the PRD writes it — a NEW upload started from the UI. */
  new_file_upload: {
    trialing: AVAILABLE,
    active: AVAILABLE,
    past_due_full_function: AVAILABLE,
    past_due_metered_paused: AVAILABLE,
    halted: PAUSED,
    expired: PAUSED,
    cancelled_post_period: PAUSED,
  },
  /* `BM-36` — a photograph already captured on a field device. The block is on new mutations
     from the UI, never on what the device is already holding (`F4-21`). */
  pending_field_photo_upload: {
    trialing: AVAILABLE,
    active: AVAILABLE,
    past_due_full_function: AVAILABLE,
    past_due_metered_paused: AVAILABLE,
    halted: AVAILABLE,
    expired: AVAILABLE,
    cancelled_post_period: AVAILABLE,
  },
  /* "Voice agent (outbound + AI inbound)" — metered, so it pauses from `past_due` day 4. */
  voice_agent: {
    trialing: WITHIN_ALLOWANCE,
    active: WITHIN_ALLOWANCE,
    past_due_full_function: WITHIN_ALLOWANCE,
    past_due_metered_paused: PAUSED,
    halted: PAUSED,
    expired: PAUSED,
    cancelled_post_period: PAUSED,
  },
  /* "AI roof detections" — manual outlining is never metered and never pauses (`BM-19`). */
  ai_roof_detections: {
    trialing: WITHIN_ALLOWANCE,
    active: WITHIN_ALLOWANCE,
    past_due_full_function: WITHIN_ALLOWANCE,
    past_due_metered_paused: PAUSED,
    halted: PAUSED,
    expired: PAUSED,
    cancelled_post_period: PAUSED,
  },
  /* "Team invites (OTP spend)" — absorbed cost, but real spend, so it pauses with the metered. */
  team_invites: {
    trialing: AVAILABLE,
    active: AVAILABLE,
    past_due_full_function: AVAILABLE,
    past_due_metered_paused: PAUSED,
    halted: PAUSED,
    expired: PAUSED,
    cancelled_post_period: PAUSED,
  },
};

/** `BM-35` — how this capability group stands in this phase. The one read of the matrix. */
export function capabilityStanding(
  capability: BillingCapability,
  phase: BillingPhase,
): CapabilityStanding {
  return STATE_CAPABILITY_MATRIX[capability][phase];
}

/**
 * `BM-32` — whether a phase can pause this capability at all. False for the rows that are the
 * law's teeth, and it is DERIVED from the matrix rather than listed a second time: a list would
 * let the promise and the table disagree, which is the one failure this contract cannot have.
 */
export function isAlwaysOn(capability: BillingCapability): boolean {
  return BILLING_PHASES.every((phase) => capabilityStanding(capability, phase) === AVAILABLE);
}
