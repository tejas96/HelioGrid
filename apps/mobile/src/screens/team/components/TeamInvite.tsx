import type { TranslatedText } from '@heliogrid/contracts';
import type { TeamInviteEditor } from '@heliogrid/data/react';
import {
  Button,
  closeKeyboard,
  type FocusHandle,
  type InviteEditorProps,
  ShellGlyph,
} from '@heliogrid/ui';
import { type RefObject, useEffect, useRef } from 'react';
import { useInviteForm } from './use-invite-form';

/** *Invite teammate* and the teaching state's *Invite your first teammate*, and the way back to them. */
export interface InviteActs {
  readonly act: RefObject<FocusHandle | null>;
  /**
   * The teaching state's *Invite your first teammate* has its own handle: after a first invite the
   * list redraws and the lead *Invite teammate* is the one to wait for.
   */
  readonly first: RefObject<FocusHandle | null>;
  /** Invite Teammate shut: the screen reader's place goes back to the act that opened it. */
  giveBack(): void;
}

/**
 * The native sheet returns no focus: the screen reader's place goes back to *Invite teammate*. The
 * sheet's field lets go first (`closeKeyboard` blurs it): on Android a focused field that unmounts
 * hands the keyboard's focus to the page's next field, Team's search.
 */
export function useInviteActs(): InviteActs {
  const act = useRef<FocusHandle>(null);
  const first = useRef<FocusHandle>(null);
  return {
    act,
    first,
    giveBack: () => {
      closeKeyboard();
      (act.current ?? first.current)?.focus();
    },
  };
}

/**
 * Invite Teammate in Team's life: `useTeamScreen`'s open fact and send under the shared form
 * (`useInviteForm`). A sent invite closes the sheet and reads the list again; a 403 shuts it and
 * reads the team again (AC-19).
 */
export function useTeamInvite(
  invite: TeamInviteEditor,
  acts: InviteActs,
  push: (toast: { tone: 'danger'; title: TranslatedText }) => void,
) {
  /* The first invite ends the teaching state, and with it the act that opened the editor: once the
     list draws *Invite teammate* again, the focus goes there. Checked after each render, since the
     list's read settles before the screen draws it. */
  useEffect(() => {
    if (!invite.refocus || acts.act.current === null) return;
    acts.act.current.focus();
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
    act: acts.act,
    first: acts.first,
    editor,
    open: () => {
      reset();
      invite.open();
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
