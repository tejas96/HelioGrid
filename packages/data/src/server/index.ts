import type { CustomerPage } from '@heliogrid/contracts';
import type { QueryClient } from '@tanstack/react-query';
import { createRepositoryRegistry, type Repositories } from '../composition';
import { ApiError } from '../errors/errors';
import { createQueryClient } from '../react/query-client';
import type { RequestHeaders } from '../transport/transport';

export interface ServerDataContextConfig {
  baseUrl: string;
  /** The CURRENT request's headers; only the transport allowlist is forwarded onward. */
  headers: RequestHeaders;
}

export interface ServerDataContext {
  queryClient: QueryClient;
  repositories: Repositories;
}

/**
 * One render/request scope for a Next server component or server action.
 *
 * Call it inside the render and let it fall out of scope — NEVER hoist it to a module
 * constant. Both fields are request-bound: the repositories close over the caller's
 * forwarded cookie/authorization headers, and the QueryClient holds whatever those requests
 * returned. A process-global one serves the next visitor another visitor's session and cache.
 */
export function createServerDataContext({
  baseUrl,
  headers,
}: ServerDataContextConfig): ServerDataContext {
  return {
    queryClient: createQueryClient(),
    repositories: createRepositoryRegistry({
      baseUrl,
      headers,
      mode: 'server',
    }),
  };
}

/** What a server render learned of a customer's link before the page is drawn. */
export type CustomerPageFirstRead =
  | { readonly kind: 'page'; readonly page: CustomerPage }
  /** No link has this address. */
  | { readonly kind: 'gone' }
  /** No readable answer in time: the page draws and reads for itself in the browser. */
  | { readonly kind: 'unread' };

const GONE_CODES: ReadonlySet<string> = new Set(['NOT_FOUND', 'VALIDATION_FAILED']);

/**
 * The customer's page, read ONCE on the server for its first paint (`F5-07`: the decisive content
 * before any heavy asset). Signed-out by design — the token is the whole authority (`F5-21`) — so
 * NO header of the visitor's request is forwarded: a company person's cookie plays no part in what
 * a link serves. It records no open: an open is sent by the drawn page alone (`T-F5-007`), which is
 * what keeps a messenger's link preview from counting as one. Never throws: a read that fails
 * leaves the page to read for itself.
 */
export async function readCustomerPage(
  baseUrl: string,
  token: string,
): Promise<CustomerPageFirstRead> {
  const { repositories } = createServerDataContext({ baseUrl, headers: {} });
  try {
    return { kind: 'page', page: await repositories.customerLinkPublic.page(token) };
  } catch (error) {
    return error instanceof ApiError && GONE_CODES.has(error.code)
      ? { kind: 'gone' }
      : { kind: 'unread' };
  }
}
