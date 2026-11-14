import type {
  CustomerPage,
  customerLinkPublicContract,
  ProposalDocument,
} from '@heliogrid/contracts';
import type { ClientInferRequest, ClientInferResponseBody } from '@ts-rest/core';
import type { ApiClient } from '../client/client';
import { ApiError, bodyAt, bodyOrRefusalAt } from '../errors/errors';

type Routes = typeof customerLinkPublicContract;
type Api = ApiClient['customerLinkPublic'];
export type LinkDeviceClass = ClientInferRequest<Routes['opened']>['body']['deviceClass'];
export type LinkSectionViewed = ClientInferRequest<Routes['sectionViewed']>['body'];
export type LinkFileDownload = ClientInferResponseBody<Routes['file'], 200>;
export type LinkPdf = ClientInferResponseBody<Routes['pdf'], 200>['download'];

/**
 * An answer the server did not record (`F5-47`): the version is no longer the one the link serves,
 * it already took its answer, the deal is won or closed, or the link's hourly ceiling is met.
 * Nothing partial was written; the page is read again and shows what stands.
 */
export class LinkActNotTakenError extends ApiError {
  constructor(
    /** Domain's `ProposalActRefusal`, `link_off`, `ceiling_met`, or one a newer server has learned. */
    readonly refusal: string,
    message: string,
    code: string,
  ) {
    super(422, message, { code });
    this.name = 'LinkActNotTakenError';
  }
}

/**
 * The customer's side of the link (`F5`). Signed-out by design: the token is the customer's whole
 * authority (`F5-21`), no route here answers 401, and nothing but the token names the customer
 * (`F5-77`). Every act answers the page as it now stands.
 */
export interface CustomerLinkPublicRepository {
  /** The proposal, the progress, the solar file, or why the link cannot serve. */
  page(token: string, signal?: AbortSignal): Promise<CustomerPage>;
  /** One open, sent by a drawn page alone — never by a link preview (`F5-29`). */
  opened(token: string, deviceClass: LinkDeviceClass): Promise<void>;
  sectionViewed(token: string, viewed: LinkSectionViewed): Promise<void>;
  /** `versionId` is the version the page showed (`F5-47`): a newer one answers `version_not_current`. */
  accept(token: string, versionId: string): Promise<CustomerPage>;
  negotiate(token: string, versionId: string, words: string): Promise<CustomerPage>;
  decline(token: string, versionId: string, reason: string | null): Promise<CustomerPage>;
  question(token: string, text: string): Promise<CustomerPage>;
  /** `at` is the time the customer named; `null` asks for the next lawful moment (`F5-54`). */
  callRequest(token: string, at: string | null): Promise<CustomerPage>;
  /** A short-lived link to a file the page lists. */
  file(token: string, fileId: string, signal?: AbortSignal): Promise<LinkFileDownload>;
  /** The PDF of the version the page shows, or `null` while it is being made. */
  pdf(token: string, signal?: AbortSignal): Promise<LinkPdf>;
  /** A frozen version for the document renderer alone, behind its short-lived grant. */
  print(versionId: string, grant: string, signal?: AbortSignal): Promise<ProposalDocument>;
}

type PageSend = () => ReturnType<Api['accept']>;

/** Every act on the link answers alike: the page at 200, or the refusal at 422. */
async function pageAfter(send: PageSend): Promise<CustomerPage> {
  const answer = await bodyOrRefusalAt(send, 200, 422);
  if (answer.answered) return answer.body;
  const { error } = answer.refusal;
  throw new LinkActNotTakenError(error.facts.refusal, error.message, error.code);
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createCustomerLinkPublicRepository(api: ApiClient): CustomerLinkPublicRepository {
  const routes = api.customerLinkPublic;
  const at = (token: string) => ({ params: { token } });
  return {
    page: (token, signal) =>
      bodyAt(() => routes.page({ ...at(token), fetchOptions: { signal } }), 200),
    opened: (token, deviceClass) =>
      bodyAt(() => routes.opened({ ...at(token), body: { deviceClass } }), 204),
    sectionViewed: (token, viewed) =>
      bodyAt(() => routes.sectionViewed({ ...at(token), body: viewed }), 204),
    accept: (token, versionId) =>
      pageAfter(() => routes.accept({ ...at(token), body: { versionId } })),
    negotiate: (token, versionId, words) =>
      pageAfter(() => routes.negotiate({ ...at(token), body: { versionId, words } })),
    decline: (token, versionId, reason) =>
      pageAfter(() => routes.decline({ ...at(token), body: { versionId, reason } })),
    question: (token, text) => pageAfter(() => routes.question({ ...at(token), body: { text } })),
    callRequest: (token, when) =>
      pageAfter(() => routes.callRequest({ ...at(token), body: { at: when } })),
    file: (token, fileId, signal) =>
      bodyAt(() => routes.file({ params: { token, fileId }, fetchOptions: { signal } }), 200),
    pdf: async (token, signal) =>
      (await bodyAt(() => routes.pdf({ ...at(token), fetchOptions: { signal } }), 200)).download,
    print: async (versionId, grant, signal) =>
      (
        await bodyAt(
          () => routes.print({ params: { versionId }, query: { grant }, fetchOptions: { signal } }),
          200,
        )
      ).document,
  };
}
