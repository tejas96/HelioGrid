import { userAccount } from '@heliogrid/db';
import type { MeasurementSystem, NumberEntry, StudioHelper, UiLanguage } from '@heliogrid/domain';

/** An account as the session reads it: who the person is, and the picks that follow them. */
export interface AccountRow {
  readonly id: string;
  readonly phoneE164: string;
  readonly name: string | null;
  readonly interfaceLanguage: UiLanguage;
  readonly unitPreference: MeasurementSystem;
  readonly studioHelpersOff: readonly StudioHelper[];
  readonly numberEntry: NumberEntry;
}

export function accountColumns() {
  return {
    id: userAccount.id,
    phoneE164: userAccount.phoneE164,
    name: userAccount.name,
    interfaceLanguage: userAccount.interfaceLanguage,
    unitPreference: userAccount.unitPreference,
    studioHelpersOff: userAccount.studioHelpersOff,
    numberEntry: userAccount.numberEntry,
  };
}
