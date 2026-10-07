import type { CreateTenant } from '@heliogrid/contracts';
import { Controller, type UseFormReturn } from '@heliogrid/forms';
import { COMPANY_SIGNUP, companyFieldRefusal } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Input } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/**
 * The three fields and no fourth (`M01-01`). Each answers for itself when Create company is
 * pressed, both messages at once (`SCR-M01-02`, the fields-invalid state); the primary is never
 * gated on them. Each field reads only its own error, so a keystroke re-renders one input — a
 * controlled native input whose value lags the keyboard drops characters.
 */
export function CompanyFields({
  form,
  underAccount = false,
  withHelpers = true,
}: {
  form: UseFormReturn<CreateTenant>;
  /**
   * The fields sit under the verified account, which takes the wider gap; a title or a block takes
   * the board's sp-5.
   */
  underAccount?: boolean;
  /** Under the join steer the fields carry no helper: the steer's one sentence is its finding. */
  withHelpers?: boolean;
}) {
  const t = useTranslate();
  return (
    <View style={[styles.fields, underAccount ? styles.fieldsUnderAccount : null]}>
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
    </View>
  );
}
