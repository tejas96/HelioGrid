'use client';
import { useInvite } from '@heliogrid/data/react';
import { fieldBinder, useZodForm } from '@heliogrid/forms';
import { inviteFieldWords, inviteWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { type InviteEditorProps, useFormat } from '@heliogrid/ui';
import { useCallback, useState } from 'react';

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
     returns focus to *Invite teammate* itself. */
  const close = useCallback(() => setOpen(false), []);
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
    editor,
    open: () => {
      form.reset();
      setOpen(true);
    },
  };
}
