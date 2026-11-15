import type { ComponentKind } from '../catalog/vocabulary';
import type { LeadLifecycleState, LeadStage } from '../crm/vocabulary';
import type { ProposalStanding } from '../proposals/tracked-standing';

/*
 * What the one search read answers (`F6-20`), group by group — the shapes the wire's
 * `SearchResults` satisfies and `searchViewOf` draws from.
 */

/** What the view reads of the one search's answer; the wire's `SearchResults` satisfies it. */
export interface SearchHits {
  readonly leads: SearchHitGroup<SearchLeadHit>;
  readonly customers: SearchHitGroup<SearchCustomerHit>;
  readonly proposals: SearchHitGroup<SearchProposalHit>;
  readonly people: SearchHitGroup<SearchPersonHit>;
  readonly catalog: SearchHitGroup<SearchCatalogHit>;
}

interface SearchHitGroup<Hit> {
  readonly total: number;
  readonly items: readonly Hit[];
}

export interface SearchLeadHit {
  readonly id: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly city: string | null;
  readonly stage: LeadStage;
  readonly state: LeadLifecycleState | null;
  /** A source a newer server learned is shown as sent (`extensibleEnum`). */
  readonly source: string;
}

export interface SearchCustomerHit {
  readonly id: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly city: string | null;
}

/** A proposal found by its number, its customer's name or city, or the alias (`F6-22`). */
export interface SearchProposalHit {
  readonly id: string;
  /** `null` while it is a draft: the number comes at the first Generate (`M06-44`). */
  readonly number: string | null;
  readonly customerName: string | null;
  readonly city: string | null;
  readonly standing: ProposalStanding;
}

export interface SearchPersonHit {
  readonly userId: string;
  readonly name: string;
}

export interface SearchCatalogHit {
  readonly id: string;
  readonly kind: ComponentKind;
  readonly brand: string;
  readonly model: string;
}
