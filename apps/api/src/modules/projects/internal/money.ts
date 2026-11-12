import type { ProjectMoneyGlance, ProjectPart } from '@heliogrid/contracts';
import {
  basisPointsToPercent,
  type FormatPack,
  localDate,
  minorUnits,
  type TrancheStanding,
} from '@heliogrid/domain';
import { minorUnitsToDecimal, projectMoneyOf, trancheStandingOf } from '@heliogrid/domain/server';
import type { PartFacts } from '../projects.money.repository';

/*
 * A project's money worked out from its facts (`M11-10`, `M11-43`), on the server alone
 * (`F4-04`): each part's standing, and the one set of figures every surface shows.
 */

export interface MoneyFormat {
  readonly currency: string;
  readonly digits: number;
  readonly timeZone: string;
}

/** The money format of a company's market, on its clock. */
export function moneyFormatOf(formats: FormatPack, timeZone: string): MoneyFormat {
  return { currency: formats.currency, digits: formats.minorUnitDigits, timeZone };
}

/** A part is due and owes money — the money reason a project asks of a person (`M11-53`). */
export function isMoneyDue(glance: ProjectMoneyGlance | null | undefined): boolean {
  return (glance?.duePart ?? null) !== null;
}

/** One part with its standing worked out. */
export interface StoodPart {
  readonly facts: PartFacts;
  readonly standing: TrancheStanding;
  readonly due: boolean;
}

export function stoodPartsOf(parts: readonly PartFacts[]): readonly StoodPart[] {
  return parts.map((facts) => {
    const due = facts.dueSince !== null;
    return {
      facts,
      due,
      standing: trancheStandingOf({
        amount: minorUnits(facts.amountMinor),
        received: minorUnits(facts.receivedMinor),
        due,
        waived: facts.waived !== null,
      }),
    };
  });
}

/** The part to collect now: the one due longest that still owes money, or none. */
export function duePartOf(parts: readonly StoodPart[]): StoodPart | null {
  const owing = parts.filter((part) => part.due && part.standing.outstanding > 0);
  return owing.sort((a, b) => (a.facts.dueSince ?? 0) - (b.facts.dueSince ?? 0))[0] ?? null;
}

export function glanceOf(parts: readonly StoodPart[], format: MoneyFormat): ProjectMoneyGlance {
  const decimal = (amount: number) => minorUnitsToDecimal(minorUnits(amount), format.digits);
  const money = projectMoneyOf(
    parts.map((part) => ({
      amount: minorUnits(part.facts.amountMinor),
      received: minorUnits(part.facts.receivedMinor),
      due: part.due,
      standing: part.standing,
    })),
  );
  const due = duePartOf(parts);
  return {
    currencyCode: format.currency,
    total: decimal(money.total),
    collected: decimal(money.collected),
    toCollect: decimal(money.toCollect),
    next: decimal(money.next),
    duePart:
      due === null
        ? null
        : {
            id: due.facts.id,
            label: due.facts.label,
            outstanding: decimal(due.standing.outstanding),
            dueOn: dueOnOf(due, format),
            lastShared: sharedOf(due.facts),
          },
  };
}

export function partOf(part: StoodPart, format: MoneyFormat): ProjectPart {
  const decimal = (amount: number) => minorUnitsToDecimal(minorUnits(amount), format.digits);
  const { facts, standing } = part;
  return {
    id: facts.id,
    position: facts.position,
    label: facts.label,
    share: basisPointsToPercent(facts.shareBasisPoints),
    amount: decimal(facts.amountMinor),
    dueOnStage: facts.dueOnStage,
    state: standing.state,
    received: decimal(facts.receivedMinor),
    outstanding: decimal(standing.outstanding),
    extra: decimal(standing.extra),
    dueOn: part.due ? dueOnOf(part, format) : null,
    waived:
      facts.waived === null
        ? null
        : { by: facts.waived.by, at: facts.waived.at.toISOString(), reason: facts.waived.reason },
    lastShared: sharedOf(facts),
  };
}

function dueOnOf(part: StoodPart, format: MoneyFormat): string {
  return localDate(part.facts.dueSince ?? 0, format.timeZone);
}

function sharedOf(facts: PartFacts) {
  return facts.lastShared === null
    ? null
    : { by: facts.lastShared.by, at: facts.lastShared.at.toISOString() };
}
