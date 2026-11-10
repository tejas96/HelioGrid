import { visibilityIn } from '../authz/policy';
import type { RolePreset } from '../authz/roles';
import { formatMoney } from '../format/money';
import type { FormatPack } from '../format/pack';
import { MS_PER_DAY } from '../format/zone';
import { isOverdue } from '../tasks/overdue';
import { leadScopeOf } from './lead-scope';
import {
  LEAD_STAGES,
  type LeadLifecycleState,
  type LeadSource,
  type LeadStage,
} from './vocabulary';

/*
 * The Leads list (`SCR-M02-03`) decided once for both apps: whose leads it shows, the filters as
 * the list's read asks them, the pipeline's shape, and what each row says comes next. The bill
 * sorts as data in the tenant's currency (`M02-40`) — the server orders it; nothing here sums money.
 */

/** What the list orders by (`M02-40`: the bill sorts); each runs largest or newest first by default. */
export const LEAD_LIST_SORTS = ['created_at', 'monthly_bill', 'last_activity'] as const;
export type LeadListSortKey = (typeof LEAD_LIST_SORTS)[number];

/**
 * Whose leads the list shows: the person's own, or the widest rung their visibility holds — the
 * team's (own plus the unassigned queue until M10 maps managers) or the company's (`F2-12`…`F2-14`).
 */
export const LEADS_WHOSE = ['mine', 'team', 'all'] as const;
export type LeadsWhose = (typeof LEADS_WHOSE)[number];

export interface LeadsListSort {
  readonly key: LeadListSortKey;
  readonly order: 'asc' | 'desc';
}

/** The list's filters as the person set them. */
export interface LeadsListFilters {
  readonly whose: LeadsWhose;
  readonly stage: LeadStage | null;
  /** Only the leads thirty quiet days flagged (`M02-52`): the list's one surface for them (`M02-58`). */
  readonly dormant: boolean;
  readonly source: LeadSource | null;
  readonly sort: LeadsListSort;
  /** A name, a city or a number as typed; blank finds every lead. */
  readonly query: string;
}

/** The list's read as it is asked — the shape `GET /leads` takes. */
export interface LeadsListAsk {
  readonly ownerId?: string;
  readonly stage?: LeadStage;
  readonly state?: 'dormant';
  readonly source?: LeadSource;
  readonly sort: LeadListSortKey;
  readonly order: 'asc' | 'desc';
  readonly q?: string;
}

/** How long typing rests before the list asks for it: one read per pause, never one per key. */
export const LEADS_QUERY_SETTLE_MS = 300;

/** Newest first: the order a lead arrives in, and the list's own. */
export const LEADS_LIST_FIRST_SORT: LeadsListSort = { key: 'created_at', order: 'desc' };

/**
 * The choices of whose leads, narrowest first: Mine, then the widest rung held. A person whose
 * visibility is their own leads alone has the one choice. Team and All are never both offered:
 * until M10 maps who manages whom, a company-wide reader's team is the company, and two choices
 * that list the same leads would be a lie by adjacency.
 */
export function leadsWhoseOf(roles: readonly RolePreset[]): readonly LeadsWhose[] {
  const { scope } = visibilityIn(roles, 'leads');
  if (scope === 'all') return ['mine', 'all'];
  if (scope === 'team') return ['mine', 'team'];
  return ['mine'];
}

/** The inbox is offered beside the list to a person whose scope reaches the unassigned queue (`M02-23`). */
export function leadsInboxOffered(roles: readonly RolePreset[]): boolean {
  const scope = leadScopeOf(roles);
  return scope.kind === 'all' || scope.reaches.includes('unassigned_queue');
}

/** Where the list opens: the widest choice — the owner checks the whole pipeline, a rep sees theirs. */
export function leadsListFiltersFor(whose: readonly LeadsWhose[]): LeadsListFilters {
  return {
    whose: whose.at(-1) ?? 'mine',
    stage: null,
    dormant: false,
    source: null,
    sort: LEADS_LIST_FIRST_SORT,
    query: '',
  };
}

/** How many of the filters narrow the list — the order it is shown in is not one. */
export function leadsFiltersOn(filters: LeadsListFilters): number {
  return [
    filters.stage !== null,
    filters.dormant,
    filters.source !== null,
    filters.query.trim() !== '',
  ].filter(Boolean).length;
}

/**
 * The read the filters ask for. *Mine* names the reader as owner only where a wider choice exists:
 * a person with the one choice is shown their whole scope, which for a marketer is their own
 * captures still waiting, never leads they own.
 */
export function leadsListAskOf(
  filters: LeadsListFilters,
  readerId: string,
  whose: readonly LeadsWhose[],
): LeadsListAsk {
  const query = filters.query.trim();
  return {
    ...(filters.whose === 'mine' && whose.length > 1 ? { ownerId: readerId } : {}),
    ...(filters.stage === null ? {} : { stage: filters.stage }),
    ...(filters.dormant ? { state: 'dormant' as const } : {}),
    ...(filters.source === null ? {} : { source: filters.source }),
    sort: filters.sort.key,
    order: filters.sort.order,
    ...(query === '' ? {} : { q: query }),
  };
}

/**
 * The bill's sort, one press at a time (the phone's Bill chip): largest first, then smallest
 * first, then back to newest first.
 */
export function billSortStepped(sort: LeadsListSort): LeadsListSort {
  if (sort.key !== 'monthly_bill') return { key: 'monthly_bill', order: 'desc' };
  return sort.order === 'desc' ? { key: 'monthly_bill', order: 'asc' } : LEADS_LIST_FIRST_SORT;
}

/** The meter's stages: the open funnel, new to negotiating — a won lead has left the pipeline. */
export const PIPELINE_STAGES = LEAD_STAGES.filter((stage) => stage !== 'won');

export interface PipelineStage {
  readonly stage: LeadStage;
  readonly count: number;
}

/** The pipeline under the chosen owner, whatever else is filtered, as the server counted it. */
export interface LeadsPipeline {
  /** Every open stage in funnel order, a stage with none counted 0. */
  readonly stages: readonly PipelineStage[];
  /** Active and snoozed leads: what the list holds with nothing filtered. */
  readonly open: number;
  readonly dormant: number;
}

export function leadsPipelineOf(counted: {
  readonly byStage: readonly { readonly stage: LeadStage; readonly count: number }[];
  readonly dormant: number;
}): LeadsPipeline {
  const countOf = (stage: LeadStage) =>
    counted.byStage.find((one) => one.stage === stage)?.count ?? 0;
  return {
    stages: PIPELINE_STAGES.map((stage) => ({ stage, count: countOf(stage) })),
    open: counted.byStage.reduce((sum, one) => sum + one.count, 0),
    dormant: counted.dormant,
  };
}

/** What a listed lead says comes next (`SCR-M02-03`'s Next). */
export type LeadRowNext =
  | { readonly kind: 'snoozed'; readonly wakeOn: string | null }
  | { readonly kind: 'dormant'; readonly quietDays: number }
  /** Failed tries since the last answered call (`M02-43`). */
  | { readonly kind: 'tries'; readonly count: number }
  | {
      readonly kind: 'task';
      /** A kind a newer server learned is shown as sent (`extensibleEnum`). */
      readonly task: string;
      /** A custom task's own words. */
      readonly title: string | null;
      readonly dueAt: string;
      readonly overdue: boolean;
    }
  | { readonly kind: 'none' };

/** What the list reads of a lead beyond its summary; the wire's list row satisfies it. */
export interface LeadsListLead {
  readonly id: string;
  readonly state: LeadLifecycleState | null;
  readonly wakeOn: string | null;
  readonly unansweredCalls: number;
  readonly nextTask: {
    readonly kind: string;
    readonly title: string | null;
    readonly dueAt: string;
  } | null;
  readonly lastActivityAt: string;
}

/**
 * The one thing a row says comes next: a parked state first — it is why nothing else moves — then
 * the tries that went unanswered, then the soonest open task.
 */
export function leadRowNextOf(lead: LeadsListLead, now: number): LeadRowNext {
  if (lead.state === 'snoozed') return { kind: 'snoozed', wakeOn: lead.wakeOn };
  if (lead.state === 'dormant') {
    const quietMs = Math.max(0, now - Date.parse(lead.lastActivityAt));
    return { kind: 'dormant', quietDays: Math.floor(quietMs / MS_PER_DAY) };
  }
  if (lead.unansweredCalls > 0) return { kind: 'tries', count: lead.unansweredCalls };
  if (lead.nextTask === null) return { kind: 'none' };
  const dueAt = Date.parse(lead.nextTask.dueAt);
  return {
    kind: 'task',
    task: lead.nextTask.kind,
    title: lead.nextTask.title,
    dueAt: lead.nextTask.dueAt,
    overdue: isOverdue({ status: 'open', dueAt }, now),
  };
}

/**
 * A row's monthly bill in the tenant's money (`M02-40`), the way the lead's own value reads
 * (`leadValueShownOf`): the wire's decimal text handed to the one money renderer as sent, never
 * through a float first — `123456.00` reads `₹1,23,456` in every language; null while unknown.
 */
export function leadBillShownOf(
  bill: { readonly amount: string } | null,
  pack: FormatPack,
): string | null {
  return bill === null ? null : formatMoney(pack, bill.amount);
}

export interface LeadsListRow<L extends LeadsListLead> {
  readonly lead: L;
  readonly next: LeadRowNext;
  /** Milliseconds since the lead's last activity — the Last contact column. */
  readonly sinceActivityMs: number;
}

export interface LeadsListView<L extends LeadsListLead> {
  readonly rows: readonly LeadsListRow<L>[];
  readonly pipeline: LeadsPipeline;
  /** Leads matching the filters, every page counted. */
  readonly matching: number;
  readonly filtersOn: number;
  /** Matching beyond the pages read — what *Show more* brings. */
  readonly unread: number;
  /** Nothing matches the filters: the chips stay and *Clear filters* brings every lead back. */
  readonly noMatch: boolean;
  /** Something narrows the list that *Clear filters* undoes — a filter, or Mine under a wider choice. */
  readonly clearable: boolean;
}

/**
 * The list for one read. `null` is the first run — the company has no lead this person may see yet,
 * and nothing narrows the list — which teaches how leads arrive instead (`M02-25`'s way).
 */
export function leadsListViewOf<L extends LeadsListLead>(
  listed: readonly L[],
  page: { readonly matching: number; readonly pipeline: LeadsPipeline },
  filters: LeadsListFilters,
  whose: readonly LeadsWhose[],
  now: number,
): LeadsListView<L> | null {
  const filtersOn = leadsFiltersOn(filters);
  const clearable = filtersOn > 0 || filters.whose !== (whose.at(-1) ?? 'mine');
  const { pipeline, matching } = page;
  if (listed.length === 0 && !clearable && pipeline.open + pipeline.dormant === 0) return null;
  return {
    rows: listed.map((lead) => ({
      lead,
      next: leadRowNextOf(lead, now),
      sinceActivityMs: Math.max(0, now - Date.parse(lead.lastActivityAt)),
    })),
    pipeline,
    matching,
    filtersOn,
    unread: Math.max(0, matching - listed.length),
    noMatch: listed.length === 0,
    clearable,
  };
}
