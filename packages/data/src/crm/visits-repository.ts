import type { BookVisit, LeadDetail, MemberRef, RescheduleVisit } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { bodyAt } from '../errors/errors';

/**
 * The site-visit booking (`M02-46`…`M02-48`): who can take it, book one, or reschedule a no-show
 * into a successor. Each write answers the lead as it now stands.
 */
export interface VisitsRepository {
  /** Every active member holding survey — whom a booking accepts — by name (`M02-46`, D15). */
  surveyors(signal?: AbortSignal): Promise<MemberRef[]>;
  /** One key per lead and body: a retried send books one visit. */
  book(leadId: string, body: BookVisit): Promise<LeadDetail>;
  reschedule(visitId: string, body: RescheduleVisit): Promise<LeadDetail>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createVisitsRepository(api: ApiClient): VisitsRepository {
  const bookKeys = createCreationKeys();
  const rescheduleKeys = createCreationKeys();
  return {
    async surveyors(signal) {
      const listed = await bodyAt(() => api.visits.surveyors({ fetchOptions: { signal } }), 200);
      return listed.items;
    },
    async book(leadId, body) {
      const headers = bookKeys.headersFor({ leadId, body });
      const lead = await bodyAt(
        () => api.visits.book({ params: { id: leadId }, body, headers }),
        201,
      );
      bookKeys.settle();
      return lead;
    },
    async reschedule(visitId, body) {
      const headers = rescheduleKeys.headersFor({ visitId, body });
      const lead = await bodyAt(
        () => api.visits.reschedule({ params: { id: visitId }, body, headers }),
        201,
      );
      rescheduleKeys.settle();
      return lead;
    },
  };
}
