import type { MessageDelivery, MessageDeliveryRequest } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

const UNDELIVERABLE_SUFFIX = '0000';

/**
 * The development adapter behind the `MessageDelivery` port: the code and the invite link go to
 * the API log, not to a phone, so anyone running the stack signs in or joins with any number in
 * seconds. It reads no environment itself: `auth.module.ts` binds it, and refuses to in
 * production, so a boot without the SMS adapter fails there, loudly, rather than serving a
 * front door that whispers codes into a log — and a unit test can construct it with a logger alone.
 */
@Injectable()
export class DevelopmentMessageDelivery implements MessageDelivery {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {
    this.logger.setContext(DevelopmentMessageDelivery.name);
  }

  /**
   * A national part ending in `0000` is turned away, the way a network confirms a hard failure —
   * the ONE way the door's loud-failure frame can be driven before an SMS rail exists
   * (`M01-03`). Development only: the module never binds this class in production.
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
