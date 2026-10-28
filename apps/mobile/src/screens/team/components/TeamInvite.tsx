import { useInvite } from '@heliogrid/data/react';
import {
  Button,
  closeKeyboard,
  type FocusHandle,
  type InviteEditorProps,
  ShellGlyph,
  useFormat,
} from '@heliogrid/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInviteForm } from './use-invite-form';

/**
 * Invite Teammate in Team's life: the sheet's open fact over the shared form (`useInviteForm`). A
 * sent invite closes the sheet and reads the list again; a 403 shuts it and reads the team again
 * (AC-19).
 */
export function useTeamInvite(
  reread: () => Promise<unknown>,
  push: (toast: { tone: 'danger'; title: string }) => void,
) {
  const { pack } = useFormat();
  const [isOpen, setOpen] = useState(false);
  /* The native sheet returns no focus: the screen reader's place goes back to *Invite teammate*.
     The sheet's field lets go first (`closeKeyboard` blurs it): on Android a focused field that
     unmounts hands the keyboard's focus to the page's next field, Team's search. Stable, as the
     sheet's close handler. */
  const act = useRef<FocusHandle>(null);
  /* The teaching state's *Invite your first teammate* has its own handle: after a first invite the
     list redraws and the lead *Invite teammate* is the one to wait for. */
  const first = useRef<FocusHandle>(null);
  const close = useCallback(() => {
    closeKeyboard();
    setOpen(false);
    (act.current ?? first.current)?.focus();
  }, []);
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
    first,
    editor,
    open: () => {
      reset();
      setOpen(true);
    },
  };
}

/**
 * *Invite teammate*, full width above the list head (`SCR-M01-12` m-default), or, `first`, the
 * teaching state's *Invite your first teammate* under its words (m-teaching).
 */
export function InviteTeammate({
  invite,
  first = false,
}: {
  invite: ReturnType<typeof useTeamInvite>;
  first?: boolean;
}) {
  return (
    <Button
      ref={first ? invite.first : invite.act}
      variant="primary"
      size="lg"
      fullWidth={!first}
      icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
      onClick={invite.open}
    >
      {first ? invite.words.inviteFirst : invite.words.inviteTeammate}
    </Button>
  );
}
