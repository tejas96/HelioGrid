import {
  type Paginated,
  SAVED_PART_DUPLICATE,
  type SavedPart,
  type SavedPartKind,
  type SavedPartWrite,
  type savedPartsContract,
} from '@heliogrid/contracts';
import type { ClientInferRequest } from '@ts-rest/core';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { ApiError, bodyAt, bodyOrRefusalAt, bodyOrRefusalsAt } from '../errors/errors';

export type SavedPartCreate = ClientInferRequest<typeof savedPartsContract.add>['body'];

/**
 * The same brand and specification is already saved (`T-M06-034`): the part it is rides along, so
 * the picker picks that one instead of saying only "refused".
 */
export class SavedPartDuplicateError extends ApiError {
  constructor(
    readonly partId: string,
    message: string,
  ) {
    super(409, message, { code: SAVED_PART_DUPLICATE });
    this.name = 'SavedPartDuplicateError';
  }
}

/** The company's saved cable, electrical and structure parts (`M06-28`). */
export interface SavedPartsRepository {
  /**
   * One page of parts. A picker asks for one kind, live parts only; the catalog holder's view asks
   * for archived too.
   */
  list(
    ask: {
      readonly kind?: SavedPartKind;
      readonly archived?: boolean;
      readonly page: number;
      readonly limit: number;
    },
    signal?: AbortSignal,
  ): Promise<Paginated<SavedPart>>;
  /** The same part sent again — a second tap after a dropped answer — answers the first one made. */
  add(body: SavedPartCreate): Promise<SavedPart>;
  save(id: string, body: SavedPartWrite): Promise<SavedPart>;
  archive(id: string): Promise<SavedPart>;
  restore(id: string): Promise<SavedPart>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createSavedPartsRepository(api: ApiClient): SavedPartsRepository {
  const routes = api.savedParts;
  const creationKeys = createCreationKeys();
  const duplicate = (error: { message: string; facts: { partId: string } }) =>
    new SavedPartDuplicateError(error.facts.partId, error.message);
  return {
    list: ({ kind, archived, page, limit }, signal) =>
      bodyAt(
        () =>
          routes.list({
            query: { kind, archived: archived === true ? 'true' : undefined, page, limit },
            fetchOptions: { signal },
          }),
        200,
      ),
    add: async (body) => {
      const answer = await bodyOrRefusalAt(
        () => routes.add({ body, headers: creationKeys.headersFor(body) }),
        201,
        409,
      );
      if (!answer.answered) throw duplicate(answer.refusal.error);
      creationKeys.settle();
      return answer.body;
    },
    save: async (id, body) => {
      const answer = await bodyOrRefusalAt(() => routes.save({ params: { id }, body }), 200, 409);
      if (!answer.answered) throw duplicate(answer.refusal.error);
      return answer.body;
    },
    archive: (id) => bodyAt(() => routes.archive({ params: { id } }), 200),
    restore: async (id) => {
      const answer = await bodyOrRefusalsAt(() => routes.restore({ params: { id } }), 200, [409]);
      if (!answer.answered) throw duplicate(answer.refused.body.error);
      return answer.body;
    },
  };
}
