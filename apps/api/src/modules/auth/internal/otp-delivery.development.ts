import type { OtpDelivery, OtpDeliveryRequest } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../../config/env';

/**
 * The development adapter behind the `OtpDelivery` port: the code goes to the API log, not to
 * a phone, so anyone running the stack signs in with any number in seconds. It refuses to
 * exist outside development — a production boot without the SMS adapter fails here, loudly,
 * rather than serving a front door that whispers codes into a log.
 */
@Injectable()
export class DevelopmentOtpDelivery implements OtpDelivery {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {
    if (ENV.NODE_ENV === 'production') {
      throw new Error(
        'The development OTP delivery adapter cannot run in production. Wire the SMS adapter.',
      );
    }
    this.logger.setContext(DevelopmentOtpDelivery.name);
  }

  async send({ phoneE164, channel, message }: OtpDeliveryRequest): Promise<void> {
    this.logger.warn(`OTP for ${phoneE164} via ${channel}: ${message}`);
  }
}
