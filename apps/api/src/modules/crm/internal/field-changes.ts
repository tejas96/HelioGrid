import { type LeadField, type LeadFields, leadFieldSchema } from '@heliogrid/contracts';
import { minorUnits, minorUnitsOfDecimal, pinRecordText } from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';
import { sitePinOf } from './site-pin';

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
  readonly siteAddress: string | null;
  readonly siteArea: string | null;
  readonly siteDistrict: string | null;
  readonly sanctionedLoadKw: number | null;
  readonly supplyPhase: string | null;
  readonly siteName: string | null;
  readonly siteLatitude: number | null;
  readonly siteLongitude: number | null;
  readonly utilityOperator: string | null;
}

/** A site's region and district as one timeline text — the district first, as a person says it. */
export function areaTextOf(area: string | null, district: string | null): string | null {
  if (area === null) return null;
  return district === null ? area : `${district} · ${area}`;
}

/** Each fact as its timeline text, the bill scaled to the tenant currency's digits. */
export function fieldTextsOf(values: LeadFieldValues, minorUnitDigits: number): LeadFieldTexts {
  const {
    monthlyBillMinor,
    doNotCall,
    siteArea,
    siteDistrict,
    sanctionedLoadKw,
    siteLatitude,
    siteLongitude,
    ...plain
  } = values;
  const pin = sitePinOf(siteLatitude, siteLongitude);
  return {
    ...plain,
    area: areaTextOf(siteArea, siteDistrict),
    sitePin: pin === null ? null : pinRecordText(pin),
    sanctionedLoadKw: sanctionedLoadKw === null ? null : String(sanctionedLoadKw),
    monthlyBill:
      monthlyBillMinor === null
        ? null
        : minorUnitsToDecimal(minorUnits(monthlyBillMinor), minorUnitDigits),
    doNotCall: String(doNotCall),
  };
}

/** The fields one edit sends, without the moment it was made. */
/** The fields one edit sets: a person's lead edit, or the studio's Site details with its pin. */
export type LeadFieldEdit = Partial<LeadFields>;

/**
 * What an edit sends, as timeline texts: a bill re-scaled so `1500` and `1500.00` are one amount.
 * The service has already refused a bill finer than the currency's minor unit.
 */
export function sentTextsOf(edit: LeadFieldEdit, minorUnitDigits: number): Partial<LeadFieldTexts> {
  const { monthlyBill, doNotCall, area, sanctionedLoadKw, sitePin, ...plain } = edit;
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
    ...(area === undefined
      ? {}
      : { area: area === null ? null : areaTextOf(area.area, area.district) }),
    ...(sanctionedLoadKw === undefined
      ? {}
      : { sanctionedLoadKw: sanctionedLoadKw === null ? null : String(sanctionedLoadKw) }),
    ...(sitePin === undefined ? {} : { sitePin: sitePin === null ? null : pinRecordText(sitePin) }),
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
