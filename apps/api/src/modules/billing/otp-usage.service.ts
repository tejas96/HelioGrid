import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { OutboxDispatcher } from '../../common/temporal/outbox.dispatcher';
import { OtpUsageRepository, type SignInCode } from './otp-usage.repository';

/**
 * OTP is tracked for cost visibility and never billed (`M12-33`). A code is a company's usage once
 * it signs a person in to that company: a code for a person with no company is the platform's own
 * cost, and a development number's code is never sent, so neither is metered (owner ruling
 * 2026-11-04). The usage screen reads the count (`SCR-M12-04`).
 */
@Injectable()
export class OtpUsageService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(OtpUsageRepository) private readonly codes: OtpUsageRepository,
    @Inject(OutboxDispatcher) private readonly outbox: OutboxDispatcher,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OtpUsageService.name);
  }

  /**
   * Meters the code after the session stands. A metering failure never fails the sign-in it
   * records (`usage-meter.repository.ts`): the count misses one code, and the log says which.
   */
  async meterSignIn(code: SignInCode): Promise<void> {
    try {
      const eventId = await this.codes.meter(code);
      await this.outbox.dispatchNow(eventId);
    } catch (error) {
      const cause = error instanceof Error ? error.name : 'unknown';
      this.logger.error(
        { tenantId: code.tenantId, challengeId: code.challengeId, cause },
        'a sign-in code could not be metered',
      );
    }
  }
}
