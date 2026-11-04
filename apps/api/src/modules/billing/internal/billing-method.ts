import type { BillingHome } from '@heliogrid/contracts';
import { type BillingStandingFacts, type MarketPack, tierBand } from '@heliogrid/domain';

/**
 * A paid row's method — a mandate or a payment link (frame 24: `Payment link · yearly`) — is live
 * while it collects and ended once the row is dead (decision 6a); a trial has none.
 */
function methodStanding(facts: BillingStandingFacts): BillingHome['method']['standing'] {
  if (facts.collection === null) return 'none';
  return facts.state === 'active' || facts.state === 'past_due' ? 'live' : 'ended';
}

/** The method row: its standing, the rail's name, and the mandate's own page while it collects. */
export function methodOf(
  pack: MarketPack,
  facts: BillingStandingFacts,
  manageUrl: string | null,
): BillingHome['method'] {
  const standing = methodStanding(facts);
  return {
    standing,
    label: methodLabel(pack, facts),
    // Only a mandate has a page of its own (`manageUrl` is read for none else).
    manageUrl: standing === 'live' ? manageUrl : null,
  };
}

/** The rail a mandate rides, as the pack names it; `null` on a link or a pack without labels. */
function methodLabel(
  pack: MarketPack,
  facts: BillingStandingFacts,
): BillingHome['method']['label'] {
  if (facts.tier === null || facts.cycle === null) return null;
  const route = pack.paymentRails.ladder[tierBand(facts.tier)][facts.cycle];
  if (route.collection !== 'mandate') return null;
  return pack.paymentRails.mandateTypes.find((type) => type.type === route.primary)?.label ?? null;
}
