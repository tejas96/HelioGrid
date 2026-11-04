import {
  CLIENT_UPGRADE_REQUIRED_STATUS,
  type ClientUpgradeRequired,
  clientUpgradeRequiredSchema,
  type EntitlementBlocked,
  entitlementBlockedEnvelope,
} from '@heliogrid/contracts';
import type { ApiFetcher } from '@ts-rest/core';

/**
 * Two refusals the transport reads before ts-rest sees them, since each carries more than the
 * envelope's four fields and a repository keeps only its code.
 */

type Answer = Awaited<ReturnType<ApiFetcher>>;

/**
 * What the transport tells the layer above when the api turns this build away as too old
 * (`F4-36`). REQUIRED on the mobile mode for the reason `SessionSignals` is: unwired, a too-old
 * phone would meet a bare error on every call and nothing would fail to compile. The web sends no
 * version and is never refused, so it declares none.
 */
export interface UpgradeSignals {
  onUpgradeRequired(upgrade: ClientUpgradeRequired['error']['upgrade']): void;
}

/**
 * What the transport tells the layer above when the billing gate refuses a save (`M12-21`). The
 * one denial the app draws reads it, so no screen handles a billing refusal itself. REQUIRED on
 * both session modes for the reason `SessionSignals` is.
 */
export interface BlockedSignals {
  onEntitlementBlocked(blocked: EntitlementBlocked): void;
}

/**
 * A 426 is read HERE, before ts-rest sees it: its `throwOnUnknownStatus` keeps only the envelope's
 * four fields and drops `upgrade`. A body that does not parse reports nothing, and the call fails
 * as any unknown status does.
 */
export function reportUpgradeRequired(upgrade: UpgradeSignals, answer: Answer): void {
  if (answer.status !== CLIENT_UPGRADE_REQUIRED_STATUS) return;
  const refusal = clientUpgradeRequiredSchema.safeParse(answer.body);
  if (refusal.success) upgrade.onUpgradeRequired(refusal.data.error.upgrade);
}

const FORBIDDEN = 403;

/**
 * A 403 is read HERE as well, for the same reason as the 426: the repositories keep only the
 * envelope's code, and the billing gate's refusal carries what blocked it. A plain `FORBIDDEN` does
 * not parse and reports nothing.
 */
export function reportEntitlementBlocked(blocked: BlockedSignals, answer: Answer): void {
  if (answer.status !== FORBIDDEN) return;
  const refusal = entitlementBlockedEnvelope.safeParse(answer.body);
  if (refusal.success) blocked.onEntitlementBlocked(refusal.data.error.blocked);
}
