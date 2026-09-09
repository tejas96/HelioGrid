import type { MessageDelivery, MessageDeliveryRequest } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../../config/env';

/**
 * The development adapter behind the `MessageDelivery` port: the code and the invite link go to
 * the API log, not to a phone, so anyone running the stack signs in or joins with any number in
 * seconds. It refuses to exist outside development — a production boot without the SMS adapter
 * fails here, loudly, rather than serving a front door that whispers codes into a log.
 */
@Injectable()
export class DevelopmentMessageDelivery implements MessageDelivery {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {
    if (ENV.NODE_ENV === 'production') {
      throw new Error(
        'The development message delivery adapter cannot run in production. Wire the SMS adapter.',
      );
    }
    this.logger.setContext(DevelopmentMessageDelivery.name);
  }

  async send({ phoneE164, channel, message }: MessageDeliveryRequest): Promise<void> {
    this.logger.warn(`Message for ${phoneE164} via ${channel}: ${message}`);
  }
}
