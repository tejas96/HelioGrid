import { type InviteRefusal, ROLE_PRESETS, type UiLanguage } from '@heliogrid/domain';
import { createTranslator, inviteWords, setupInviteWords } from '@heliogrid/i18n';
import { type InviteFieldBinder, SetupInviteTeam } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * The setup step as its screen holds it, its words `inviteWords` and `setupInviteWords` in the
 * reader's language — they hold the ask's pager, a function, so they cannot come through `mount`.
 * The fields keep what is typed; each act writes its name to `pressed`, where a spec reads it.
 */
export function SetupInviteTeamAsHeld({
  reader,
  refusal = null,
}: {
  reader: UiLanguage;
  refusal?: InviteRefusal | null;
}) {
  const { t } = READERS[reader];
  const form = inviteWords(t);
  const [values, setValues] = useState({
    inviteeName: '',
    phoneE164: '',
    roles: [ROLE_PRESETS[3]],
  });
  const [pressed, setPressed] = useState('');
  const bind = ((field: keyof typeof values, draw: (state: never) => unknown) =>
    draw({
      value: values[field],
      onChange: (value: unknown) => setValues((now) => ({ ...now, [field]: value })),
      error: undefined,
    } as never)) as InviteFieldBinder;
  return (
    <div lang={reader}>
      <SetupInviteTeam
        bind={bind}
        words={{ ...form, ...setupInviteWords(t) }}
        roles={form.roles}
        sending={false}
        leaving={false}
        refusal={refusal}
        onSend={() => setPressed('send')}
        onSkip={() => setPressed('skip')}
        onOpenTeam={() => setPressed('open-team')}
        onDifferentNumber={() => setPressed('different-number')}
      />
      <output data-testid="pressed">{pressed}</output>
    </div>
  );
}
