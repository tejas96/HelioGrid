import { PhoneField } from '@heliogrid/ui';
import { useState } from 'react';

/**
 * A field that holds what it is handed, as a screen does. `PhoneField` is controlled, and a value
 * handed to `mount` never changes, so the state lives here, in the browser.
 */
export function HeldPhoneField({ label }: { label: string }) {
  const [value, setValue] = useState('');
  return (
    <div>
      <PhoneField label={label} value={value} onChange={setValue} />
      <output data-testid="held">{value}</output>
    </div>
  );
}
