import type {
  GenerateBlockWire,
  GenerateVerdictWire,
  GenerateWarningWire,
} from '@heliogrid/contracts';
import {
  type FormatPack,
  type GenerateBlock,
  type GenerateVerdict,
  type GenerateWarning,
  minorUnitsOfDecimal,
  REQUIRED_FIELDS,
  SKIP_REASONS,
  type SkippedCheck,
} from '@heliogrid/domain';

/**
 * The Generate checklist as the server worked it out (`M06-23`), read back into domain's shape so
 * the check sheet's words are built over the one vocabulary. Nothing is judged here. A finding this
 * build cannot read — a check a newer server has learned, or one sent without its facts — is left
 * out of the list; `canGenerate` stays the server's own, so a block is never passed by.
 */

const has = <T>(value: T | undefined): value is T => value !== undefined;

type At = Pick<GenerateBlock, 'step' | 'fields'>;
type BlockRead = (wire: GenerateBlockWire, at: At, formats: FormatPack) => GenerateBlock | null;

const BLOCK: Readonly<Record<GenerateBlock['check'], BlockRead>> = {
  component_missing: ({ category }, at) =>
    has(category) ? { ...at, check: 'component_missing', category } : null,
  component_count_missing: ({ category, brand }, at) =>
    has(category) && has(brand)
      ? { ...at, check: 'component_count_missing', category, brand }
      : null,
  battery_required: ({ systemType }, at) =>
    has(systemType) ? { ...at, check: 'battery_required', systemType } : null,
  payable_not_positive: ({ payable }, at, formats) =>
    has(payable)
      ? {
          ...at,
          check: 'payable_not_positive',
          payable: minorUnitsOfDecimal(payable, formats.minorUnitDigits),
        }
      : null,
  tax_rates_undeclared: (_, at) => ({ ...at, check: 'tax_rates_undeclared' }),
  tranches_not_whole: ({ allocatedPercent, remainderPercent }, at) =>
    has(allocatedPercent) && has(remainderPercent)
      ? {
          ...at,
          check: 'tranches_not_whole',
          allocated: Number(allocatedPercent),
          remainder: Number(remainderPercent),
        }
      : null,
  field_missing: (wire, at) => {
    const field = REQUIRED_FIELDS.find((one) => one === wire.field);
    return has(field) ? { ...at, check: 'field_missing', field } : null;
  },
  scheme_unmet: ({ category, brand, scheme }, at) =>
    has(category) && has(brand) && has(scheme)
      ? { ...at, check: 'scheme_unmet', category, brand, scheme }
      : null,
  tier_unfit: ({ category, brand, tier }, at) =>
    has(category) && has(brand) && has(tier)
      ? { ...at, check: 'tier_unfit', category, brand, tier }
      : null,
};

type SizeCheck = Exclude<GenerateWarning['check'], 'below_cost'>;
type WarningRead = (wire: GenerateWarningWire, at: At) => GenerateWarning | null;

const SIZE_WARNING: Readonly<Record<SizeCheck, WarningRead>> = {
  panel_capacity: ({ brand, count, wattPeak, panelKw, systemKw }, at) =>
    has(brand) && has(count) && has(wattPeak) && has(panelKw) && has(systemKw)
      ? { ...at, check: 'panel_capacity', brand, count, wattPeak, panelKw, systemKw }
      : null,
  inverter_band: ({ panelBrand, inverterBrand, panelKw, inverterKw, reading }, at) =>
    has(panelBrand) && has(inverterBrand) && has(panelKw) && has(inverterKw) && has(reading)
      ? { ...at, check: 'inverter_band', panelBrand, inverterBrand, panelKw, inverterKw, reading }
      : null,
  sanctioned_load: ({ systemKw, sanctionedLoadKw }, at) =>
    has(systemKw) && has(sanctionedLoadKw)
      ? { ...at, check: 'sanctioned_load', systemKw, sanctionedLoadKw }
      : null,
  supply_phase: ({ brand, inverterPhases, supplyPhases }, at) =>
    has(brand) && has(inverterPhases) && has(supplyPhases)
      ? { ...at, check: 'supply_phase', brand, inverterPhases, supplyPhases }
      : null,
};

/** The reader for a check this build knows; `null` for one a newer server has learned. */
function readerOf<Check extends string, Reader>(
  readers: Readonly<Record<Check, Reader>>,
  check: string,
): Reader | null {
  return Object.hasOwn(readers, check) ? readers[check as Check] : null;
}

function blockOf(wire: GenerateBlockWire, formats: FormatPack): GenerateBlock | null {
  const at = { step: wire.step, fields: wire.fields };
  return readerOf(BLOCK, wire.check)?.(wire, at, formats) ?? null;
}

function sizeWarningOf(wire: GenerateWarningWire): GenerateWarning | null {
  const at = { step: wire.step, fields: wire.fields };
  return readerOf(SIZE_WARNING, wire.check)?.(wire, at) ?? null;
}

function warningOf(wire: GenerateWarningWire, formats: FormatPack): GenerateWarning | null {
  if (wire.check !== 'below_cost') return sizeWarningOf(wire);
  /* The loss is absent for a reader who may not see cost: "below the company's cost" (`M06-37`). */
  const loss =
    wire.loss === null || wire.loss === undefined
      ? null
      : minorUnitsOfDecimal(wire.loss, formats.minorUnitDigits);
  return { step: wire.step, fields: wire.fields, check: 'below_cost', loss };
}

/** A check this build knows: the cost warning, or one of the size checks it reads above. */
const isWarningCheck = (check: string): check is GenerateWarning['check'] =>
  check === 'below_cost' || Object.hasOwn(SIZE_WARNING, check);

function skippedOf(wire: GenerateVerdictWire['skipped'][number]): SkippedCheck | null {
  const reason = SKIP_REASONS.find((one) => one === wire.reason);
  return isWarningCheck(wire.check) && has(reason)
    ? { step: wire.step, fields: wire.fields, check: wire.check, reason, brand: wire.brand }
    : null;
}

export function generateVerdictOf(wire: GenerateVerdictWire, formats: FormatPack): GenerateVerdict {
  return {
    blocks: wire.blocks.flatMap((block) => blockOf(block, formats) ?? []),
    warnings: wire.warnings.flatMap((warning) => warningOf(warning, formats) ?? []),
    skipped: wire.skipped.flatMap((skipped) => skippedOf(skipped) ?? []),
    canGenerate: wire.canGenerate,
  };
}
