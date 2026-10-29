import type { Read, ReadKind } from '@heliogrid/domain';

/** A story's read in the state its spec names: `value` once ready, `retry` once failed. */
export function readIn<T>(kind: ReadKind, value: T, retry: () => void): Read<T> {
  switch (kind) {
    case 'loading':
      return { kind: 'loading' };
    case 'empty':
      return { kind: 'empty' };
    case 'failed':
      return { kind: 'failed', failure: 'no_connection', retry };
    case 'ready':
      return { kind: 'ready', value };
  }
}
