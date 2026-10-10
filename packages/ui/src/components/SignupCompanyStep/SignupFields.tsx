import { Input } from '../Input/Input';
import type { SignupFieldState, SignupFieldsProps } from './SignupCompanyStep.types';

function drawField(field: SignupFieldState) {
  return (
    <Input
      label={field.label}
      placeholder={field.placeholder}
      value={field.value}
      onChange={field.onChange}
      helper={field.helper}
      error={field.error}
    />
  );
}

export function SignupFields({ bind }: SignupFieldsProps) {
  return (
    <div className="hg-signup-fields">
      {bind('companyName', drawField)}
      <div className="hg-signup-two-up">
        {bind('ownerName', drawField)}
        {bind('city', drawField)}
      </div>
    </div>
  );
}
