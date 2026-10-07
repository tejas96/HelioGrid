import type { CreateTenant } from '@heliogrid/contracts';
import { Controller, type UseFormReturn } from '@heliogrid/forms';
import { COMPANY_SIGNUP, companyFieldRefusal } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Input } from '@heliogrid/ui';

/**
 * The three fields and no fourth (`M01-01`): the company name across the measure, your name and
 * the city sharing the row beneath it from the door's breakpoint (`SCR-M01-02` decision 12). Each
 * answers for itself when Create company is pressed, all messages at once (the fields-invalid
 * state); the primary is never gated on them. Under the join steer the fields carry no helper: the
 * steer's one sentence is its finding (`SCR-M01-02` word inventory).
 */
export function CompanyFields({
  form,
  withHelpers = true,
}: {
  form: UseFormReturn<CreateTenant>;
  withHelpers?: boolean;
}) {
  const t = useTranslate();
  return (
    <div className="hg-signup-fields">
      <Controller
        control={form.control}
        name="companyName"
        render={({ field, fieldState }) => (
          <Input
            label={t(COMPANY_SIGNUP.companyName)}
            placeholder={t(COMPANY_SIGNUP.companyNameExample)}
            value={field.value}
            onChange={field.onChange}
            error={companyFieldRefusal(t, 'companyName', fieldState.error)}
          />
        )}
      />
      <div className="hg-signup-two-up">
        <Controller
          control={form.control}
          name="ownerName"
          render={({ field, fieldState }) => (
            <Input
              label={t(COMPANY_SIGNUP.yourName)}
              placeholder={t(COMPANY_SIGNUP.yourNameExample)}
              value={field.value}
              onChange={field.onChange}
              helper={withHelpers ? t(COMPANY_SIGNUP.firstOwner) : undefined}
              error={companyFieldRefusal(t, 'ownerName', fieldState.error)}
            />
          )}
        />
        <Controller
          control={form.control}
          name="city"
          render={({ field, fieldState }) => (
            <Input
              label={t(COMPANY_SIGNUP.city)}
              placeholder={t(COMPANY_SIGNUP.cityExample)}
              value={field.value}
              onChange={field.onChange}
              helper={withHelpers ? t(COMPANY_SIGNUP.whereBased) : undefined}
              error={companyFieldRefusal(t, 'city', fieldState.error)}
            />
          )}
        />
      </div>
    </div>
  );
}
