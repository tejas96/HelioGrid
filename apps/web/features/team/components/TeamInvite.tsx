'use client';
import { useInvite } from '@heliogrid/data/react';
import { type FocusHandle, type InviteEditorProps, useFormat } from '@heliogrid/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInviteForm } from './use-invite-form';

/**
 * Invite Teammate in Team's life: the editor's open fact over the shared form (`useInviteForm`). A
 * sent invite closes the editor and reads the list again; a 403 shuts it and reads the team again
 * (AC-19).
 */
export function useTeamInvite(
  reread: () => Promise<unknown>,
  push: (toast: { tone: 'danger'; title: string }) => void,
) {
  const { pack } = useFormat();
  const [isOpen, setOpen] = useState(false);
  /* Stable: the overlay re-runs its focus effect whenever its close handler changes, and it
     returns focus to the act that opened it. */
  const act = useRef<FocusHandle>(null);
  const close = useCallback(() => setOpen(false), []);
  /* The first invite ends the teaching state, and with it the act that opened the editor: once the
     list draws *Invite teammate* again, the focus goes there. Checked after each render, since the
     list's read settles before the screen draws it. */
  const [refocus, setRefocus] = useState(false);
  useEffect(() => {
    if (!refocus || act.current === null) return;
    act.current.focus();
    setRefocus(false);
  });
  const invite = useInvite(pack, async () => {
    close();
    await reread();
    setRefocus(true);
  });
  const { words, fields, reset } = useInviteForm(invite, push, async () => {
    close();
    await reread();
  });
  const editor: InviteEditorProps = {
    ...fields,
    open: isOpen,
    onClose: close,
    words,
  };
  return {
    words,
    act,
    editor,
    open: () => {
      reset();
      setOpen(true);
    },
  };
}
