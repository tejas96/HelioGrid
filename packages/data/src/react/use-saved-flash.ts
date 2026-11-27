'use client';
import { SAVED_MARK_MS } from '@heliogrid/domain';
import { useEffect, useState } from 'react';
import type { StudioSaveState } from './studio-save-queue';

/**
 * Whether the save mark's Saved check shows: for `SAVED_MARK_MS` after a save lands — from saving,
 * from no connection or from a retry — and never on opening. It turns on in the same render the
 * save lands in, so Saving hands over to Saved with no empty frame. A save that lands while it
 * shows starts its moment again, so changes one after another keep it on.
 */
export function useSavedFlash(saving: StudioSaveState['kind']): boolean {
  const [shown, setShown] = useState(false);
  const [was, setWas] = useState(saving);
  if (saving !== was) {
    setWas(saving);
    if (saving === 'saved') setShown(true);
  }
  useEffect(() => {
    if (!shown || saving !== 'saved') return;
    const timer = setTimeout(() => setShown(false), SAVED_MARK_MS);
    return () => clearTimeout(timer);
  }, [shown, saving]);
  return shown;
}
