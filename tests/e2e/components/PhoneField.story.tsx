import type { TranslatedText } from '@heliogrid/contracts';
import { createTranslator, phoneFieldWords } from '@heliogrid/i18n';
import { PhoneField } from '@heliogrid/ui';
import { useState } from 'react';

/* The spoken number is a function the field calls while it renders, so it is bound here, in the
   browser, never handed across from the test. */
const words = phoneFieldWords((await createTranslator('en')).t);

/**
 * A field that holds what it is handed, as a screen does. `PhoneField` is controlled, and a value
 * handed to `mount` never changes, so the state lives here, in the browser.
 */
export function HeldPhoneField({ label }: { label: TranslatedText }) {
  const [value, setValue] = useState('');
  return (
    <div>
      <PhoneField label={label} words={words} value={value} onChange={setValue} />
      <output data-testid="held">{value}</output>
    </div>
  );
}
