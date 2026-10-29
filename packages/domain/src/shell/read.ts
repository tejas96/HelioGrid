import type { TransportFailure } from '../format/transport-failure';

/**
 * Why a read has no value: no readable answer came (`F8-36`), or the server refused it.
 * The words for each are `packages/i18n`'s.
 */
export type ReadFailure = TransportFailure | 'refused';

/**
 * **The one state of a read**, on every screen and both platforms (`F7-23` N10). The retry lives
 * inside `failed`, so a failed read with no way to ask again cannot be written; the value lives
 * inside `ready`, so nothing draws a value that has not come.
 */
export type Read<T> =
  | { readonly kind: 'loading' }
  | { readonly kind: 'empty' }
  | { readonly kind: 'failed'; readonly failure: ReadFailure; readonly retry: () => void }
  | { readonly kind: 'ready'; readonly value: T };

export type ReadKind = Read<unknown>['kind'];

/** A read of one shape as a read of another; every state but `ready` passes through. */
export function mapRead<T, U>(read: Read<T>, map: (value: T) => U): Read<U> {
  return read.kind === 'ready' ? { kind: 'ready', value: map(read.value) } : read;
}

type ValuesOf<Reads extends readonly Read<unknown>[]> = {
  readonly [Index in keyof Reads]: Reads[Index] extends Read<infer T> ? T : never;
};

/**
 * Several reads drawn as one part. A failed read wins, since waiting on the others cannot mend it,
 * and its retry asks every failed read again; then a read still out; then an empty one; ready only
 * when every read is.
 */
export function allReads<const Reads extends readonly Read<unknown>[]>(
  reads: Reads,
): Read<ValuesOf<Reads>> {
  const failed = reads.filter((read) => read.kind === 'failed');
  const [first] = failed;
  if (first !== undefined) {
    return {
      kind: 'failed',
      failure: first.failure,
      retry: () => {
        for (const read of failed) read.retry();
      },
    };
  }
  if (reads.some((read) => read.kind === 'loading')) return { kind: 'loading' };
  if (reads.some((read) => read.kind === 'empty')) return { kind: 'empty' };
  return {
    kind: 'ready',
    value: reads.map((read) => (read.kind === 'ready' ? read.value : undefined)) as ValuesOf<Reads>,
  };
}
