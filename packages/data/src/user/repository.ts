import type { MyPhoto, UpdateUserProfile, UserProfile } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/** The account's profile write, and my photo in the company I act under (`M01-14`). */
export interface UserRepository {
  updateMe(patch: UpdateUserProfile): Promise<UserProfile>;
  /** My photo in this company: its file, or `null` for my initials. */
  myPhoto(signal?: AbortSignal): Promise<MyPhoto>;
  /** Points my photo at a stored file of mine, or clears it with `null`. */
  setMyPhoto(fileId: string | null): Promise<MyPhoto>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createUserRepository(api: ApiClient): UserRepository {
  return {
    async updateMe(patch) {
      try {
        const res = await api.user.updateMe({ body: patch });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async myPhoto(signal) {
      try {
        const res = await api.user.getMyPhoto({ fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async setMyPhoto(fileId) {
      try {
        const res = await api.user.setMyPhoto({ body: { fileId } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}
