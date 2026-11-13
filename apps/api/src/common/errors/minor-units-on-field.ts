import { type MinorUnits, minorUnitsOfDecimal } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { ContractException } from './contract-exception';

/**
 * A typed amount as minor units, or the field's refusal: an amount finer than the currency's
 * smallest unit is the person's to fix, answered 400 on the field it names, never rounded and never
 * an opaque 500 (`F4-04`). `path` is the schema field path the client marks (`amount`, `rates.0.amount`).
 */
export function minorUnitsOnField(amount: string, digits: number, path: string): MinorUnits {
  try {
    return minorUnitsOfDecimal(amount, digits);
  } catch {
    throw new ContractException(
      'VALIDATION_FAILED',
      'That amount is finer than the currency’s smallest unit.',
      HttpStatus.BAD_REQUEST,
      [{ path, issue: `at most ${digits} decimal places` }],
    );
  }
}
