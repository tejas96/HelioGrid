import type {
  ComposedMessage,
  EditProposal,
  GenerateProposal,
  ProposalDetail,
  ProposalList,
  ProposalVersion,
  ProposalVersionSummary,
  proposalsContract,
  StartProposal,
} from '@heliogrid/contracts';
import type { ClientInferRequest, ClientInferResponseBody } from '@ts-rest/core';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import {
  ApiError,
  type ApiErrorDetail,
  bodyAt,
  bodyOrRefusalAt,
  bodyOrRefusalsAt,
} from '../errors/errors';
import {
  ProposalActRefusedError,
  ProposalConflictError,
  ProposalNotReadyError,
} from './proposal-refusals';

type Routes = typeof proposalsContract;
type Api = ApiClient['proposals'];
export type ProposalListAsk = NonNullable<ClientInferRequest<Routes['list']>['query']>;
export type FillEnergy = ClientInferRequest<Routes['fillEnergy']>['body'];
export type ResetStep = ClientInferRequest<Routes['resetStep']>['body'];
export type ShareProposal = ClientInferRequest<Routes['share']>['body'];
export type GeneratedProposal = ClientInferResponseBody<Routes['generate'], 201>;
export type SharedProposal = ClientInferResponseBody<Routes['share'], 200>;
export type VersionPdf = ClientInferResponseBody<Routes['versionPdf'], 200>;

/** A proposal started on a lead: the draft just made, or the lead's open one found again. */
export interface StartedProposal {
  readonly proposal: ProposalDetail;
  readonly resumed: boolean;
}

/**
 * Proposals (`M06`): the reads within the reader's lead scope — a proposal outside it answers 404
 * — and every act. A commit answers the proposal as it now stands, with the server's fresh figures
 * (`F4-04`); a refusal a screen answers in place leaves as its own error (`proposal-refusals.ts`).
 */
export interface ProposalsRepository {
  list(query: ProposalListAsk, signal?: AbortSignal): Promise<ProposalList>;
  detail(id: string, signal?: AbortSignal): Promise<ProposalDetail>;
  /**
   * Start on a lead, or resume its open draft. The same body sent again — a second tap after a
   * dropped answer — carries the same retry key and answers the draft the first send made.
   */
  start(leadId: string, body: StartProposal): Promise<StartedProposal>;
  /** One commit on the revision it was typed on; a stale one is a `ProposalConflictError`. */
  edit(id: string, body: EditProposal): Promise<ProposalDetail>;
  fillEnergy(id: string, body: FillEnergy): Promise<ProposalDetail>;
  resetStep(id: string, body: ResetStep): Promise<ProposalDetail>;
  discard(id: string, capturedAt: string): Promise<void>;
  /**
   * Run the checklist and freeze a version. The same body sent again carries the same retry key,
   * so a retry after a dropped answer finds the version and the number the first send made.
   */
  generate(id: string, body: GenerateProposal): Promise<GeneratedProposal>;
  versions(id: string, signal?: AbortSignal): Promise<ProposalVersionSummary[]>;
  version(id: string, version: number, signal?: AbortSignal): Promise<ProposalVersion>;
  /** The version's PDF, or `null` while it is being made. */
  versionPdf(id: string, version: number, signal?: AbortSignal): Promise<VersionPdf['download']>;
  shareMessage(id: string, signal?: AbortSignal): Promise<ComposedMessage>;
  share(id: string, body: ShareProposal): Promise<SharedProposal>;
  withdraw(id: string, capturedAt: string): Promise<ProposalDetail>;
  acceptanceMessage(id: string, signal?: AbortSignal): Promise<ComposedMessage>;
}

/** A 422 that carries domain's reason leaves as `ProposalActRefusedError`; any other as its code. */
function actRefusal(error: {
  code: string;
  message: string;
  /** The fields the server names — the builder says the refusal at that field (`F8-36`). */
  details?: readonly ApiErrorDetail[] | undefined;
  facts?: { refusal?: string } | undefined;
}): ApiError {
  const refusal = error.facts?.refusal;
  return refusal === undefined
    ? new ApiError(422, error.message, {
        code: error.code,
        ...(error.details === undefined ? {} : { details: error.details }),
      })
    : new ProposalActRefusedError(refusal, error.message, error.code);
}

type DetailSend = () => ReturnType<Api['edit']>;

/** Every commit answers alike: the proposal at 200, a conflict at 409, domain's refusal at 422. */
async function standingAfter(send: DetailSend): Promise<ProposalDetail> {
  const answer = await bodyOrRefusalsAt(send, 200, [409, 422]);
  if (answer.answered) return answer.body;
  const { refused } = answer;
  if (refused.status === 409) {
    const { code, message, facts } = refused.body.error;
    throw new ProposalConflictError(code, facts.revision, facts.movedTo, message);
  }
  throw actRefusal(refused.body.error);
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createProposalsRepository(api: ApiClient): ProposalsRepository {
  const routes = api.proposals;
  const startKeys = createCreationKeys();
  const generateKeys = createCreationKeys();
  const at = (id: string) => ({ params: { id } });
  return {
    list: (query, signal) => bodyAt(() => routes.list({ query, fetchOptions: { signal } }), 200),
    detail: (id, signal) =>
      bodyAt(() => routes.detail({ ...at(id), fetchOptions: { signal } }), 200),
    start: async (leadId, body) => {
      const answer = await bodyOrRefusalsAt(
        () =>
          routes.start({
            params: { id: leadId },
            body,
            headers: startKeys.headersFor({ leadId, ...body }),
          }),
        201,
        [200, 422],
      );
      if (answer.answered) {
        startKeys.settle();
        return { proposal: answer.body, resumed: false };
      }
      if (answer.refused.status === 200) {
        startKeys.settle();
        return { proposal: answer.refused.body, resumed: true };
      }
      throw actRefusal(answer.refused.body.error);
    },
    edit: (id, body) => standingAfter(() => routes.edit({ ...at(id), body })),
    fillEnergy: (id, body) => standingAfter(() => routes.fillEnergy({ ...at(id), body })),
    resetStep: (id, body) => standingAfter(() => routes.resetStep({ ...at(id), body })),
    discard: async (id, capturedAt) => {
      const answer = await bodyOrRefusalAt(
        () => routes.discard({ ...at(id), body: { capturedAt } }),
        204,
        422,
      );
      if (!answer.answered) throw actRefusal(answer.refusal.error);
    },
    generate: async (id, body) => {
      const answer = await bodyOrRefusalsAt(
        () =>
          routes.generate({ ...at(id), body, headers: generateKeys.headersFor({ id, ...body }) }),
        201,
        [409, 422],
      );
      if (answer.answered) {
        generateKeys.settle();
        return answer.body;
      }
      const { refused } = answer;
      if (refused.status === 409) {
        const { code, message, facts } = refused.body.error;
        throw new ProposalConflictError(code, facts.revision, facts.movedTo, message);
      }
      const { error } = refused.body;
      if (!('facts' in error)) throw new ApiError(422, error.message, { code: error.code });
      if ('verdict' in error.facts) {
        throw new ProposalNotReadyError(error.facts.verdict, error.message, error.code);
      }
      throw new ProposalActRefusedError(error.facts.refusal, error.message, error.code);
    },
    versions: async (id, signal) =>
      (await bodyAt(() => routes.versions({ ...at(id), fetchOptions: { signal } }), 200)).versions,
    version: (id, version, signal) =>
      bodyAt(() => routes.version({ params: { id, version }, fetchOptions: { signal } }), 200),
    versionPdf: async (id, version, signal) =>
      (
        await bodyAt(
          () => routes.versionPdf({ params: { id, version }, fetchOptions: { signal } }),
          200,
        )
      ).download,
    shareMessage: (id, signal) =>
      bodyAt(() => routes.shareMessage({ ...at(id), fetchOptions: { signal } }), 200),
    share: async (id, body) => {
      const answer = await bodyOrRefusalAt(() => routes.share({ ...at(id), body }), 200, 422);
      if (answer.answered) return answer.body;
      throw actRefusal(answer.refusal.error);
    },
    withdraw: async (id, capturedAt) => {
      const answer = await bodyOrRefusalAt(
        () => routes.withdraw({ ...at(id), body: { capturedAt } }),
        200,
        422,
      );
      if (answer.answered) return answer.body;
      throw actRefusal(answer.refusal.error);
    },
    acceptanceMessage: async (id, signal) => {
      const answer = await bodyOrRefusalAt(
        () => routes.acceptanceMessage({ ...at(id), fetchOptions: { signal } }),
        200,
        422,
      );
      if (answer.answered) return answer.body;
      throw actRefusal(answer.refusal.error);
    },
  };
}
