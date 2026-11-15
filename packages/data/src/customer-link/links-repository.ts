import type {
  CustomerLink,
  CustomerLinks,
  customerLinksContract,
  MintLink,
} from '@heliogrid/contracts';
import type { ClientInferRequest, ClientInferResponseBody } from '@ts-rest/core';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { ApiError, bodyAt, bodyOrRefusalAt } from '../errors/errors';

type Routes = typeof customerLinksContract;
export type RemintLink = ClientInferRequest<Routes['remint']>['body'];
/** A link with its address — the one moment the address crosses the wire (`F5-75`). */
export type CustomerLinkAddress = ClientInferResponseBody<Routes['address'], 200>;

/** No link can be named before the proposal is shared (`F5-20`), or the link is already off. */
export class LinkActRefusedError extends ApiError {
  constructor(
    /** `not_shared`, `already_revoked`, or one a newer server has learned. */
    readonly refusal: string,
    message: string,
    code: string,
  ) {
    super(422, message, { code });
    this.name = 'LinkActRefusedError';
  }
}

/**
 * A deal's named customer links as the company sees them (`F5-26`, `F5-27`, `SCR-M06-20`). A
 * link's address is never a list field: only `mint`, `address` and `remint` answer it.
 */
export interface CustomerLinksRepository {
  ofLead(leadId: string, signal?: AbortSignal): Promise<CustomerLinks>;
  /** The same link named again — a second tap after a dropped answer — answers the first one made. */
  mint(leadId: string, body: MintLink): Promise<CustomerLinkAddress>;
  /** Reads a live link's address to copy it — an audited act. */
  address(linkId: string, capturedAt: string): Promise<CustomerLinkAddress>;
  relabel(linkId: string, label: string): Promise<CustomerLink>;
  remint(linkId: string, body: RemintLink): Promise<CustomerLinkAddress>;
  /** Turns the link off at once; there is no undo (`F5-76`). */
  revoke(linkId: string, capturedAt: string): Promise<CustomerLink>;
}

function refused(error: { code: string; message: string; facts?: { refusal: string } }): ApiError {
  return error.facts === undefined
    ? new ApiError(422, error.message, { code: error.code })
    : new LinkActRefusedError(error.facts.refusal, error.message, error.code);
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createCustomerLinksRepository(api: ApiClient): CustomerLinksRepository {
  const routes = api.customerLinks;
  const creationKeys = createCreationKeys();
  const at = (id: string) => ({ params: { id } });
  return {
    ofLead: (leadId, signal) =>
      bodyAt(() => routes.ofLead({ ...at(leadId), fetchOptions: { signal } }), 200),
    mint: async (leadId, body) => {
      const answer = await bodyOrRefusalAt(
        () =>
          routes.mint({
            ...at(leadId),
            body,
            headers: creationKeys.headersFor({ leadId, ...body }),
          }),
        201,
        422,
      );
      if (!answer.answered) throw refused(answer.refusal.error);
      creationKeys.settle();
      return answer.body;
    },
    address: async (linkId, capturedAt) => {
      const answer = await bodyOrRefusalAt(
        () => routes.address({ ...at(linkId), body: { capturedAt } }),
        200,
        422,
      );
      if (!answer.answered) throw refused(answer.refusal.error);
      return answer.body;
    },
    relabel: (linkId, label) =>
      bodyAt(() => routes.relabel({ ...at(linkId), body: { label } }), 200),
    remint: async (linkId, body) => {
      const answer = await bodyOrRefusalAt(() => routes.remint({ ...at(linkId), body }), 200, 422);
      if (!answer.answered) throw refused(answer.refusal.error);
      return answer.body;
    },
    revoke: async (linkId, capturedAt) => {
      const answer = await bodyOrRefusalAt(
        () => routes.revoke({ ...at(linkId), body: { capturedAt } }),
        200,
        422,
      );
      if (!answer.answered) throw refused(answer.refusal.error);
      return answer.body;
    },
  };
}
