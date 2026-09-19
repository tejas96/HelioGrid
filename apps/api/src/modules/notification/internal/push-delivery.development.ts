import type { PushDelivery, PushMessage, PushOutcome } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

/**
 * The push adapter a machine with no Firebase credential gets — it writes what it WOULD have
 * sent to the log and reports every token accepted.
 *
 * It is the same posture `message-delivery.development.ts` takes for the sign-in code: the whole
 * path runs, the record is written, the marker is set, and a developer reads the payload in the
 * log. That is what lets the sender, the mute, the due time and the dead-token rule be exercised
 * in CI, where no third party may be called.
 *
 * It refuses to run in production: a push that only ever reached a log file is worse than one
 * that failed loudly, because nobody would know.
 */
@Injectable()
export class DevelopmentPushDelivery implements PushDelivery {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {
    this.logger.setContext(DevelopmentPushDelivery.name);
  }

  /**
   * A token spelled `dead:<anything>` is reported dead, so the deletion rule (`F6` §F6.2) has a
   * way to be driven without a real provider revoking a real handset. No live token takes this
   * shape: FCM mints base64url with no colon.
   */
  async send(message: PushMessage): Promise<PushOutcome> {
    const deadTokens = message.tokens.filter((token) => token.startsWith('dead:'));
    this.logger.info(
      {
        tokens: message.tokens.length,
        dead: deadTokens.length,
        urgency: message.urgency,
        subjectKind: message.subjectKind,
      },
      `Push for ${message.subjectKind} — ${message.title}`,
    );
    return { deadTokens };
  }
}
