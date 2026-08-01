'use client';
import { useMemo, useSyncExternalStore } from 'react';
import type { SessionApi } from '../session/types';
import { useDataLayer } from './context';

/**
 * The ONLY auth surface either app may see.
 *
 * The return value is MEMOISED on purpose. Spreading into a fresh object each render gave
 * it a new identity every time, which quietly defeated the `useCallback`s that list it as
 * a dependency — and would spin an infinite render loop the first time somebody put it in
 * a `useEffect` dependency array, which is an entirely reasonable thing to do.
 */
export function useSession(): SessionApi {
  const { session } = useDataLayer();
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  return useMemo(
    () => ({
      ...snapshot,
      requestOtp: session.requestOtp,
      verifyOtp: session.verifyOtp,
      signOut: session.signOut,
    }),
    [snapshot, session],
  );
}
