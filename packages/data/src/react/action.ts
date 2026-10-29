'use client';
import { useCallback, useMemo, useRef, useState } from 'react';

const ONE_LOCK = '';

export interface ActionOptions<Input, Output> {
  /** One lock per key — a row's send leaves the other rows free. Unset: one lock for the action. */
  readonly key?: (input: Input) => string;
  readonly onDone?: (output: Output, input: Input) => void | Promise<void>;
  readonly onFailed?: (error: unknown, input: Input) => void;
}

/**
 * How one press ended: its answer; its failure; or `out` — another send with its key was still
 * out, so this press sent nothing.
 */
export type ActionAnswer<Output> =
  | { readonly kind: 'done'; readonly output: Output }
  | { readonly kind: 'failed'; readonly error: unknown }
  | { readonly kind: 'out' };

export interface Action<Input, Output = unknown> {
  /** Any send of this action is out: its fields and acts are inert until it answers. */
  readonly pending: boolean;
  /** The send for this key is out, as of the last redraw. */
  pendingFor(key: string): boolean;
  /**
   * A send is out NOW — read from the lock itself, so a second way out pressed in the same frame
   * as the send (Esc, a backdrop, Back) finds it before any redraw.
   */
  isOut(key?: string): boolean;
  /** What the last send ended with, until the next one starts or `clear` is called. */
  readonly failure: unknown;
  /** Sends — unless one with the same key is out, when it sends nothing and answers `out`. */
  run(input: Input): Promise<ActionAnswer<Output>>;
  clear(): void;
}

/**
 * **The one in-flight guard for an action** (`F7-23` N10). The lock is a ref taken before the
 * request leaves, so a second press in the same frame — before any redraw — finds it held.
 */
export function useAction<Input, Output>(
  send: (input: Input) => Promise<Output>,
  options: ActionOptions<Input, Output> = {},
): Action<Input, Output> {
  const latest = useRef({ send, options });
  latest.current = { send, options };
  const locks = useRef(new Set<string>());
  const [out, setOut] = useState<ReadonlySet<string>>(new Set());
  const [failure, setFailure] = useState<unknown>(null);

  const run = useCallback(async (input: Input): Promise<ActionAnswer<Output>> => {
    const { send: sendNow, options: now } = latest.current;
    const key = now.key?.(input) ?? ONE_LOCK;
    if (locks.current.has(key)) return { kind: 'out' };
    locks.current.add(key);
    setOut(new Set(locks.current));
    setFailure(null);
    try {
      const output = await sendNow(input);
      await now.onDone?.(output, input);
      return { kind: 'done', output };
    } catch (error) {
      setFailure(error);
      now.onFailed?.(error, input);
      return { kind: 'failed', error };
    } finally {
      locks.current.delete(key);
      setOut(new Set(locks.current));
    }
  }, []);

  const isOut = useCallback(
    (key?: string) => (key === undefined ? locks.current.size > 0 : locks.current.has(key)),
    [],
  );
  const clear = useCallback(() => setFailure(null), []);
  return useMemo(
    () => ({
      pending: out.size > 0,
      pendingFor: (key: string) => out.has(key),
      isOut,
      failure,
      run,
      clear,
    }),
    [out, failure, run, isOut, clear],
  );
}
