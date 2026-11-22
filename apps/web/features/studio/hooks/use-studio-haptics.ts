'use client';
import { type StudioScreen, studioHapticOf, studioMomentsOf } from '@heliogrid/data/react';
import { useEffect, useRef } from 'react';
import { hapticToPhone } from '../../../lib/web-view-host';

/**
 * The phone's taps in the studio (`T-M05-002`, part b; the platform adapter): what each change
 * asks for is the data package's; this sends it to the phone around the page. A browser that is
 * not the phone's web view sends nothing.
 */
export function useStudioHaptics(studio: StudioScreen): void {
  const now = studioMomentsOf(studio);
  const was = useRef(now);
  useEffect(() => {
    const tap = studioHapticOf(was.current, now);
    was.current = now;
    if (tap !== null) hapticToPhone(tap);
  });
}
