import { apiContract } from '@heliogrid/contracts';
import { type ApiFetcher, initClient } from '@ts-rest/core';

/**
 * THE typed client. `initClient` is called exactly ONCE in this repository — the
 * dependency-cruiser rule `apps-never-touch-the-wire` fails the build if an app reaches for
 * @ts-rest directly. This is @ts-rest/core, NOT @ts-rest/react-query: a framework-free core
 * client is what lets the React Query layer be replaced without touching a repository.
 *
 * `credentials` is deliberately NOT set here — the two platforms need OPPOSITE values and
 * the transport is the layer that knows which one it is. See createTransport.
 */
export function createApiClient(baseUrl: string, api: ApiFetcher) {
  return initClient(apiContract, { baseUrl, baseHeaders: {}, api });
}

export type ApiClient = ReturnType<typeof createApiClient>;
