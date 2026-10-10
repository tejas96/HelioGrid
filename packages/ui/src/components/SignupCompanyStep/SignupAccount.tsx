import { PhoneValue } from '../PhoneField/PhoneField';
import { StatusChip } from '../StatusChip/StatusChip';
import type { SignupAccountProps } from './SignupCompanyStep.types';

export function SignupAccount({ words, phoneE164 }: SignupAccountProps) {
  return (
    <div className="hg-signup-account">
      <PhoneValue label={words.label} value={phoneE164} />
      <StatusChip status="verified" label={words.verified} tone="success" />
    </div>
  );
}
