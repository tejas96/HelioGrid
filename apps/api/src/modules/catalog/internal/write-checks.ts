import type { RateWrite, RoleSet } from '@heliogrid/contracts';
import { type CertificationSchemesPack, can, type FormatPack, limitsOn } from '@heliogrid/domain';
import { minorUnitsOfDecimal, minorUnitsToDecimal } from '@heliogrid/domain/server';
import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { ContractRoute, CreationReplies, Keyed } from '../../../common/creation-key';
import { ContractException } from '../../../common/errors/contract-exception';
import type { RateToAppend } from '../catalog.rates.repository';
import type { CatalogTenant } from '../catalog.slice.repository';
import type { Refusal } from '../catalog.standing.repository';
import type { ResolveContext } from './resolve-input';

/** The tenant and its market's facts, read once per act. */
export interface Scope extends CatalogTenant {
  readonly certificationSchemes: CertificationSchemesPack;
  /** How the market writes money: what an import's price cells are read against. */
  readonly formats: FormatPack;
  readonly resolve: ResolveContext;
}

/**
 * A rate as the ledger stores it (`M01-44`): dated today when no day is sent, never a day before
 * today on the tenant's clock — a backdated entry would change the rate an earlier day resolved
 * to (b4) — and scaled to the currency's minor unit, a fraction of one refused, never rounded.
 * `at` prefixes the body path a refusal names (`rate.` inside a larger body).
 */
export function rateToAppend(
  rate: { readonly amount: RateWrite['amount'] | null; readonly effectiveOn?: string },
  scope: Scope,
  at: string,
): RateToAppend {
  const today = scope.resolve.pricedOn;
  const effectiveOn = rate.effectiveOn ?? today;
  if (effectiveOn < today) {
    throw new ContractException(
      'DOMAIN_RULE_VIOLATION',
      'A rate starts today or later; an earlier day keeps the rate it had.',
      HttpStatus.UNPROCESSABLE_ENTITY,
      [{ path: `${at}effectiveOn`, issue: `before ${today}` }],
    );
  }
  return {
    amount: amountAtScale(rate.amount, scope.resolve.minorUnitDigits, at),
    currency: scope.currencyCode,
    effectiveOn,
  };
}

/**
 * `catalog_rate_entry.rate_amount` and `price_book_rate.amount` are `numeric(14,3)`: eleven whole
 * digits.
 */
const LEDGER_WHOLE_DIGITS = 11;

/**
 * An amount as the column stores it, scaled to the currency's minor unit — a fraction of one
 * refused, never rounded. `at` prefixes the body path a refusal names (`rates.0.`).
 */
export function amountAtScale(amount: string, digits: number, at: string): string;
export function amountAtScale(amount: string | null, digits: number, at: string): string | null;
export function amountAtScale(amount: string | null, digits: number, at: string): string | null {
  if (amount === null) return null;
  const whole = (amount.split('.')[0] ?? '').replace(/^-?0*/, '');
  if (whole.length > LEDGER_WHOLE_DIGITS) {
    throw new ContractException(
      'VALIDATION_FAILED',
      'That amount is larger than a catalog price can be.',
      HttpStatus.BAD_REQUEST,
      [{ path: `${at}amount`, issue: `at most ${LEDGER_WHOLE_DIGITS} whole digits` }],
    );
  }
  try {
    return minorUnitsToDecimal(minorUnitsOfDecimal(amount, digits), digits);
  } catch {
    throw new ContractException(
      'VALIDATION_FAILED',
      'That amount is finer than the currency’s smallest unit.',
      HttpStatus.BAD_REQUEST,
      [{ path: `${at}amount`, issue: `at most ${digits} decimal places` }],
    );
  }
}

export const MANAGE_CATALOG = 'onboarding.manage_catalog';

/** A write is the outright grant's: a limited one — Finance's "view prices & margins" — reads only. */
export function admitWrite(roles: RoleSet): void {
  if (!can(roles, MANAGE_CATALOG) || limitsOn(roles, MANAGE_CATALOG).length > 0) {
    throw new ForbiddenException('Your role reads the catalog and does not change it.');
  }
}

/** A refused write as the contract declares it: unseen is 404 (never 403), the wrong tier 409. */
export function refused(refusal: Refusal): Error {
  switch (refusal.outcome) {
    case 'not-found':
      return new NotFoundException('That item is not in this company’s catalog.');
    case 'read-only':
      return new ConflictException('A platform item is read-only; set an override on it instead.');
    case 'own-item':
      return new ConflictException('An own SKU has no override; edit the item itself.');
    case 'kind-changed':
      return new ContractException(
        'VALIDATION_FAILED',
        'An item keeps its kind; add a new item for another kind.',
        HttpStatus.BAD_REQUEST,
        [{ path: 'spec.kind', issue: 'the kind of an item does not change' }],
      );
  }
}

/** The item id a keyed write answers with, or its refusal thrown. */
export function refusedOrKeyed(
  outcome: Refusal | Keyed<string>,
  replies: CreationReplies,
  route: ContractRoute,
  tenantId: string,
): string {
  switch (outcome.outcome) {
    case 'created':
    case 'replayed':
    case 'key-reused':
      return replies.rowOf(outcome, route, tenantId);
    default:
      throw refused(outcome);
  }
}
