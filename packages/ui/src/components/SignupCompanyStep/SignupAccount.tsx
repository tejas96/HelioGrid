import { ShellGlyph } from '../AppShell/ShellGlyph';
import { PhoneValue } from '../PhoneField/PhoneField';
import { StatusChip } from '../StatusChip/StatusChip';
import type { SignupAccountProps } from './SignupCompanyStep.types';

/** The verified number as a fact: a green-lit chip with the phone, the number in mono and its status. */
export function SignupAccount({ words, phoneE164 }: SignupAccountProps) {
  return (
    <div className="hg-signup-account">
      <span className="hg-signup-account-glyph" aria-hidden="true">
        <ShellGlyph name="phone" size="sm" tone="success" />
      </span>
      <PhoneValue label={words.label} value={phoneE164} />
      <StatusChip status="verified" label={words.verified} tone="success" />
    </div>
  );
}
