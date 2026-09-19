import type { PushDelivery, PushMessage, PushOutcome } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { JWT } from 'google-auth-library';
import { PinoLogger } from 'nestjs-pino';

/**
 * The v1 push adapter: FCM over its HTTP v1 endpoint (`F6-13`).
 *
 * Firebase's own SDK is NOT used. What this needs is an OAuth token minted from a service account
 * and one POST per token; `firebase-admin` brings Firestore, Storage and Auth clients along for
 * that, and the stack's own row rejects an extra data path. `google-auth-library` is the piece
 * that mints the token, and it is Google's.
 *
 * FCM carries BOTH platforms — Apple's leg is Firebase's to make, which is why this file knows
 * nothing about APNs. The iOS half of the product is the handset's, not the server's.
 *
 * Nothing here retries. Push is best effort by contract (`F6-06`) and the record is the truth, so
 * a transport failure is reported and the caller moves on. A token FCM calls dead comes back in
 * `deadTokens` for deletion (`F6` §F6.2).
 */
interface ServiceAccount {
  readonly project_id: string;
  readonly client_email: string;
  readonly private_key: string;
}

/** FCM's own words for a token that will never work again. */
const DEAD_TOKEN_CODES = new Set(['UNREGISTERED', 'INVALID_ARGUMENT']);
const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

@Injectable()
export class FcmPushDelivery implements PushDelivery {
  private readonly account: ServiceAccount;
  private readonly auth: JWT;

  constructor(
    serviceAccountJsonBase64: string,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FcmPushDelivery.name);
    this.account = JSON.parse(
      Buffer.from(serviceAccountJsonBase64, 'base64').toString('utf8'),
    ) as ServiceAccount;
    /* The library caches and refreshes the access token; minting one per send would be a round
       trip per notification for no gain. */
    this.auth = new JWT({
      email: this.account.client_email,
      key: this.account.private_key,
      scopes: [MESSAGING_SCOPE],
    });
  }

  async send(message: PushMessage): Promise<PushOutcome> {
    const { token: accessToken } = await this.auth.getAccessToken();
    if (accessToken === undefined || accessToken === null) {
      throw new Error('FCM refused to mint an access token for the service account');
    }
    const endpoint = `https://fcm.googleapis.com/v1/projects/${this.account.project_id}/messages:send`;
    const deadTokens: string[] = [];

    /* One request per token: FCM's v1 API takes a single target, and a handful of handsets per
       person is what this loop is sized for. A person with many devices is not a case the
       product has; if it ever is, this is where batching would go. */
    for (const token of message.tokens) {
      // biome-ignore lint/style/noRestrictedGlobals: the ban is on calling OUR wire, which is packages/data's; this is an outbound call to a third party and no typed client exists for it
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(this.envelope(message, token)),
      });
      if (response.ok) continue;
      const failure = (await response.json().catch(() => ({}))) as {
        error?: { status?: string; message?: string };
      };
      const status = failure.error?.status ?? String(response.status);
      if (DEAD_TOKEN_CODES.has(status)) {
        deadTokens.push(token);
        continue;
      }
      this.logger.warn({ status, message: failure.error?.message }, 'FCM refused a push');
    }
    return { deadTokens };
  }

  /**
   * The payload. `data` carries the deep link, because a notification is a pointer to a real
   * record and never a dead announcement (`F6-02`) — the app reads these two keys and routes.
   *
   * `immediate` asks both platforms to wake the device; `standard` lets them batch. The class is
   * the type's, registered and never improvised (`F6-13`).
   */
  private envelope(message: PushMessage, token: string) {
    const urgent = message.urgency === 'immediate';
    return {
      message: {
        token,
        notification: { title: message.title, body: message.body },
        data: { subjectKind: message.subjectKind, subjectRef: message.subjectRef },
        android: { priority: urgent ? 'HIGH' : 'NORMAL' },
        apns: {
          headers: {
            'apns-priority': urgent ? '10' : '5',
            'apns-push-type': 'alert',
          },
        },
      },
    };
  }
}
