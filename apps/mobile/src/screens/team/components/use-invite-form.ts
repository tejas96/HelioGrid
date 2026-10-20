import type { Invite } from '@heliogrid/data/react';
import { fieldBinder, useZodForm } from '@heliogrid/forms';
import { inviteFieldWords, inviteWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { type FocusHandle, type InviteEditorProps, useFormat } from '@heliogrid/ui';
import { useRef } from 'react';

/** The form's half of an invite host — the editor over Team and the setup step take the same. */
export type InviteFormFields = Pick<
  InviteEditorProps,
  'bind' | 'roles' | 'sending' | 'presses' | 'refusal' | 'phoneRef' | 'onDifferentNumber' | 'onSend'
>;

/**
 * The invite form over the contract's schema, bound to one send (`useInvite` or `useSetupInvite`):
 * each field answers in `inviteFieldWords`, *Use a different number* clears the number and focuses
 * it, and a send that did not go out keeps the form and says so in a toast. A 403 says the reader
 * no longer invites, then `onForbidden` lets the host move on. The form library and the words may
 * meet only in an app (`architecture.md` §2).
 */
export function useInviteForm(
  invite: Invite,
  push: (toast: { tone: 'danger'; title: string }) => void,
  onForbidden: () => void | Promise<void>,
) {
  const { t } = useI18n();
  const { pack } = useFormat();
  const words = inviteWords(t);
  const form = useZodForm(invite.schema, {
    defaultValues: { inviteeName: '', phoneE164: '', roles: [] },
  });
  const phone = useRef<FocusHandle>(null);
  const fields: InviteFormFields = {
    bind: fieldBinder(form.control, (name, field) => inviteFieldWords(words, pack, name, field)),
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
          push({ tone: 'danger', title: words.forbidden });
          await onForbidden();
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
    fields,
    /** Empties the form and takes any refusal down — the editor opened again. */
    reset: () => {
      form.reset();
      invite.clearRefusal();
    },
  };
}
