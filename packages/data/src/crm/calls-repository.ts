import type { AddNote, LeadDetail, LogCall } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { bodyAt } from '../errors/errors';

/**
 * Logging what happened on a lead (`M02-35`, `M02-43`): a call and its outcome, or a note. Each
 * answers the lead as it now stands, since a call can move its stage and raise its tasks.
 */
export interface LeadCallsRepository {
  /** One key per lead and body: a retried send logs one call. */
  logCall(leadId: string, body: LogCall): Promise<LeadDetail>;
  addNote(leadId: string, body: AddNote): Promise<LeadDetail>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createLeadCallsRepository(api: ApiClient): LeadCallsRepository {
  const callKeys = createCreationKeys();
  const noteKeys = createCreationKeys();
  return {
    async logCall(leadId, body) {
      const headers = callKeys.headersFor({ leadId, body });
      const lead = await bodyAt(
        () => api.leadCalls.logCall({ params: { id: leadId }, body, headers }),
        201,
      );
      callKeys.settle();
      return lead;
    },
    async addNote(leadId, body) {
      const headers = noteKeys.headersFor({ leadId, body });
      const lead = await bodyAt(
        () => api.leadCalls.addNote({ params: { id: leadId }, body, headers }),
        201,
      );
      noteKeys.settle();
      return lead;
    },
  };
}
