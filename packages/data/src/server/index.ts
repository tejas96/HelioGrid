import type { QueryClient } from '@tanstack/react-query';
import { createRepositoryRegistry, type Repositories } from '../composition';
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
