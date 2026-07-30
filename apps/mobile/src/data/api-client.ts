import { apiContract } from '@heliogrid/contracts';
import { tsRestFetchApi } from '@ts-rest/core';
import { initQueryClient } from '@ts-rest/react-query';
import { API_URL, absorbSetCookies, loadCookie } from '../auth/client';

/**
 * THE typed client for RN — same contract as web/api (compile-checked shapes). The
 * custom fetcher injects the keychain cookie jar (S1 pattern) and absorbs rotations.
 * credentials 'omit' keeps iOS native cookie handling OFF — the jar is authoritative
 * (see src/auth/client.ts).
 */
export const api = initQueryClient(apiContract, {
  baseUrl: API_URL,
  baseHeaders: {},
  credentials: 'omit',
  api: async (args) => {
    const cookie = await loadCookie();
    if (cookie) args.headers.cookie = cookie;
    const result = await tsRestFetchApi(args);
    await absorbSetCookies(result.headers);
    return result;
  },
});
