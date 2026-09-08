import type { OtpChannel } from '../common';

/**
 * The port a sign-in code leaves through (`M01-03`). The auth service composes the message
 * from the market pack and hands it here with the channel the user chose; what carries it is an
 * adapter — the development one writes the code to the API log, the IN reference one is MSG91
 * over a registered DLT template (`F1-43`). Nothing here retries or falls back: a failure is
 * thrown and the front door says so, loudly.
 */
export interface OtpDeliveryRequest {
  readonly phoneE164: string;
  readonly channel: OtpChannel;
  readonly message: string;
}

export interface OtpDelivery {
  /** Resolves when the carrier ACCEPTED the message; throws on a confirmed hard failure. */
  send(request: OtpDeliveryRequest): Promise<void>;
}

/** A `symbol` on purpose: a string DI token collides silently across modules. */
export const OTP_DELIVERY = Symbol.for('heliogrid.OtpDelivery');
