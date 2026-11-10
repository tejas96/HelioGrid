import type { ComposedMessageWire, ComposeMessage } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { bodyAt } from '../errors/errors';

/**
 * Customer messages as copy-paste text (`M02-33`, `M02-47`, `M02-48`): the tenant's template filled
 * for this lead, to send from the person's own phone. Nothing is sent.
 */
export interface LeadMessagesRepository {
  /** One key per lead and body: a retried compose records one copied message. */
  compose(leadId: string, body: ComposeMessage): Promise<ComposedMessageWire>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createLeadMessagesRepository(api: ApiClient): LeadMessagesRepository {
  const composeKeys = createCreationKeys();
  return {
    async compose(leadId, body) {
      const headers = composeKeys.headersFor({ leadId, body });
      const message = await bodyAt(
        () => api.leadMessages.compose({ params: { id: leadId }, body, headers }),
        201,
      );
      composeKeys.settle();
      return message;
    },
  };
}
