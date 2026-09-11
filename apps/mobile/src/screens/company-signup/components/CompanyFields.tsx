import type { CreateTenant } from '@heliogrid/contracts';
import { Controller, type FieldErrors, type UseFormReturn } from '@heliogrid/forms';
import { COMPANY_FIELD_NEEDED, COMPANY_SIGNUP } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Input } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/** A missing detail says why it is needed, never a scold; any other refusal keeps the wire's words. */
const MISSING = new Set(['too_small', 'invalid_type']);

type FieldRefusal = FieldErrors<CreateTenant>[keyof CreateTenant];

/**
 * The three fields and no fourth (`M01-01`). Each answers for itself when Create company is
 * pressed, both messages at once (`SCR-M01-02`, the fields-invalid state); the primary is never
 * gated on them. Each field reads only its own error, so a keystroke re-renders one input — a
 * controlled native input whose value lags the keyboard drops characters.
 */
export function CompanyFields({
  form,
  afterBlock,
}: {
  form: UseFormReturn<CreateTenant>;
  afterBlock: boolean;
}) {
  const t = useTranslate();
  const refusal = (field: keyof CreateTenant, error: FieldRefusal) => {
    if (error === undefined) return undefined;
    return MISSING.has(String(error.type)) ? t(COMPANY_FIELD_NEEDED[field]) : error.message;
  };
  return (
    <View style={[styles.fields, afterBlock ? styles.fieldsAfterBlock : null]}>
      <Controller
        control={form.control}
        name="companyName"
        render={({ field, fieldState }) => (
          <Input
            label={t(COMPANY_SIGNUP.companyName)}
            placeholder={t(COMPANY_SIGNUP.companyNameExample)}
            value={field.value}
            onChange={field.onChange}
            error={refusal('companyName', fieldState.error)}
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
            helper={t(COMPANY_SIGNUP.firstOwner)}
            error={refusal('ownerName', fieldState.error)}
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
            helper={t(COMPANY_SIGNUP.whereBased)}
            error={refusal('city', fieldState.error)}
          />
        )}
      />
    </View>
  );
}
