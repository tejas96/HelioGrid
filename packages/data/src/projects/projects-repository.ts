import {
  type HandoverPreview,
  LEAD_TRANSITION_REFUSED,
  PROJECT_ACT_REFUSED,
  type ProjectBoard,
  type ProjectCard,
  type ProjectDetail,
  type ProjectJob,
  type projectActsContract,
} from '@heliogrid/contracts';
import type { ClientInferRequest } from '@ts-rest/core';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { ApiError, bodyAt, bodyOrRefusalAt } from '../errors/errors';

/**
 * An act the project's standing does not allow (`F4-16`): an `ApiError` with code
 * `PROJECT_ACT_REFUSED` that keeps domain's reason, so the screen says why in place — the second
 * of two people moving one project is told it already moved.
 */
export class ProjectActRefusedError extends ApiError {
  constructor(
    /** Domain's `ProjectActRefusal` — or one a newer server has learned. */
    readonly refusal: string,
    message: string,
  ) {
    super(422, message, { code: PROJECT_ACT_REFUSED });
    this.name = 'ProjectActRefusedError';
  }
}

/** *Mark won* refused by the lead's own machine (`F4-16`): already won, or closed. */
export class MarkWonRefusedError extends ApiError {
  constructor(
    readonly refusal: string,
    message: string,
  ) {
    super(422, message, { code: LEAD_TRANSITION_REFUSED });
    this.name = 'MarkWonRefusedError';
  }
}

type Acts = ApiClient['projectActs'];
/** An act's body as the contract takes it, by route. */
export type ProjectActBody<K extends ProjectActKind> = ClientInferRequest<
  (typeof projectActsContract)[K]
>['body'];
export type MarkWonBody = ClientInferRequest<typeof projectActsContract.markWon>['body'];
export type ClosedAsk = NonNullable<Parameters<ApiClient['projects']['closed']>[0]>['query'];

/**
 * The projects (`SCR-M08-01`…`06`): the reads within the reader's scope — a project outside it
 * answers 404 — and every act, each answering the project as it now stands.
 */
export interface ProjectsRepository {
  board(signal?: AbortSignal): Promise<ProjectBoard>;
  closed(
    query: ClosedAsk,
    signal?: AbortSignal,
  ): Promise<{ items: ProjectCard[]; totalCount: number }>;
  detail(id: string, signal?: AbortSignal): Promise<ProjectDetail>;
  handoverPreview(id: string, signal?: AbortSignal): Promise<HandoverPreview>;
  people(
    role: 'manager' | 'crew',
    signal?: AbortSignal,
  ): Promise<{ userId: string; name: string; liveProjects: number }[]>;
  jobs(signal?: AbortSignal): Promise<ProjectJob[]>;
  /**
   * *Mark won*: the project is created in the same act. The same body sent again — a second tap
   * after a dropped answer — carries the same retry key and answers the project the first made.
   */
  markWon(leadId: string, body: MarkWonBody): Promise<{ projectId: string; number: string }>;
  /** Every act on a project, by its route's name, answering the project as it now stands. */
  readonly acts: {
    readonly [K in ProjectActKind]: (
      projectId: string,
      body: ProjectActBody<K>,
    ) => Promise<ProjectDetail>;
  };
}

/** The acts on a project — every route of the acts contract but *Mark won*, which acts on a lead. */
export type ProjectActKind = Exclude<keyof Acts, 'markWon'>;

/** Every act answers alike: the project at 200, or domain's refusal at 422. */
async function standingAfter(send: () => ReturnType<Acts['move']>): Promise<ProjectDetail> {
  const answer = await bodyOrRefusalAt(send, 200, 422);
  if (answer.answered) return answer.body;
  const { error } = answer.refusal;
  throw new ProjectActRefusedError(error.facts.refusal, error.message);
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createProjectsRepository(api: ApiClient): ProjectsRepository {
  const reads = api.projects;
  const acts = api.projectActs;
  const creationKeys = createCreationKeys();
  return {
    board: (signal) => bodyAt(() => reads.board({ fetchOptions: { signal } }), 200),
    closed: (query, signal) => bodyAt(() => reads.closed({ query, fetchOptions: { signal } }), 200),
    detail: (id, signal) =>
      bodyAt(() => reads.detail({ params: { id }, fetchOptions: { signal } }), 200),
    handoverPreview: (id, signal) =>
      bodyAt(() => reads.handoverPreview({ params: { id }, fetchOptions: { signal } }), 200),
    people: (role, signal) =>
      bodyAt(() => reads.people({ query: { role }, fetchOptions: { signal } }), 200),
    jobs: (signal) => bodyAt(() => reads.jobs({ fetchOptions: { signal } }), 200),
    markWon: async (leadId, body) => {
      const answer = await bodyOrRefusalAt(
        () =>
          acts.markWon({
            params: { id: leadId },
            body,
            headers: creationKeys.headersFor({ leadId, ...body }),
          }),
        201,
        422,
      );
      if (answer.answered) {
        creationKeys.settle();
        return answer.body;
      }
      const { error } = answer.refusal;
      if ('facts' in error) throw new MarkWonRefusedError(error.facts.refusal, error.message);
      throw new ApiError(422, error.message, { code: error.code });
    },
    acts: {
      move: (id, body) => standingAfter(() => acts.move({ params: { id }, body })),
      dispatch: (id, body) => standingAfter(() => acts.dispatch({ params: { id }, body })),
      moveBack: (id, body) => standingAfter(() => acts.moveBack({ params: { id }, body })),
      undo: (id, body) => standingAfter(() => acts.undo({ params: { id }, body })),
      confirmProof: (id, body) => standingAfter(() => acts.confirmProof({ params: { id }, body })),
      startWait: (id, body) => standingAfter(() => acts.startWait({ params: { id }, body })),
      endWait: (id, body) => standingAfter(() => acts.endWait({ params: { id }, body })),
      documentNotNeeded: (id, body) =>
        standingAfter(() => acts.documentNotNeeded({ params: { id }, body })),
      documentReopen: (id, body) =>
        standingAfter(() => acts.documentReopen({ params: { id }, body })),
      attachFile: (id, body) => standingAfter(() => acts.attachFile({ params: { id }, body })),
      showFile: (id, body) => standingAfter(() => acts.showFile({ params: { id }, body })),
      tickStep: (id, body) => standingAfter(() => acts.tickStep({ params: { id }, body })),
      untickStep: (id, body) => standingAfter(() => acts.untickStep({ params: { id }, body })),
      change: (id, body) => standingAfter(() => acts.change({ params: { id }, body })),
      cancel: (id, body) => standingAfter(() => acts.cancel({ params: { id }, body })),
      handover: (id, body) => standingAfter(() => acts.handover({ params: { id }, body })),
    },
  };
}
