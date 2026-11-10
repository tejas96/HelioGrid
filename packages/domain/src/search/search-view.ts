import type { ComponentKind } from '../catalog/vocabulary';
import type { LeadLifecycleState, LeadStage } from '../crm/vocabulary';
import type { FormatPack } from '../format/pack';
import { subjectAddressOf } from '../notifications/subject-address';
import { DOOR_SEGMENT } from '../shell/doors';
import type { Read } from '../shell/read';
import { SETTINGS_SEGMENT } from '../shell/settings-rows';
import { type SearchQuery, searchQueryOf } from './query';
import { isExact, numberOf, type SearchNumber } from './search-number';

/*
 * Global Search (`SCR-SHELL-02`, `F6-20`, `F6-23`) decided once for both apps: the groups the one
 * read answered, each row as drawn and the address it opens, the typed digits marked in each
 * number, and a junk lead's Reopen as it stands. A group that found nothing is not drawn, and the
 * kinds no module searches yet — proposals, projects, sites — draw no group at all (Law 9).
 */

/** The groups, in the order every surface draws them. */
export const SEARCH_GROUPS = ['leads', 'customers', 'people', 'catalog'] as const;
export type SearchGroup = (typeof SEARCH_GROUPS)[number];

/**
 * How long the typing rests before the search asks: one read per pause, never one per key, and
 * short enough that a number read off a ringing phone answers before the call is picked up.
 */
export const SEARCH_SETTLE_MS = 250;

/** What the view reads of the one search's answer; the wire's `SearchResults` satisfies it. */
export interface SearchHits {
  readonly leads: SearchHitGroup<SearchLeadHit>;
  readonly customers: SearchHitGroup<SearchCustomerHit>;
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

/** What the person did that the answer shown does not hold yet: a Reopen out, back undone, or done. */
export type SearchReopenAct<Failure> =
  | { readonly kind: 'waiting' }
  | { readonly kind: 'returned'; readonly failure: Failure }
  | {
      readonly kind: 'reopened';
      readonly stage: LeadStage;
      readonly state: LeadLifecycleState | null;
    };

/** A junk lead's Reopen (`F6-23`): offered, out, or back undone with why. */
export type SearchReopen<Failure> =
  | { readonly kind: 'offered' }
  | { readonly kind: 'waiting' }
  | { readonly kind: 'returned'; readonly failure: Failure };

export interface SearchLeadRow<Failure> {
  readonly kind: 'lead';
  readonly key: string;
  readonly address: string;
  readonly id: string;
  readonly name: string | null;
  readonly city: string | null;
  readonly source: string;
  readonly stage: LeadStage;
  /** Its R9 state as it now stands: a Reopen that landed has taken junk away. */
  readonly state: LeadLifecycleState | null;
  readonly number: SearchNumber;
  /** The number typed is this lead's, whole: it ranks first and says so. */
  readonly exact: boolean;
  /** Junk, and the reader may reopen it; null otherwise. */
  readonly reopen: SearchReopen<Failure> | null;
}

/** A customer has no page of its own: it opens the leads list on its number, its records. */
export interface SearchCustomerRow {
  readonly kind: 'customer';
  readonly key: string;
  readonly address: string;
  readonly id: string;
  readonly name: string | null;
  readonly city: string | null;
  readonly number: SearchNumber;
  readonly exact: boolean;
}

export interface SearchPersonRow {
  readonly kind: 'person';
  readonly key: string;
  /** The reader's own profile, or the team for one who opens it; null when neither is theirs. */
  readonly address: string | null;
  readonly userId: string;
  readonly name: string;
  readonly you: boolean;
}

export interface SearchCatalogRow {
  readonly kind: 'catalog_item';
  readonly key: string;
  /** The catalog, for one who opens it; every member reads an item's specs in the row itself. */
  readonly address: string | null;
  readonly id: string;
  readonly componentKind: ComponentKind;
  readonly brand: string;
  readonly model: string;
}

export type SearchRow<Failure> =
  | SearchLeadRow<Failure>
  | SearchCustomerRow
  | SearchPersonRow
  | SearchCatalogRow;

export interface SearchGroupView<Failure> {
  readonly group: SearchGroup;
  /** Every record of this kind the query found, of which `rows` are the first. */
  readonly total: number;
  readonly rows: readonly SearchRow<Failure>[];
  /** The kind's own list with the query applied, when the group is cut and such a list takes it. */
  readonly seeAll: string | null;
}

export interface SearchView<Failure> {
  readonly groups: readonly SearchGroupView<Failure>[];
  /** Every row's key in the order drawn: the keyboard's ↑ and ↓ walk it, from the first. */
  readonly order: readonly string[];
}

/**
 * The search as a surface draws it: nothing typed yet (the hint); the answer out; failed with its
 * retry; nothing found for `asked`; or the groups.
 */
export type SearchRead<Failure> =
  | { readonly kind: 'idle' }
  | { readonly kind: 'empty'; readonly asked: string }
  | Exclude<Read<SearchView<Failure>>, { readonly kind: 'empty' }>;

/** What the reader may open beyond the records themselves (`F7-48`): never a dead link. */
export interface SearchOpens {
  /** The Leads door: the lead group's See all opens its list with the query. */
  readonly leadsList: boolean;
  /** The Team row, which a team member's row opens. */
  readonly team: boolean;
  /** The Catalog row, which an item's row opens. */
  readonly catalog: boolean;
}

export interface SearchViewFacts<Failure> {
  readonly pack: FormatPack;
  /** The query this answer is for, as typed. */
  readonly asked: string;
  readonly readerId: string | null;
  readonly opens: SearchOpens;
  /** The reader holds the state-change grant (`F2.M02.lead-state-changes`) that reopens a lead. */
  readonly canReopen: boolean;
  /** Each lead's Reopen the answer does not hold yet, by lead id. */
  readonly reopens: ReadonlyMap<string, SearchReopenAct<Failure>>;
}

/** Whether the answer found nothing in any group. */
export function searchFoundNothing(hits: SearchHits): boolean {
  return SEARCH_GROUPS.every((group) => hits[group].total === 0);
}

/** The answer as drawn: each group that found something, its rows, and the keyboard's walk. */
export function searchViewOf<Failure>(
  hits: SearchHits,
  facts: SearchViewFacts<Failure>,
): SearchView<Failure> {
  const query = searchQueryOf(facts.pack, facts.asked);
  const rowsOf: { readonly [Group in SearchGroup]: () => readonly SearchRow<Failure>[] } = {
    leads: () => hits.leads.items.map((lead) => leadRowOf(lead, query, facts)),
    customers: () => hits.customers.items.map((customer) => customerRowOf(customer, query, facts)),
    people: () => hits.people.items.map((person) => personRowOf(person, facts)),
    catalog: () => hits.catalog.items.map((item) => catalogRowOf(item, facts)),
  };
  const groups = SEARCH_GROUPS.filter((group) => hits[group].total > 0).map((group) => {
    const rows = rowsOf[group]();
    const cut = hits[group].total > rows.length;
    return {
      group,
      total: hits[group].total,
      rows,
      seeAll: group === 'leads' && cut && facts.opens.leadsList ? leadsListOn(facts.asked) : null,
    };
  });
  return { groups, order: groups.flatMap((group) => group.rows.map((row) => row.key)) };
}

function leadRowOf<Failure>(
  lead: SearchLeadHit,
  query: SearchQuery,
  facts: SearchViewFacts<Failure>,
): SearchLeadRow<Failure> {
  const act = facts.reopens.get(lead.id);
  const now = act?.kind === 'reopened' ? act : lead;
  return {
    kind: 'lead',
    key: `lead:${lead.id}`,
    address: subjectAddressOf('lead', lead.id) ?? DOOR_SEGMENT.leads,
    id: lead.id,
    name: lead.name,
    city: lead.city,
    source: lead.source,
    stage: now.stage,
    state: now.state,
    number: numberOf(facts.pack, query, lead.phoneE164),
    exact: isExact(query, lead),
    reopen: now.state === 'junk' && facts.canReopen ? reopenOf(act) : null,
  };
}

function reopenOf<Failure>(act: SearchReopenAct<Failure> | undefined): SearchReopen<Failure> {
  if (act?.kind === 'waiting') return { kind: 'waiting' };
  if (act?.kind === 'returned') return { kind: 'returned', failure: act.failure };
  return { kind: 'offered' };
}

function customerRowOf<Failure>(
  customer: SearchCustomerHit,
  query: SearchQuery,
  facts: SearchViewFacts<Failure>,
): SearchCustomerRow {
  return {
    kind: 'customer',
    key: `customer:${customer.id}`,
    address: leadsListOn(customer.phoneE164),
    id: customer.id,
    name: customer.name,
    city: customer.city,
    number: numberOf(facts.pack, query, customer.phoneE164),
    exact: isExact(query, customer),
  };
}

function personRowOf<Failure>(
  person: SearchPersonHit,
  facts: SearchViewFacts<Failure>,
): SearchPersonRow {
  const you = person.userId === facts.readerId;
  const row = you ? 'profile' : facts.opens.team ? 'team' : null;
  return {
    kind: 'person',
    key: `person:${person.userId}`,
    address: row === null ? null : `${DOOR_SEGMENT.more}/${SETTINGS_SEGMENT[row]}`,
    userId: person.userId,
    name: person.name,
    you,
  };
}

function catalogRowOf<Failure>(
  item: SearchCatalogHit,
  facts: SearchViewFacts<Failure>,
): SearchCatalogRow {
  return {
    kind: 'catalog_item',
    key: `catalog:${item.id}`,
    address: facts.opens.catalog ? `${DOOR_SEGMENT.more}/${SETTINGS_SEGMENT.catalog}` : null,
    id: item.id,
    componentKind: item.kind,
    brand: item.brand,
    model: item.model,
  };
}

/** The leads list with a query applied (`SCR-M02-03` takes `q`), as both apps address it. */
function leadsListOn(query: string): string {
  return `${DOOR_SEGMENT.leads}?q=${encodeURIComponent(query.trim())}`;
}
