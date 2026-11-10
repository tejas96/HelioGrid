import type { LeadDetail, LeadInbox, LeadList } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { bodyAt } from '../errors/errors';

/** The list's query as it is sent — before the server fills its default sort and order. */
export type LeadsAsk = NonNullable<NonNullable<Parameters<ApiClient['leads']['list']>[0]>['query']>;

/** The inbox's page as it is sent. */
export type LeadInboxAsk = NonNullable<
  NonNullable<Parameters<ApiClient['leads']['inbox']>[0]>['query']
>;

/**
 * The leads reads (`SCR-M02-02` … `04`): the list, the inbox and one lead, each within the reader's
 * visibility scope — a lead outside it answers 404.
 */
export interface LeadsRepository {
  list(query: LeadsAsk, signal?: AbortSignal): Promise<LeadList>;
  inbox(query: LeadInboxAsk, signal?: AbortSignal): Promise<LeadInbox>;
  detail(id: string, signal?: AbortSignal): Promise<LeadDetail>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createLeadsRepository(api: ApiClient): LeadsRepository {
  return {
    list: (query, signal) => bodyAt(() => api.leads.list({ query, fetchOptions: { signal } }), 200),
    inbox: (query, signal) =>
      bodyAt(() => api.leads.inbox({ query, fetchOptions: { signal } }), 200),
    detail: (id, signal) =>
      bodyAt(() => api.leads.detail({ params: { id }, fetchOptions: { signal } }), 200),
  };
}
