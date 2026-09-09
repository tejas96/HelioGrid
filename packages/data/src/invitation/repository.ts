import type {
  CreateInvitation,
  Invitation,
  InvitationLanding,
  ListInvitationsQuery,
  Paginated,
  SessionProjection,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/**
 * The team invite as the data layer drives it (`M01-12`, `M01-13`): the tenant side for the Team
 * and Invite screens, the landing side for the invited person, who holds the link's token and,
 * for the accept alone, the session the invite's own phone opened.
 */
export interface InvitationRepository {
  /** Refused with `ALREADY_MEMBER`, `ALREADY_INVITED` or `INVITE_CAP_REACHED`, each a state the screen renders. */
  create(input: CreateInvitation): Promise<Invitation>;
  list(query: ListInvitationsQuery, signal?: AbortSignal): Promise<Paginated<Invitation>>;
  revoke(invitationId: string): Promise<Invitation>;
  landing(token: string, signal?: AbortSignal): Promise<InvitationLanding>;
  /** The one-step join; the session moves to the company and the projection carries it. */
  accept(token: string): Promise<SessionProjection>;
  decline(token: string): Promise<void>;
  requestReinvite(token: string): Promise<void>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createInvitationRepository(api: ApiClient): InvitationRepository {
  return {
    async create(input) {
      try {
        const res = await api.invitation.create({ body: input });
        if (res.status !== 201) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async list(query, signal) {
      try {
        const res = await api.invitation.list({ query, fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async revoke(invitationId) {
      try {
        const res = await api.invitation.revoke({ params: { id: invitationId } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async landing(token, signal) {
      try {
        const res = await api.invitation.landing({ params: { token }, fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async accept(token) {
      try {
        const res = await api.invitation.accept({ params: { token } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async decline(token) {
      try {
        const res = await api.invitation.decline({ params: { token } });
        if (res.status !== 204) throw toApiError(res);
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async requestReinvite(token) {
      try {
        const res = await api.invitation.requestReinvite({ params: { token } });
        if (res.status !== 204) throw toApiError(res);
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}
