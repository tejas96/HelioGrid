'use client';
import type { Read, ReadFailure } from '@heliogrid/domain';
import type { UseQueryResult } from '@tanstack/react-query';
import { DataError } from '../errors/errors';

/** Why a failed request has no value: the transport's reason, else the server refused it. */
export function readFailureOf(error: unknown): ReadFailure {
  return error instanceof DataError && error.failure !== null ? error.failure : 'refused';
}

/**
 * **The one way a query becomes a `Read`** — every hook hands its screen this, never the query.
 * A value already on screen stays `ready` when a later re-read fails: replacing it with an error
 * would drop what the person was reading, and the shell's no-connection screen tells a lost
 * network. `isEmpty` is the read's own rule for "none yet"; a read without one is never empty.
 */
export function readOf<T>(query: UseQueryResult<T>, isEmpty?: (value: T) => boolean): Read<T> {
  const { data } = query;
  if (data !== undefined) {
    return isEmpty?.(data) === true ? { kind: 'empty' } : { kind: 'ready', value: data };
  }
  if (query.isError) {
    return {
      kind: 'failed',
      failure: readFailureOf(query.error),
      retry: () => void query.refetch(),
    };
  }
  return { kind: 'loading' };
}

/** No value yet and the device is offline: the read is paused, never coming on its own. */
export function pausedWithNoValue(query: UseQueryResult<unknown>): boolean {
  return query.data === undefined && query.fetchStatus === 'paused';
}

/**
 * No value yet, and a read of it has already failed — so a retry is what is out now, which React
 * Query reports as pending.
 */
export function failedBefore(query: UseQueryResult<unknown>): boolean {
  return query.data === undefined && query.errorUpdateCount > 0;
}
