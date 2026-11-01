'use client';
import type { ReadKind } from '@heliogrid/domain';
import { type RefObject, useEffect, useRef } from 'react';

/**
 * The web's focus move after `Try again` lands: the failed read's frame, which held focus, is gone,
 * so focus goes to the plans region that replaced it (`.claude/rules/ui-adherence.md`, *States,
 * saves and focus*). Only a read that was failed moves it — a first load leaves focus where it is.
 */
export function useFocusAfterRetry<T extends HTMLElement>(kind: ReadKind): RefObject<T | null> {
  const region = useRef<T | null>(null);
  const was = useRef<ReadKind>(kind);
  useEffect(() => {
    if (was.current === 'failed' && kind !== 'failed' && kind !== 'loading')
      region.current?.focus();
    if (kind !== 'loading') was.current = kind;
  }, [kind]);
  return region;
}
