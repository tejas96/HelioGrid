import { useInvite } from '@heliogrid/data/react';
import { fieldBinder, useZodForm } from '@heliogrid/forms';
import { inviteFieldWords, inviteWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  Button,
  type FocusHandle,
  type InviteEditorProps,
  ShellGlyph,
  useFormat,
} from '@heliogrid/ui';
import { useCallback, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

/**
 * Invite Teammate in Team's life: the editor's open fact, the form over the contract's schema, and
 * the send. A sent invite closes the editor and reads the list again; one that did not go out keeps
 * the form and says so. The web and the phone compose it alike; the form library and the words may
 * meet only in an app (`architecture.md` §2).
 */
export function useTeamInvite(
  reread: () => Promise<unknown>,
  push: (toast: { tone: 'danger'; title: string }) => void,
) {
  const { t } = useI18n();
  const { pack } = useFormat();
  const words = inviteWords(t);
  const [isOpen, setOpen] = useState(false);
  /* The native sheet returns no focus: the screen reader's place goes back to *Invite teammate*.
     The sheet's field lets go first (`Keyboard.dismiss` blurs it): on Android a focused field that
     unmounts hands the keyboard's focus to the page's next field, Team's search. Stable, as the
     sheet's close handler. */
  const act = useRef<FocusHandle>(null);
  const close = useCallback(() => {
    Keyboard.dismiss();
    setOpen(false);
    act.current?.focus();
  }, []);
  const invite = useInvite(pack, async () => {
    close();
    await reread();
  });
  const form = useZodForm(invite.schema, {
    defaultValues: { inviteeName: '', phoneE164: '', roles: [] },
  });
  const editor: InviteEditorProps = {
    open: isOpen,
    onClose: close,
    bind: fieldBinder(form.control, (name, field) => inviteFieldWords(words, pack, name, field)),
    words,
    roles: words.roles,
    sending: invite.sending,
    presses: form.formState.submitCount,
    onSend: form.handleSubmit(async (values) => {
      if ((await invite.send(values)) === 'failed') push({ tone: 'danger', title: words.failed });
    }),
  };
  return {
    words,
    act,
    editor,
    open: () => {
      form.reset();
      setOpen(true);
    },
  };
}

/** *Invite teammate*, full width above the list head (`SCR-M01-12` m-default). */
export function InviteTeammate({ invite }: { invite: ReturnType<typeof useTeamInvite> }) {
  return (
    <Button
      ref={invite.act}
      variant="primary"
      size="lg"
      fullWidth
      icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
      onClick={invite.open}
    >
      {invite.words.inviteTeammate}
    </Button>
  );
}
