'use client';
import { DONE_DWELL_MS } from '@heliogrid/domain';
import { useEffect, useRef, useState } from 'react';
import type { SessionStatus } from '../session/types';

/** The beat after a sign-in: `holding` while "You are in" is read, then `over`; `none` while signed out. */
export type SignInDwell = 'none' | 'holding' | 'over';

/**
 * ONE timer for the beat, so both doors and both navigators agree to the frame (Law 11). It
 * holds `DONE_DWELL_MS` only for a session that turned authenticated in THIS mount after being
 * signed out — a mount that opens already signed in has no door to dwell on and is `over` at once.
 */
export function useSignInDwell(status: SessionStatus): SignInDwell {
  const sawSignedOut = useRef(status === 'anonymous');
  const [dwell, setDwell] = useState<SignInDwell>(status === 'authenticated' ? 'over' : 'none');

  useEffect(() => {
    if (status === 'anonymous') sawSignedOut.current = true;
    if (status !== 'authenticated') {
      setDwell('none');
      return;
    }
    if (!sawSignedOut.current) {
      setDwell('over');
      return;
    }
    setDwell('holding');
    const timer = setTimeout(() => setDwell('over'), DONE_DWELL_MS);
    return () => clearTimeout(timer);
  }, [status]);

  return dwell;
}
