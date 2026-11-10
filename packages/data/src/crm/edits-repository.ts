import type { EditLead, LeadDetail } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { bodyAt } from '../errors/errors';

/**
 * A lead's fields (`M02-36`, `M02-37`, `M02-39`): each sent alone as it is answered, `null`
 * emptying it back to its named gap. The server's apply order decides which of two edits stands.
 */
export interface LeadEditsRepository {
  edit(leadId: string, body: EditLead): Promise<LeadDetail>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createLeadEditsRepository(api: ApiClient): LeadEditsRepository {
  return {
    edit: (leadId, body) => bodyAt(() => api.leadEdits.edit({ params: { id: leadId }, body }), 200),
  };
}
