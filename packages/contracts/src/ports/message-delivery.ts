import type { OtpChannel } from '../common';

/**
 * The port a platform-sent message leaves through: the sign-in code (`M01-03`) and the team
 * invite (`M01-12`), both composed from the market pack and handed here with the channel to
 * carry them — SMS, or the user-initiated voice call a code may take. What carries it is an
 * adapter — the development one writes the message to the API log, the IN reference one is
 * MSG91 over registered DLT templates (`F1-43`). Nothing here retries or falls back: a failure
 * is thrown and the caller says so, loudly.
 */
export interface MessageDeliveryRequest {
  readonly phoneE164: string;
  readonly channel: OtpChannel;
  readonly message: string;
}

export interface MessageDelivery {
  /** Resolves when the carrier ACCEPTED the message; throws on a confirmed hard failure. */
  send(request: MessageDeliveryRequest): Promise<void>;
}

/** A `symbol` on purpose: a string DI token collides silently across modules. */
export const MESSAGE_DELIVERY = Symbol.for('heliogrid.MessageDelivery');
