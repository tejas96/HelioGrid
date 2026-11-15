import { apiContract } from '@heliogrid/contracts';
import {
  type ApiFetcher,
  type InitClientArgs,
  type InitClientReturn,
  initClient,
} from '@ts-rest/core';

/**
 * THE typed client. `initClient` is called exactly ONCE in this repository — the
 * dependency-cruiser rule `apps-never-touch-the-wire` fails the build if an app reaches for
 * @ts-rest directly. This is @ts-rest/core, NOT @ts-rest/react-query: a framework-free core
 * client is what lets the React Query layer be replaced without touching a repository.
 *
 * `credentials` is deliberately NOT set here — the two platforms need OPPOSITE values and
 * the transport is the layer that knows which one it is. See createTransport.
 */
/**
 * What the one client is built with. Named, with its two literal flags, so the client's type can be
 * WRITTEN below: inferred, the type of a client over the whole contract is too large for the
 * compiler to print into a declaration file. The literals are what narrow every answer to the
 * statuses its route declares — widen one to `boolean` and every repository loses that.
 */
interface ClientArgs extends InitClientArgs {
  baseUrl: string;
  baseHeaders: Record<string, never>;
  api: ApiFetcher;
  throwOnUnknownStatus: true;
  validateResponse: true;
}

export type ApiClient = InitClientReturn<typeof apiContract, ClientArgs>;

export function createApiClient(baseUrl: string, api: ApiFetcher): ApiClient {
  return initClient(apiContract, {
    baseUrl,
    baseHeaders: {},
    api,
    throwOnUnknownStatus: true,
    validateResponse: true,
  });
}
