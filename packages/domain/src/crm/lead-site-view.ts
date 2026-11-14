import type { AreaRef } from '../format/areas';

/** The lead's site as its read carries it (`M06-09`, `M06-16`): typed once, each fact a gap while null. */
export interface LeadSiteFacts {
  readonly address: string | null;
  readonly area: AreaRef | null;
  readonly sanctionedLoadKw: number | null;
  /** A supply phase key; one a newer server learned is shown as sent. */
  readonly supplyPhase: string | null;
}

/** The Site section's facts: where the system goes and what supply it meets. */
export interface LeadSiteView extends LeadSiteFacts {
  /** The customer confirmed the address when the visit was booked (`M02-46`). */
  readonly confirmed: boolean;
}

/**
 * The Site section's view: the booked visit's address wins, being the one the customer confirmed;
 * otherwise the address the proposal typed shows, unconfirmed. An api built before the lead held
 * its site sends none, and every fact is then a gap.
 */
export function leadSiteViewOf(
  visit: { readonly address: string } | null,
  site: LeadSiteFacts | undefined,
): LeadSiteView {
  return {
    address: visit?.address ?? site?.address ?? null,
    area: site?.area ?? null,
    sanctionedLoadKw: site?.sanctionedLoadKw ?? null,
    supplyPhase: site?.supplyPhase ?? null,
    confirmed: visit !== null,
  };
}
