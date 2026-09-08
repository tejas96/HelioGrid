import type {
  OtpChallenge,
  OtpChannel,
  PlatformKind,
  SessionProjection,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/**
 * The front door as the data layer drives it (`M01-05`, `M01-07`). Every credential the API
 * sets is a cookie the transport carries, so nothing here holds a token; the session store
 * holds the one thing the flow needs between two calls — the challenge id.
 */
export interface AuthRepository {
  requestOtp(phoneE164: string, channel: OtpChannel): Promise<OtpChallenge>;
  verifyOtp(challengeId: string, code: string, platform: PlatformKind): Promise<SessionProjection>;
  session(signal?: AbortSignal): Promise<SessionProjection>;
  signOut(): Promise<void>;
  signOutEverywhere(): Promise<void>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createAuthRepository(api: ApiClient): AuthRepository {
  return {
    async requestOtp(phoneE164, channel) {
      try {
        const res = await api.auth.requestOtp({ body: { phoneE164, channel } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async verifyOtp(challengeId, code, platform) {
      try {
        const res = await api.auth.verifyOtp({ body: { challengeId, code, platform } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async session(signal) {
      try {
        const res = await api.auth.session({ fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async signOut() {
      try {
        const res = await api.auth.signOut({});
        if (res.status !== 204) throw toApiError(res);
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async signOutEverywhere() {
      try {
        const res = await api.auth.signOutEverywhere({});
        if (res.status !== 204) throw toApiError(res);
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}
