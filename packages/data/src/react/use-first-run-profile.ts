'use client';
import {
  FILE_SUBJECT_RULES,
  type FirstRunCarry,
  type FirstRunProfileFrame,
  type FirstRunProfileState,
  firstRunProfileFrame,
  firstRunProfileReducer,
  firstRunProfileStart,
} from '@heliogrid/domain';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useDataLayer } from './context';
import type { ChosenPicture } from './use-company-logo';

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
 * so the landing sends a newly named account there and anyone else home.
 */
export function useFirstRunOwed(): () => boolean {
  const { session } = useDataLayer();
  return useCallback(() => session.firstRunOwed() !== null, [session]);
}

/**
 * `SCR-M01-09`'s flow, `null` when nothing is owed (a reload, a typed address, an account that had
 * its own name): the screen then goes home. The reducer decides; this hook only sends the name, then
 * the photo — stored once, so a retry after the pointer failed sends the same file — and hands the
 * person on with `onDone` once the step ends.
 */
export function useFirstRunProfile(onDone: () => void): FirstRunProfile | null {
  const { session, repositories } = useDataLayer();
  // Held from the first render: ending the step clears the store's copy while this screen still draws.
  const [carry] = useState(() => session.firstRunOwed());
  const [state, dispatch] = useReducer(
    firstRunProfileReducer,
    carry?.name ?? null,
    firstRunProfileStart,
  );
  const chosen = useRef<ChosenPicture | null>(null);
  const stored = useRef<{ readonly image: ChosenPicture; readonly fileId: string } | null>(null);
  const done = useRef(onDone);
  done.current = onDone;
  const { phase } = state;

  // The name is read at the send: only a phase change sends anything, never a keystroke.
  // biome-ignore lint/correctness/useExhaustiveDependencies: state.name is read when the phase moves
  useEffect(() => {
    switch (phase) {
      case 'saving-name':
        void repositories.user.updateMe({ name: state.name.trim() }).then(
          () => dispatch({ type: 'name-ended', saved: true }),
          () => dispatch({ type: 'name-ended', saved: false }),
        );
        return;
      case 'saving-photo':
        void storePhoto().then(
          () => dispatch({ type: 'photo-ended', saved: true }),
          () => dispatch({ type: 'photo-ended', saved: false }),
        );
        return;
      case 'done':
        done.current();
        session.endFirstRun();
        // The name on the session is the one the join wrote; read the saved one back.
        void session.rereadUser();
        return;
      default:
        return;
    }

    async function storePhoto(): Promise<void> {
      const image = chosen.current;
      const user = session.getSnapshot().user;
      const contentType = FILE_SUBJECT_RULES.user_account.contentTypes.find(
        (taken) => taken === image?.contentType,
      );
      if (image === null || user === null || contentType === undefined) throw new Error('no photo');
      if (stored.current?.image !== image) {
        const subject = { subjectKind: 'user_account', subjectRef: user.id } as const;
        const file = await repositories.file.store({ ...subject, contentType, bytes: image.bytes });
        stored.current = { image, fileId: file.id };
      }
      await repositories.user.setMyPhoto(stored.current.fileId);
    }
  }, [phase, repositories, session]);

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
