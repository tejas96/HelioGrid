import {
  type ChargeFailed,
  type ChargeSucceeded,
  failureMoves,
  successEffect,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChargeAdminRepository } from './charge.admin.repository';

/** A charge no subscription can take: nothing is written, and the reason is named. */
export class ChargeRefused extends Error {
  override readonly name = 'ChargeRefused';
}

/**
 * Charge truth (`M12-09`): the one path every charge fact takes — the gateway's webhook and its
 * reconcile poll alike (T-M12-007), so a payment has one writer. A successful charge records its
 * payment and grows the window in one transaction; no late, repeated or older fact moves a
 * subscription back. What each fact does is domain's (`commerce/charges.ts`).
 */
@Injectable()
export class ChargeService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ChargeAdminRepository) private readonly charges: ChargeAdminRepository,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChargeService.name);
  }

  /**
   * `recorded`: the payment is new and the subscription took it. `duplicate`: the charge was told
   * before, so nothing is written. `dead`: the payment is recorded on a row no charge moves.
   */
  async recordSuccess(
    charge: ChargeSucceeded,
    now: number,
  ): Promise<'recorded' | 'duplicate' | 'dead'> {
    if (charge.amount <= 0) {
      throw new ChargeRefused(`a charge collects an amount above zero, not ${charge.amount}`);
    }
    const result = await this.charges.recordSuccess(charge, now, (standing) =>
      successEffect(standing, charge),
    );
    switch (result.kind) {
      case 'unknown subscription':
        throw new ChargeRefused(`no subscription ${charge.subscriptionId}`);
      case 'another currency':
        throw new ChargeRefused(
          `a charge in ${charge.currencyCode} on a company billed in ${result.companyCurrency}`,
        );
      case 'dead':
        // T-M12-007 raises an internal alert on this line: money landed where no charge moves.
        this.logger.warn(
          { subscriptionId: charge.subscriptionId, chargeRef: charge.chargeRef },
          'a charge landed on a dead subscription',
        );
        return result.kind;
      default:
        return result.kind;
    }
  }

  /** `moved`: the failure made an active subscription past due. `stale`: it changed nothing. */
  async recordFailure(failure: ChargeFailed): Promise<'moved' | 'stale'> {
    const moved = await this.charges.recordFailure(failure, (standing) =>
      failureMoves(standing, failure),
    );
    if (moved === null) throw new ChargeRefused(`no subscription ${failure.subscriptionId}`);
    return moved ? 'moved' : 'stale';
  }
}
