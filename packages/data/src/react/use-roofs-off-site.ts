'use client';
import type { DesignActRefusal } from '@heliogrid/domain';
import { useState } from 'react';
import { DesignActRefusedError } from '../studio/studio-repository';

/** The save the server held back because the roofs would stay at the old site. */
export interface RoofsOffSiteAsk {
  readonly asking: boolean;
  /** Saves again, the roofs of every design of the site removed. */
  remove(): void;
  /** Nothing is saved: the form stays as it is, the pin where the person put it. */
  keep(): void;
}

/** The failure is the studio's refusal for this reason. */
export const refusedFor = (failure: unknown, refusal: DesignActRefusal): boolean =>
  failure instanceof DesignActRefusedError && failure.refusal === refusal;

/**
 * A pin moved to another site (`roofs_off_site`): the refused save is held, the person is asked,
 * and only their yes sends it again with the roofs let go. `failed` goes to the save's `onFailed`.
 */
export function useRoofsOffSite<Body>(sendAgreed: (body: Body & { removeRoofs: true }) => void) {
  const [held, setHeld] = useState<Body | null>(null);
  const ask: RoofsOffSiteAsk = {
    asking: held !== null,
    remove: () => {
      if (held === null) return;
      setHeld(null);
      sendAgreed({ ...held, removeRoofs: true });
    },
    keep: () => setHeld(null),
  };
  return {
    ask,
    failed: (error: unknown, body: Body) => {
      if (refusedFor(error, 'roofs_off_site')) setHeld(body);
    },
  };
}
