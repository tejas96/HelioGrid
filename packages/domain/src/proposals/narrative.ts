import type { ProposalFieldSet, ProposalPhase } from './field-set';
import type { SystemType } from './system-type';

/**
 * The document's narrative, as slots over the version's own facts (`M06-52`, `T-M06-029`). The
 * words are `packages/i18n`'s templates; this decides which lines exist and what fills them — a
 * line whose fact is absent is left out, so no sentence states what the version does not hold.
 */

/** One line of *Included in this price*, with the facts its template takes. */
export type IncludedLine =
  | { readonly kind: 'panels_and_inverter'; readonly panelCount: number }
  | { readonly kind: 'structure_cables_electrical' }
  | { readonly kind: 'battery'; readonly capacityKwh: number }
  | { readonly kind: 'commissioning' }
  | { readonly kind: 'maintenance_free' }
  | { readonly kind: 'maintenance_years'; readonly years: number };

/**
 * *Included in this price*, in print order: the panels and the inverter where both are picked and
 * the panels are counted; the structure, cables and electrical parts where all three are picked;
 * the battery where one is; commissioning where the price includes it; the maintenance plan where
 * there is one.
 */
export function includedInPrice(
  fields: Pick<ProposalFieldSet, 'system' | 'components'>,
): readonly IncludedLine[] {
  const has = (category: string) => fields.components.some((line) => line.category === category);
  const panelCount = fields.components.find((line) => line.category === 'panel')?.count ?? null;
  const lines: IncludedLine[] = [];
  if (panelCount !== null && has('inverter'))
    lines.push({ kind: 'panels_and_inverter', panelCount });
  if (has('structure') && has('cable') && has('electrical')) {
    lines.push({ kind: 'structure_cables_electrical' });
  }
  if (fields.system.battery !== null && has('battery')) {
    lines.push({ kind: 'battery', capacityKwh: fields.system.battery.capacityKwh });
  }
  if (fields.system.commissioningIncluded) lines.push({ kind: 'commissioning' });
  const { maintenance } = fields.system;
  if (maintenance.kind === 'free') lines.push({ kind: 'maintenance_free' });
  if (maintenance.kind === 'years') {
    lines.push({ kind: 'maintenance_years', years: maintenance.years });
  }
  return lines;
}

/** What the cover's one line about the system takes; `null` until the system has a size. */
export interface CoverLineFacts {
  readonly capacityKw: number;
  readonly systemType: SystemType;
  /** The customer pays for the power, not the system (`M06-06`). */
  readonly paysForPower: boolean;
}

export function coverLineFacts(
  fields: Pick<ProposalFieldSet, 'system' | 'company'>,
): CoverLineFacts | null {
  const { capacityKw, systemType } = fields.system;
  if (capacityKw === null) return null;
  return {
    capacityKw,
    systemType,
    paysForPower: fields.company.proposalType === 'customer_pays_for_power',
  };
}

/** Whether any section names two or three brands: the document then says the customer gets one of them (`M06-27`). */
export function namesAlternatives(fields: Pick<ProposalFieldSet, 'components'>): boolean {
  const seen = new Set<string>();
  for (const line of fields.components) {
    if (seen.has(line.category)) return true;
    seen.add(line.category);
  }
  return false;
}

/**
 * The working days the timeline adds up to — the timeline page's opening line — or `null` where
 * any step states none: a total is never printed over a gap.
 */
export function timelineDays(timeline: readonly ProposalPhase[]): number | null {
  let days = 0;
  for (const phase of timeline) {
    if (phase.durationDays === null) return null;
    days += phase.durationDays;
  }
  return timeline.length === 0 ? null : days;
}
