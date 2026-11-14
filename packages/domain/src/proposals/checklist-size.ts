import type { ProposalMarketFacts } from '../format/proposal-facts';
import type { GenerateWarning, SkippedCheck } from './checklist-findings';
import type { ComponentLine, ProposalDealFacts, ProposalFieldSet } from './field-set';
import { PHASE_COUNT } from './vocabulary';

/**
 * The size checks (`M06-23`, owner ruling 2026-11-13): the panels against the system size, the
 * panels against the inverter, the system against the sanctioned load, the inverter's phases
 * against the supply. Each WARNS with both figures and never blocks; each runs per brand where a
 * section lists two or three; and one whose input is unknown says it was skipped and why.
 */

type PanelLine = Extract<ComponentLine, { category: 'panel' }>;
type InverterLine = Extract<ComponentLine, { category: 'inverter' }>;

export interface SizeFindings {
  readonly warnings: readonly GenerateWarning[];
  readonly skipped: readonly SkippedCheck[];
}

const COMPONENTS_STEP = { step: 'components', fields: ['components'] } as const;
const SYSTEM_STEP = { step: 'system', fields: ['system.capacityKw'] } as const;

function skip(
  check: SkippedCheck['check'],
  reason: SkippedCheck['reason'],
  brand: string | null,
  located: Pick<SkippedCheck, 'step' | 'fields'> = COMPONENTS_STEP,
): SkippedCheck {
  return { check, reason, brand, ...located };
}

/** A panel brand's total, kW — `null` until its count and its watt peak are both known. */
function panelKwOf(panel: PanelLine): number | null {
  return panel.count === null || panel.wattPeak === null
    ? null
    : (panel.count * panel.wattPeak) / 1000;
}

function inverterKwOf(inverter: InverterLine): number | null {
  return inverter.count === null || inverter.capacityKw === null
    ? null
    : inverter.count * inverter.capacityKw;
}

function panelsAgainstSize(
  panels: readonly PanelLine[],
  systemKw: number,
  market: ProposalMarketFacts,
): SizeFindings {
  const warnings: GenerateWarning[] = [];
  const skipped: SkippedCheck[] = [];
  for (const panel of panels) {
    if (panel.count === null) continue;
    const panelKw = panelKwOf(panel);
    if (panelKw === null || panel.wattPeak === null) {
      skipped.push(skip('panel_capacity', 'panel_watt_peak_unknown', panel.brand));
      continue;
    }
    const apart = Math.abs(panelKw - systemKw) * 10_000;
    if (apart > market.panelCapacityTolerance * systemKw) {
      warnings.push({
        check: 'panel_capacity',
        brand: panel.brand,
        count: panel.count,
        wattPeak: panel.wattPeak,
        panelKw,
        systemKw,
        ...COMPONENTS_STEP,
      });
    }
  }
  return { warnings, skipped };
}

/** One panel brand against one inverter brand: a warning where the panels sit outside the band. */
function bandWarning(
  panel: PanelLine,
  inverter: InverterLine,
  inverterKw: number,
  market: ProposalMarketFacts,
): GenerateWarning | null {
  const panelKw = panelKwOf(panel);
  if (panelKw === null) return null;
  const { from, to } = market.inverterBandPercent;
  const percent = (panelKw / inverterKw) * 100;
  if (percent >= from && percent <= to) return null;
  return {
    check: 'inverter_band',
    panelBrand: panel.brand,
    inverterBrand: inverter.brand,
    panelKw,
    inverterKw,
    reading: percent < from ? 'inverter_too_big' : 'inverter_too_small',
    ...COMPONENTS_STEP,
  };
}

function panelsAgainstInverters(
  panels: readonly PanelLine[],
  inverters: readonly InverterLine[],
  market: ProposalMarketFacts,
): SizeFindings {
  const warnings: GenerateWarning[] = [];
  const skipped: SkippedCheck[] = [];
  for (const inverter of inverters) {
    if (inverter.count === null) continue;
    const inverterKw = inverterKwOf(inverter);
    if (inverterKw === null || inverterKw <= 0) {
      skipped.push(skip('inverter_band', 'inverter_capacity_unknown', inverter.brand));
      continue;
    }
    for (const panel of panels) {
      const warning = bandWarning(panel, inverter, inverterKw, market);
      if (warning !== null) warnings.push(warning);
    }
  }
  return { warnings, skipped };
}

function sizeAgainstLoad(systemKw: number, deal: ProposalDealFacts): SizeFindings {
  if (deal.sanctionedLoadKw === null) {
    return {
      warnings: [],
      skipped: [skip('sanctioned_load', 'sanctioned_load_unknown', null, SYSTEM_STEP)],
    };
  }
  return {
    warnings:
      systemKw > deal.sanctionedLoadKw
        ? [
            {
              check: 'sanctioned_load',
              systemKw,
              sanctionedLoadKw: deal.sanctionedLoadKw,
              ...SYSTEM_STEP,
            },
          ]
        : [],
    skipped: [],
  };
}

function phasesAgainstSupply(
  inverters: readonly InverterLine[],
  deal: ProposalDealFacts,
): SizeFindings {
  if (deal.supplyPhase === null) {
    return {
      warnings: [],
      skipped: [skip('supply_phase', 'supply_phase_unknown', null, SYSTEM_STEP)],
    };
  }
  const supplyPhases = PHASE_COUNT[deal.supplyPhase];
  const warnings: GenerateWarning[] = [];
  const skipped: SkippedCheck[] = [];
  for (const inverter of inverters) {
    if (inverter.phases === null) {
      skipped.push(skip('supply_phase', 'inverter_phases_unknown', inverter.brand));
    } else if (inverter.phases !== supplyPhases) {
      warnings.push({
        check: 'supply_phase',
        brand: inverter.brand,
        inverterPhases: inverter.phases,
        supplyPhases,
        ...COMPONENTS_STEP,
      });
    }
  }
  return { warnings, skipped };
}

/** Every size check over one proposal. With no system size there is nothing to size against. */
export function sizeFindings(
  fields: Pick<ProposalFieldSet, 'system' | 'components'>,
  deal: ProposalDealFacts,
  market: ProposalMarketFacts | null,
): SizeFindings {
  const systemKw = fields.system.capacityKw;
  if (systemKw === null || systemKw <= 0) return { warnings: [], skipped: [] };
  const panels = fields.components.filter((line): line is PanelLine => line.category === 'panel');
  const inverters = fields.components.filter(
    (line): line is InverterLine => line.category === 'inverter',
  );
  const sized: SizeFindings[] =
    market === null
      ? [
          {
            warnings: [],
            skipped: [
              skip('panel_capacity', 'market_declares_none', null),
              skip('inverter_band', 'market_declares_none', null),
            ],
          },
        ]
      : [
          panelsAgainstSize(panels, systemKw, market),
          panelsAgainstInverters(panels, inverters, market),
        ];
  const all = [...sized, sizeAgainstLoad(systemKw, deal), phasesAgainstSupply(inverters, deal)];
  return {
    warnings: all.flatMap((found) => found.warnings),
    skipped: all.flatMap((found) => found.skipped),
  };
}
