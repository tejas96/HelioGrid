import { type EditLead, type LeadField, leadFieldSchema } from '@heliogrid/contracts';
import { minorUnits, minorUnitsOfDecimal } from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';

/**
 * A lead's editable facts (`M02-36`, `M02-37`, `M02-39`), each as the timeline records it — text,
 * an amount, a vocabulary key, `true` or `false`; `null` is a gap.
 */
export type LeadFieldTexts = Readonly<Record<LeadField, string | null>>;

/** The facts as the lead and its customer hold them; the bill in the currency's minor unit. */
export interface LeadFieldValues {
  readonly name: string | null;
  readonly city: string | null;
  readonly segment: string | null;
  readonly monthlyBillMinor: number | null;
  readonly roofOwnership: string | null;
  readonly roofType: string | null;
  readonly shading: string | null;
  readonly timeline: string | null;
  readonly decisionMaker: string | null;
  readonly preferredLanguage: string | null;
  readonly doNotCall: boolean;
}

/** Each fact as its timeline text, the bill scaled to the tenant currency's digits. */
export function fieldTextsOf(values: LeadFieldValues, minorUnitDigits: number): LeadFieldTexts {
  const { monthlyBillMinor, doNotCall, ...plain } = values;
  return {
    ...plain,
    monthlyBill:
      monthlyBillMinor === null
        ? null
        : minorUnitsToDecimal(minorUnits(monthlyBillMinor), minorUnitDigits),
    doNotCall: String(doNotCall),
  };
}

/** The fields one edit sends, without the moment it was made. */
export type LeadFieldEdit = Omit<EditLead, 'capturedAt'>;

/**
 * What an edit sends, as timeline texts: a bill re-scaled so `1500` and `1500.00` are one amount.
 * The service has already refused a bill finer than the currency's minor unit.
 */
export function sentTextsOf(edit: LeadFieldEdit, minorUnitDigits: number): Partial<LeadFieldTexts> {
  const { monthlyBill, doNotCall, ...plain } = edit;
  const bill =
    monthlyBill === undefined
      ? {}
      : {
          monthlyBill:
            monthlyBill === null
              ? null
              : minorUnitsToDecimal(
                  minorUnitsOfDecimal(monthlyBill, minorUnitDigits),
                  minorUnitDigits,
                ),
        };
  return {
    ...plain,
    ...bill,
    ...(doNotCall === undefined ? {} : { doNotCall: String(doNotCall) }),
  };
}

/** One applied change, as its `field_change` entry records it. */
export interface FieldChange {
  readonly field: LeadField;
  readonly from: string | null;
  readonly to: string | null;
}

/**
 * The fields an edit changes, in the contract's field order. A field not sent is no change, and
 * neither is one sent as it is stored (`F4-16`: an unchanged value writes nothing).
 */
export function fieldChangesOf(
  stored: LeadFieldTexts,
  sent: Partial<LeadFieldTexts>,
): FieldChange[] {
  return leadFieldSchema.options.flatMap((field) => {
    const to = sent[field];
    if (to === undefined) return [];
    const from = stored[field];
    return to === from ? [] : [{ field, from, to }];
  });
}
