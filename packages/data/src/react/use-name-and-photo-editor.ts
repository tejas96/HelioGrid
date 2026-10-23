'use client';
import {
  type FirstRunProfileEvent,
  type FirstRunProfileFrame,
  type FirstRunProfileState,
  firstRunProfileFrame,
  firstRunProfileReducer,
  profileEditorStart,
  type SavedPhoto,
} from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useReducer, useRef } from 'react';
import { queryKeys } from '../cache/keys';
import { useDataLayer } from './context';
import type { ChosenPicture } from './use-company-logo';
import { useProfileSend } from './use-profile-send';

/** Profile & preferences' *Edit name* editor (`SCR-M01-11`), as both screens consume it. */
export interface NameAndPhotoEditor {
  readonly isOpen: boolean;
  /** The flow; after a close it keeps what the editor last drew, so the editor can leave as it was. */
  readonly state: FirstRunProfileState;
  readonly frame: FirstRunProfileFrame;
  /** The photo the circle draws — the saved one or the one just chosen. */
  readonly picture: string | undefined;
  /** Opens over the person's saved name and photo. */
  open(name: string, saved: SavedPhoto): void;
  /** Leaves without saving; ignored while a save is out, so its answer lands where it was sent. */
  close(): void;
  typeName(name: string): void;
  choosePhoto(image: ChosenPicture): void;
  removePhoto(): void;
  /** `save` is the one act — *Save*, or *Done* once the photo alone failed; `retry-photo` sends the photo alone. */
  press(act: 'save' | 'retry-photo'): void;
}

type EditorEvent =
  | FirstRunProfileEvent
  | { readonly type: 'open'; readonly name: string; readonly saved: SavedPhoto }
  | { readonly type: 'close' };

interface EditorState {
  readonly isOpen: boolean;
  readonly flow: FirstRunProfileState;
}

const CLOSED: EditorState = {
  isOpen: false,
  flow: profileEditorStart('', { held: false, picture: null }),
};

function editorReducer(state: EditorState, event: EditorEvent): EditorState {
  switch (event.type) {
    case 'open':
      return { isOpen: true, flow: profileEditorStart(event.name, event.saved) };
    case 'close':
      return isBusy(state.flow) ? state : { ...state, isOpen: false };
    default:
      return state.isOpen ? { ...state, flow: firstRunProfileReducer(state.flow, event) } : state;
  }
}

function pictureOf(flow: FirstRunProfileState): string | undefined {
  const { photo } = flow;
  const held = photo.kind === 'saved' || photo.kind === 'chosen';
  return held ? (photo.picture ?? undefined) : undefined;
}

function isBusy(flow: FirstRunProfileState): boolean {
  return firstRunProfileFrame(flow).busy;
}

/**
 * The name and photo editor over domain's first-run flow (`profileEditorStart`), sent by the same
 * `useProfileSend` the first run uses. A saved name is read back into the session at once, so the
 * page and the account menu follow while the photo is still on its way; once the editor is done,
 * my photo is read again and the editor closes.
 */
export function useNameAndPhotoEditor(): NameAndPhotoEditor {
  const { session } = useDataLayer();
  const cache = useQueryClient();
  const [editor, dispatch] = useReducer(editorReducer, CLOSED);
  const chosen = useRef<ChosenPicture | null>(null);
  const tenantId = session.getSnapshot().user?.tenant?.id ?? '';
  useProfileSend(editor.isOpen ? editor.flow : null, dispatch, chosen, {
    onNameSaved: () => void session.rereadUser(),
    onDone: () => {
      void cache.invalidateQueries({ queryKey: queryKeys.myPhoto(tenantId) });
      chosen.current = null;
      dispatch({ type: 'close' });
    },
  });

  const open = useCallback((name: string, saved: SavedPhoto) => {
    chosen.current = null;
    dispatch({ type: 'open', name, saved });
  }, []);
  // While a save is out the reducer takes no photo: the one held for sending must not move either.
  // Read at the moment a picker answers, which may be after the render that handed it the act.
  const busy = useRef(false);
  busy.current = isBusy(editor.flow);

  return useMemo(
    () => ({
      isOpen: editor.isOpen,
      state: editor.flow,
      frame: firstRunProfileFrame(editor.flow),
      picture: pictureOf(editor.flow),
      open,
      close: () => dispatch({ type: 'close' }),
      typeName: (name: string) => dispatch({ type: 'name-typed', name }),
      choosePhoto: (image: ChosenPicture) => {
        if (busy.current) return;
        chosen.current = image;
        dispatch({ type: 'photo-chosen', image });
      },
      removePhoto: () => {
        if (busy.current) return;
        chosen.current = null;
        dispatch({ type: 'photo-removed' });
      },
      press: (act: 'save' | 'retry-photo') => dispatch({ type: act }),
    }),
    [editor, open],
  );
}
