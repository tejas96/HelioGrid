'use client';
import { DONE_DWELL_MS, type SessionStatus } from '@heliogrid/domain';
import { useEffect, useRef, useState } from 'react';

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

  // A boot that finds the session already signed in has no door to dwell on: `over` in the very
  // render it is known, never one render later — that one render read as signed out, and a
  // signed-in page's gate sent the person to the door and back home, losing the page they were on.
  if (status === 'authenticated' && !sawSignedOut.current) return 'over';
  return dwell;
}
