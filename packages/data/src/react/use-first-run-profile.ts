'use client';
import {
  type FirstRunCarry,
  type FirstRunProfileFrame,
  type FirstRunProfileState,
  firstRunProfileFrame,
  firstRunProfileReducer,
  firstRunProfileStart,
} from '@heliogrid/domain';
import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { useDataLayer } from './context';
import type { ChosenPicture } from './use-company-logo';
import { useProfileSend } from './use-profile-send';

/** First-Run Profile as both screens consume it (Law 11): who it is about, the frame, the acts. */
export interface FirstRunProfile {
  readonly carry: FirstRunCarry;
  readonly state: FirstRunProfileState;
  readonly frame: FirstRunProfileFrame;
  typeName(name: string): void;
  choosePhoto(image: ChosenPicture): void;
  removePhoto(): void;
  /** `save` is the one act — *Save and continue*, or *Continue without a photo*; `retry-photo` sends the photo alone. */
  press(act: 'save' | 'retry-photo'): void;
}

/**
 * Whether the person signed in now is owed First-Run Profile — read at the moment a join ends,
 * so the landing sends a newly named account there and anyone else to the role card.
 */
export function useFirstRunOwed(): () => boolean {
  const { session } = useDataLayer();
  return useCallback(() => session.firstRunOwed() !== null, [session]);
}

/** The role card's act at first run (`SCR-M01-10`): the steps after the join are over. */
export function useEndFirstRun(): () => void {
  const { session } = useDataLayer();
  return session.endFirstRun;
}

/**
 * `SCR-M01-09`'s flow, `null` when nothing is owed (a reload, a typed address, an account that had
 * its own name): the screen then goes home. The reducer decides; `useProfileSend` sends the name,
 * then the photo, and this hook hands the person on with `onDone` once the step ends.
 */
export function useFirstRunProfile(onDone: () => void): FirstRunProfile | null {
  const { session } = useDataLayer();
  // Held from the first render: ending the step clears the store's copy while this screen still draws.
  const [carry] = useState(() => session.firstRunOwed());
  const [state, dispatch] = useReducer(
    firstRunProfileReducer,
    carry?.name ?? null,
    firstRunProfileStart,
  );
  const chosen = useRef<ChosenPicture | null>(null);
  useProfileSend(state, dispatch, chosen, {
    onDone: () => {
      onDone();
      session.profileSaved();
      // The name on the session is the one the join wrote; read the saved one back.
      void session.rereadUser();
    },
  });

  return useMemo(() => {
    if (carry === null) return null;
    return {
      carry,
      state,
      frame: firstRunProfileFrame(state),
      typeName: (name: string) => dispatch({ type: 'name-typed', name }),
      choosePhoto: (image: ChosenPicture) => {
        chosen.current = image;
        dispatch({ type: 'photo-chosen', image });
      },
      removePhoto: () => {
        chosen.current = null;
        dispatch({ type: 'photo-removed' });
      },
      press: (act: 'save' | 'retry-photo') => dispatch({ type: act }),
    };
  }, [carry, state]);
}
