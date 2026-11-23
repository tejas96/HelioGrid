import type {
  AddCadPlan,
  AddDesignPicture,
  CreateDesign,
  DesignDetail,
  DesignDocumentWire,
  DesignPictureWire,
  DesignSet,
  EditTurnWire,
  GeoPoint,
  MemberRef,
  PlaceAnswer,
  PlaceSuggestions,
  SaveDocument,
  SavedDocument,
  SaveSite,
  SkyPictureWire,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { ApiError, bodyAt, bodyOrRefusalAt, bodyOrRefusalsAt } from '../errors/errors';

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

/**
 * A save the studio refuses in place: someone saved after the version it was made on — who, and
 * when — or another person holds the design's turn to edit. Nothing merges (`F4-15`).
 */
export class DocumentConflictError extends ApiError {
  constructor(
    readonly conflict:
      | {
          readonly kind: 'saved-first';
          readonly version: number;
          readonly savedAt: string;
          readonly savedBy: MemberRef | null;
          /** The save that came first was this opening's own, whose answer was lost. */
          readonly byThisOpening: boolean;
        }
      | { readonly kind: 'turn-held'; readonly editor: MemberRef },
    message: string,
    code: string,
  ) {
    super(409, message, { code });
    this.name = 'DocumentConflictError';
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
  /** The design document as it stands, who saved it last, and whose turn it is. */
  document(id: string, signal?: AbortSignal): Promise<DesignDocumentWire>;
  /**
   * The whole document saved over the version it was changed from. A refusal the studio answers
   * in place leaves as `DocumentConflictError`, a closed lead's as `DesignActRefusedError`.
   */
  saveDocument(id: string, body: SaveDocument): Promise<SavedDocument>;
  /**
   * The turn to edit taken or renewed, answered with whoever holds it after. A closed lead's design
   * gives none, and leaves as `DesignActRefusedError`.
   */
  takeEditTurn(id: string): Promise<EditTurnWire>;
  /** The turn to edit given back. */
  giveEditTurn(id: string): Promise<void>;
  /** The sky picture of the design's site, fetched now, or why there is none. */
  skyPicture(id: string, signal?: AbortSignal): Promise<SkyPictureWire>;
  /**
   * A picture of the company's own read on the device, kept with the design (`T-M05-002d`); the
   * same send again carries the same retry key. A refusal leaves as an `ApiError` naming its code.
   */
  addPicture(id: string, body: AddDesignPicture): Promise<DesignPictureWire>;
  /** A CAD plan kept, and our server's read of it started; it answers the picture `reading`. */
  addCadPlan(id: string, body: AddCadPlan): Promise<DesignPictureWire>;
  /** A picture of the design's own as it stands, with short-lived links to its parts. */
  picture(id: string, pictureId: string, signal?: AbortSignal): Promise<DesignPictureWire>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createStudioRepository(api: ApiClient): StudioRepository {
  const routes = api.studio;
  const createKeys = createCreationKeys();
  const pictureKeys = createCreationKeys();
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
    document: (id, signal) =>
      bodyAt(() => routes.document({ ...at(id), fetchOptions: { signal } }), 200),
    saveDocument: async (id, body) => {
      const answer = await bodyOrRefusalsAt(
        () => routes.saveDocument({ ...at(id), body }),
        200,
        [409, 422],
      );
      if (answer.answered) return answer.body;
      const { refused } = answer;
      if (refused.status === 422) throw actRefusal(refused.body.error);
      const { error } = refused.body;
      throw new DocumentConflictError(
        error.code === 'DESIGN_SAVED_FIRST'
          ? { kind: 'saved-first', ...error.facts }
          : { kind: 'turn-held', editor: error.facts.editor },
        error.message,
        error.code,
      );
    },
    takeEditTurn: async (id) => {
      const answer = await bodyOrRefusalAt(() => routes.takeEditTurn(at(id)), 200, 422);
      if (!answer.answered) throw actRefusal(answer.refusal.error);
      return answer.body;
    },
    giveEditTurn: async (id) => {
      await bodyAt(() => routes.giveEditTurn(at(id)), 204);
    },
    skyPicture: (id, signal) =>
      bodyAt(() => routes.skyPicture({ ...at(id), fetchOptions: { signal } }), 200),
    addPicture: async (id, body) => {
      const answer = await bodyOrRefusalAt(
        () =>
          routes.addPicture({ ...at(id), body, headers: pictureKeys.headersFor({ id, ...body }) }),
        201,
        422,
      );
      if (!answer.answered) throw actRefusal(answer.refusal.error);
      pictureKeys.settle();
      return answer.body;
    },
    addCadPlan: async (id, body) => {
      const answer = await bodyOrRefusalAt(
        () =>
          routes.addCadPlan({ ...at(id), body, headers: pictureKeys.headersFor({ id, ...body }) }),
        201,
        422,
      );
      if (!answer.answered) throw actRefusal(answer.refusal.error);
      pictureKeys.settle();
      return answer.body;
    },
    picture: (id, pictureId, signal) =>
      bodyAt(() => routes.picture({ params: { id, pictureId }, fetchOptions: { signal } }), 200),
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
