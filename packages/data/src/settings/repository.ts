import type { BusinessProfileRead, BusinessProfileWrite } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/** A company's settings (`M01-31`). The api answers only a person who manages them. */
export interface SettingsRepository {
  businessProfile(signal?: AbortSignal): Promise<BusinessProfileRead>;
  /** Replaces the profile whole: send what was read, changed where the person answered. */
  saveBusinessProfile(profile: BusinessProfileWrite): Promise<BusinessProfileRead>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createSettingsRepository(api: ApiClient): SettingsRepository {
  return {
    async businessProfile(signal) {
      try {
        const res = await api.tenantSettings.businessProfile({ fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async saveBusinessProfile(profile) {
      try {
        const res = await api.tenantSettings.saveBusinessProfile({ body: profile });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}
