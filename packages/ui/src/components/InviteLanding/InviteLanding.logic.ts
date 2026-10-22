import type { InviteLandingFrameKind } from '@heliogrid/domain';
import { useEffect, useRef } from 'react';
import type { FocusHandle } from '../SearchField/SearchField.types';

/**
 * A press that takes its own control away — the ask, a join the invite ran out under — moves the
 * focus to the new frame's act, never to the page's start. The read that opens the page moves
 * nothing, and the live invite never takes the focus here: its code takes it at 1536 and nothing
 * takes it on the phone, where a keyboard would hide who invited (ruling 12).
 */
export function useFocusOnNewFrame(kind: InviteLandingFrameKind) {
  const act = useRef<FocusHandle>(null);
  const shown = useRef<InviteLandingFrameKind | null>(kind === 'loading' ? null : kind);
  useEffect(() => {
    const before = shown.current;
    if (kind === 'loading') return;
    shown.current = kind;
    if (before !== null && before !== kind && kind !== 'landing') act.current?.focus();
  }, [kind]);
  return act;
}
