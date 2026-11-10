import type {
  Assignees,
  AssignLead,
  BulkAssign,
  BulkAssigned,
  LeadDetail,
  MemberRef,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { bodyAt, bodyOrRefusalAt } from '../errors/errors';

/**
 * What an assign came to: the lead as it now stands, or the race lost — someone assigned it first,
 * and `owner` holds it now (`M02-67`). Nothing moved in the second case.
 */
export type LeadAssignOutcome =
  | { readonly kind: 'assigned'; readonly lead: LeadDetail }
  | { readonly kind: 'already_assigned'; readonly owner: MemberRef | null };

/**
 * Assignment (`M02-27`…`M02-31`): the people a lead can go to with their load, and the one-tap
 * assign — compare-and-set on the owner the screen showed.
 */
export interface LeadAssignRepository {
  /** Active members holding `crm.add_edit_leads`, each with open and overdue counts (`M02-28`). */
  assignees(signal?: AbortSignal): Promise<Assignees>;
  assign(leadId: string, body: AssignLead): Promise<LeadAssignOutcome>;
  /** Each lead on its own; the answer names every lead's result (`M02-29`). */
  bulkAssign(body: BulkAssign): Promise<BulkAssigned>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createLeadAssignRepository(api: ApiClient): LeadAssignRepository {
  return {
    assignees: (signal) =>
      bodyAt(() => api.leadAssign.assignees({ fetchOptions: { signal } }), 200),
    async assign(leadId, body) {
      const answer = await bodyOrRefusalAt(
        () => api.leadAssign.assign({ params: { id: leadId }, body }),
        200,
        409,
      );
      if (answer.answered) return { kind: 'assigned', lead: answer.body };
      return { kind: 'already_assigned', owner: answer.refusal.error.facts.owner };
    },
    bulkAssign: (body) => bodyAt(() => api.leadAssign.bulkAssign({ body }), 200),
  };
}
