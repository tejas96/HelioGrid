import { BILLING_STATES, SUBSCRIPTION_CAUSES } from '@heliogrid/domain';
import { z } from 'zod';

/**
 * The subscription's two vocabularies, built from `@heliogrid/domain` and never restated. The
 * migration mirrors each as a pgEnum (invariant `enum-parity`), so a value on one side alone is a
 * row the API can never return or a value the database rejects.
 */

/** The six billing states (`BM-33`, `M12-04`). */
export const billingStateSchema = z.enum(BILLING_STATES);

/** Why a subscription entered a state — the history's cause (`M12-04`). */
export const subscriptionCauseSchema = z.enum(SUBSCRIPTION_CAUSES);
