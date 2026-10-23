'use client';
import {
  FILE_SUBJECT_RULES,
  type FirstRunProfileEvent,
  type FirstRunProfileState,
} from '@heliogrid/domain';
import { type RefObject, useEffect, useRef } from 'react';
import { useDataLayer } from './context';
import type { ChosenPicture } from './use-company-logo';

/** What a screen does as the send moves on: the first run hands the person on, the editor closes. */
export interface ProfileSendEnds {
  /** The name on the server is the typed one. */
  readonly onNameSaved?: () => void;
  readonly onDone: () => void;
}

/**
 * Sends a name, then a photo, as domain's first-run reducer moves between its phases — the one
 * send First-Run Profile and Profile & preferences' editor share. Only a phase change sends
 * anything, never a keystroke. A chosen photo is stored once, so a retry after the pointer failed
 * sends the same file; no photo is sent as a cleared pointer.
 */
export function useProfileSend(
  state: FirstRunProfileState | null,
  dispatch: (event: FirstRunProfileEvent) => void,
  chosen: RefObject<ChosenPicture | null>,
  ends: ProfileSendEnds,
): void {
  const { session, repositories } = useDataLayer();
  const stored = useRef<{ readonly image: ChosenPicture; readonly fileId: string } | null>(null);
  const latest = useRef({ state, ends });
  latest.current = { state, ends };
  const phase = state?.phase;

  useEffect(() => {
    const now = latest.current;
    switch (phase) {
      case 'saving-name':
        void repositories.user.updateMe({ name: now.state?.name.trim() ?? '' }).then(
          () => {
            latest.current.ends.onNameSaved?.();
            dispatch({ type: 'name-ended', saved: true });
          },
          () => dispatch({ type: 'name-ended', saved: false }),
        );
        return;
      case 'saving-photo':
        void sendPhoto().then(
          () => dispatch({ type: 'photo-ended', saved: true }),
          () => dispatch({ type: 'photo-ended', saved: false }),
        );
        return;
      case 'done':
        now.ends.onDone();
        return;
      default:
        return;
    }

    async function sendPhoto(): Promise<void> {
      if (now.state?.photo.kind === 'none') {
        await repositories.user.setMyPhoto(null);
        return;
      }
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
  }, [phase, dispatch, chosen, repositories, session]);
}
