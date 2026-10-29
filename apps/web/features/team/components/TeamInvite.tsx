'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { TeamInviteEditor } from '@heliogrid/data/react';
import type { FocusHandle, InviteEditorProps } from '@heliogrid/ui';
import { useEffect, useRef } from 'react';
import { useInviteForm } from './use-invite-form';

/**
 * Invite Teammate in Team's life: `useTeamScreen`'s open fact and send under the shared form
 * (`useInviteForm`). A sent invite closes the editor and reads the list again; a 403 shuts it and
 * reads the team again (AC-19). The overlay returns focus to the act that opened it.
 */
export function useTeamInvite(
  invite: TeamInviteEditor,
  push: (toast: { tone: 'danger'; title: TranslatedText }) => void,
) {
  const act = useRef<FocusHandle>(null);
  /* The first invite ends the teaching state, and with it the act that opened the editor: once the
     list draws *Invite teammate* again, the focus goes there. Checked after each render, since the
     list's read settles before the screen draws it. */
  useEffect(() => {
    if (!invite.refocus || act.current === null) return;
    act.current.focus();
    invite.refocused();
  });
  const { words, fields, reset } = useInviteForm(invite.send, push, invite.forbidden);
  const editor: InviteEditorProps = {
    ...fields,
    open: invite.isOpen,
    onClose: invite.close,
    words,
  };
  return {
    words,
    act,
    editor,
    open: () => {
      reset();
      invite.open();
    },
  };
}
