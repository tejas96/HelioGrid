import type { MessageDelivery, MessageDeliveryRequest } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../../config/env';

const UNDELIVERABLE_SUFFIX = '0000';

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

  /**
   * A national part ending in `0000` is turned away, the way a network confirms a hard failure —
   * the ONE way the door's loud-failure frame can be driven before an SMS rail exists
   * (`M01-03`). Development only: this class refuses to construct in production.
   */
  async send({ phoneE164, channel, message }: MessageDeliveryRequest): Promise<void> {
    if (phoneE164.endsWith(UNDELIVERABLE_SUFFIX)) {
      throw new Error(
        `Development delivery refuses ${phoneE164}: numbers ending in ${UNDELIVERABLE_SUFFIX} never send.`,
      );
    }
    this.logger.warn(`Message for ${phoneE164} via ${channel}: ${message}`);
  }
}
