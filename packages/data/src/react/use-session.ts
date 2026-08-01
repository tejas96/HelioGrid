'use client';
import { useSyncExternalStore } from 'react';
import type { SessionApi } from '../session/types';
import { useDataLayer } from './context';

/** The ONLY auth surface either app may see. */
export function useSession(): SessionApi {
  const { session } = useDataLayer();
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  return {
    ...snapshot,
    requestOtp: session.requestOtp,
    verifyOtp: session.verifyOtp,
    signOut: session.signOut,
  };
}
