'use client';
import { useInvite } from '@heliogrid/data/react';
import { fieldBinder, useZodForm } from '@heliogrid/forms';
import { inviteFieldWords, inviteWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { type FocusHandle, type InviteEditorProps, useFormat } from '@heliogrid/ui';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const form = useZodForm(invite.schema, {
    defaultValues: { inviteeName: '', phoneE164: '', roles: [] },
  });
  const phone = useRef<FocusHandle>(null);
  const editor: InviteEditorProps = {
    open: isOpen,
    onClose: close,
    bind: fieldBinder(form.control, (name, field) => inviteFieldWords(words, pack, name, field)),
    words,
    roles: words.roles,
    sending: invite.sending,
    presses: form.formState.submitCount,
    refusal: invite.refusal,
    phoneRef: phone,
    onDifferentNumber: () => {
      form.setValue('phoneE164', '');
      invite.clearRefusal();
      phone.current?.focus();
    },
    onSend: form.handleSubmit(async (values) => {
      const read = await invite.send(values);
      switch (read) {
        case 'failed':
        /* A 401 the session store did not end the session on says the same: nothing went out. */
        case 'signed_out':
          push({ tone: 'danger', title: words.failed });
          return;
        case 'forbidden':
          /* The reader no longer invites: say so, shut the editor and read the team again (AC-19). */
          push({ tone: 'danger', title: words.forbidden });
          close();
          await reread();
          return;
        case 'sent':
        case 'already_member':
        case 'already_invited':
        case 'not_covered':
        case 'cap':
        case null:
          return;
        default:
          read satisfies never;
      }
    }),
  };
  return {
    words,
    act,
    editor,
    open: () => {
      form.reset();
      invite.clearRefusal();
      setOpen(true);
    },
  };
}
