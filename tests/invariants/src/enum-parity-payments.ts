import { paymentEntryKindSchema, scheduleSourceSchema } from '@heliogrid/contracts';

/** The payments' pg enums (migration 0062) → the contract schema each must match, exactly. */
export const PAYMENT_ENUMS: Record<string, { options: readonly string[]; contract: string }> = {
  payment_entry_kind: {
    options: paymentEntryKindSchema.options,
    contract: 'paymentEntryKindSchema',
  },
  schedule_source: { options: scheduleSourceSchema.options, contract: 'scheduleSourceSchema' },
};
