import type { AttachLeadFile, LeadFiles } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { bodyAt } from '../errors/errors';

/**
 * A lead's files (`M02-32`): the list, oldest first, and a stored file put on the lead by name —
 * answered with the list as it then stands. The file id is the retry key: the same file sent again
 * adds nothing.
 */
export interface LeadFilesRepository {
  list(leadId: string, signal?: AbortSignal): Promise<LeadFiles>;
  attach(leadId: string, body: AttachLeadFile): Promise<LeadFiles>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createLeadFilesRepository(api: ApiClient): LeadFilesRepository {
  return {
    list: (leadId, signal) =>
      bodyAt(() => api.leadFiles.list({ params: { id: leadId }, fetchOptions: { signal } }), 200),
    attach: (leadId, body) =>
      bodyAt(() => api.leadFiles.attach({ params: { id: leadId }, body }), 200),
  };
}
