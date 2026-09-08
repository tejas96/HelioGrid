import type { UpdateUserProfile, UserProfile } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/** The one profile write (`M01-14`). */
export interface UserRepository {
  updateMe(patch: UpdateUserProfile): Promise<UserProfile>;
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
  };
}
