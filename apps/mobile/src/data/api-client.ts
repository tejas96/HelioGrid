import { apiContract } from '@heliogrid/contracts';
import { tsRestFetchApi } from '@ts-rest/core';
import { initQueryClient } from '@ts-rest/react-query';
import { API_URL, absorbSetCookieHeader, loadCookie } from '../auth/client';

/**
 * THE typed client for RN — same contract as web/api (compile-checked shapes). The
 * custom fetcher injects the keychain cookie jar (S1 pattern) and absorbs rotations.
 */
export const api = initQueryClient(apiContract, {
  baseUrl: API_URL ?? 'http://localhost:8080',
  baseHeaders: {},
  api: async (args) => {
    const cookie = await loadCookie();
    if (cookie) args.headers.cookie = cookie;
    const result = await tsRestFetchApi(args);
    await absorbSetCookieHeader(result.headers.get('set-cookie'));
    return result;
  },
});
