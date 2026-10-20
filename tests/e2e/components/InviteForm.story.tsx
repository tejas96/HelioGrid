import { type CreateInvitation, inviteFormSchema } from '@heliogrid/contracts';
import { IN_FORMATS, type InviteRefusal, type UiLanguage } from '@heliogrid/domain';
import { createTranslator, inviteFieldWords, inviteWords } from '@heliogrid/i18n';
import { Button, type InviteFieldBinder, InviteForm } from '@heliogrid/ui';
import { useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

type Errors = Partial<Record<keyof CreateInvitation, { message?: string }>>;

/**
 * The invite form as a screen holds it: the values live here, in the browser, and a press checks
 * them with the screens' own schema (`inviteFormSchema`), each field answering in
 * `inviteFieldWords`. The apps bind through `@heliogrid/forms`, which this package may not import
 * (`turbo.json` boundaries); the schema and the words are the ones they run. The words hold the
 * ask's pager, a function, so they cannot come through `mount`.
 */
export function InviteFormAsHeld({
  reader,
  layout,
  heading,
  name = '',
  refusal = null,
}: {
  reader: UiLanguage;
  layout?: 'stacked' | 'wide';
  heading?: 'section' | 'quiet';
  name?: string;
  refusal?: InviteRefusal | null;
}) {
  const words = inviteWords(READERS[reader].t);
  const [values, setValues] = useState<CreateInvitation>({
    inviteeName: name,
    phoneE164: '',
    roles: [],
  });
  const [errors, setErrors] = useState<Errors>({});
  const [presses, setPresses] = useState(0);
  const [sent, setSent] = useState(false);
  const bind = ((field: keyof CreateInvitation, draw: (state: never) => unknown) =>
    draw({
      value: values[field],
      onChange: (value: unknown) => setValues((now) => ({ ...now, [field]: value })),
      ...inviteFieldWords(words, IN_FORMATS, field, { value: values[field], error: errors[field] }),
    } as never)) as InviteFieldBinder;
  const press = () => {
    const parsed = inviteFormSchema(IN_FORMATS).safeParse(values);
    const found: Errors = {};
    for (const issue of parsed.success ? [] : parsed.error.issues) {
      found[issue.path[0] as keyof CreateInvitation] ??= { message: issue.message };
    }
    setErrors(found);
    setPresses((n) => n + 1);
    setSent(parsed.success);
  };
  return (
    /* A screen's side gutter: the role list's error ring sits 6px outside its cards. */
    <div lang={reader} style={{ padding: '0 var(--screen-pad-mobile)' }}>
      <InviteForm
        bind={bind}
        words={words}
        roles={words.roles}
        layout={layout}
        heading={heading}
        presses={presses}
        refusal={refusal}
      />
      <Button onClick={press}>{words.send}</Button>
      <output data-testid="sent">{sent ? 'sent' : ''}</output>
    </div>
  );
}
