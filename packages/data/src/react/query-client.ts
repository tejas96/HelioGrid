import { QueryClient } from '@tanstack/react-query';
import { DataError } from '../errors/errors';

const MAX_QUERY_RETRIES = 2;

/**
 * Query defaults live HERE — one definition for both platforms, which had drifted.
 *
 * Retry is a NAMED policy, not a count. `retry: 1` retried everything: a 403 was re-sent to
 * be refused again, a validation failure was re-submitted, and a user who navigated away had
 * their cancelled request re-issued. Only a transient failure is worth repeating, and only a
 * read: `DataError.retryable` is set at construction by the layer that knows which it is
 * (network, timeout, 5xx — never cancellation, never a declared 4xx). Mutations never retry,
 * because this layer cannot know whether the first attempt reached the server.
 */
function queryRetryPolicy(failureCount: number, error: unknown): boolean {
  return failureCount < MAX_QUERY_RETRIES && error instanceof DataError && error.retryable;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: queryRetryPolicy, staleTime: 30_000 },
    },
  });
}
