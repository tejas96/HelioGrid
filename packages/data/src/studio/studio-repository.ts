import type {
  CreateDesign,
  DesignDetail,
  DesignSet,
  GeoPoint,
  PlaceAnswer,
  PlaceSuggestions,
  SaveSite,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { ApiError, bodyAt, bodyOrRefusalAt } from '../errors/errors';

/** An act the studio refuses, with domain's reason — a closed lead takes no design and no site change. */
export class DesignActRefusedError extends ApiError {
  constructor(
    /** Domain's `DesignActRefusal` — or one a newer server has learned. */
    readonly refusal: string,
    message: string,
    code: string,
  ) {
    super(422, message, { code });
    this.name = 'DesignActRefusedError';
  }
}

/** A 422 that carries domain's reason leaves as `DesignActRefusedError`; any other as its code. */
function actRefusal(error: {
  code: string;
  message: string;
  facts?: { refusal?: string } | undefined;
}): ApiError {
  const refusal = error.facts?.refusal;
  return refusal === undefined
    ? new ApiError(422, error.message, { code: error.code })
    : new DesignActRefusedError(refusal, error.message, error.code);
}

/**
 * Designs (`T-M05-001`): the reads within the reader's lead scope — a design outside it answers
 * 404 — and every act. A refusal a screen answers in place leaves as `DesignActRefusedError`.
 */
export interface StudioRepository {
  /** A lead's designs, newest change first, and whether the reader may add one. */
  designsOf(leadId: string, signal?: AbortSignal): Promise<DesignSet>;
  design(id: string, signal?: AbortSignal): Promise<DesignDetail>;
  /**
   * The lead's next design. The same body sent again — a second tap after a dropped answer —
   * carries the same retry key and answers the design the first send made.
   */
  create(leadId: string, body: CreateDesign): Promise<DesignDetail>;
  /** Site details saved whole; answers the design as it now stands. */
  saveSite(id: string, body: SaveSite): Promise<DesignDetail>;
  /** The recommended mark set or taken off; answers the lead's designs as they now stand. */
  recommend(id: string, recommended: boolean): Promise<DesignSet>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createStudioRepository(api: ApiClient): StudioRepository {
  const routes = api.studio;
  const createKeys = createCreationKeys();
  const at = (id: string) => ({ params: { id } });
  return {
    designsOf: (leadId, signal) =>
      bodyAt(() => routes.leadDesigns({ ...at(leadId), fetchOptions: { signal } }), 200),
    design: (id, signal) =>
      bodyAt(() => routes.detail({ ...at(id), fetchOptions: { signal } }), 200),
    create: async (leadId, body) => {
      const answer = await bodyOrRefusalAt(
        () =>
          routes.create({
            ...at(leadId),
            body,
            headers: createKeys.headersFor({ leadId, ...body }),
          }),
        201,
        422,
      );
      if (!answer.answered) throw actRefusal(answer.refusal.error);
      createKeys.settle();
      return answer.body;
    },
    saveSite: async (id, body) => {
      const answer = await bodyOrRefusalAt(() => routes.saveSite({ ...at(id), body }), 200, 422);
      if (!answer.answered) throw actRefusal(answer.refusal.error);
      return answer.body;
    },
    recommend: (id, recommended) =>
      bodyAt(() => routes.recommend({ ...at(id), body: { recommended } }), 200),
  };
}

/**
 * The place search of Site details. Every answer says whether the map service answered: a search
 * that is down is a state the form draws, never a failed read.
 */
export interface PlacesRepository {
  /** `session` is one search, from its first letter to the picked suggestion. */
  suggest(query: string, session: string, signal?: AbortSignal): Promise<PlaceSuggestions>;
  details(placeId: string, session: string, signal?: AbortSignal): Promise<PlaceAnswer>;
  at(point: GeoPoint, signal?: AbortSignal): Promise<PlaceAnswer>;
}

export function createPlacesRepository(api: ApiClient): PlacesRepository {
  const routes = api.places;
  return {
    suggest: (query, session, signal) =>
      bodyAt(() => routes.suggest({ query: { query, session }, fetchOptions: { signal } }), 200),
    details: (placeId, session, signal) =>
      bodyAt(() => routes.details({ query: { placeId, session }, fetchOptions: { signal } }), 200),
    at: (point, signal) => bodyAt(() => routes.at({ query: point, fetchOptions: { signal } }), 200),
  };
}
