import type { NotificationUrgency, PushPlatform, SubjectKind } from '@heliogrid/domain';

/**
 * The port a push leaves through (`F6-13`), shaped like `ports/message-delivery.ts` because it is
 * the same problem: a provider behind one seam, with a development adapter that writes to the log
 * and a real one that sends. The v1 adapter is FCM over its HTTP v1 endpoint, which carries both
 * platforms — Apple's leg is Firebase's to make, not ours.
 *
 * Push is BEST EFFORT by contract (`F6-06`): the record is the truth, so a send that never
 * arrives loses nothing and nothing here retries. What the caller does need back is which tokens
 * the provider called dead, because a dead token is deleted rather than kept and tried again
 * (`F6` §F6.2).
 */
export interface PushMessage {
  /** Every live token this person has registered. One send, many devices. */
  readonly tokens: readonly string[];
  /** Rendered at emit, in the language the record was written in (`F6-08`). */
  readonly title: string;
  readonly body: string;
  /**
   * Where tapping it lands. A notification is a pointer to a real record and never a dead
   * announcement (`F6-02`), so the payload carries the subject the app deep-links to.
   */
  readonly subjectKind: SubjectKind;
  readonly subjectRef: string;
  /** `immediate` asks the platform to wake the device; `standard` may be batched by it. */
  readonly urgency: NotificationUrgency;
}

export interface PushOutcome {
  /**
   * Tokens the provider reported as no longer valid — an uninstalled app, a reset device. The
   * caller DELETES these; `F6` §F6.2 is explicit that nothing retries a dead token.
   */
  readonly deadTokens: readonly string[];
}

export interface PushDelivery {
  /** Resolves when the provider ACCEPTED the send; throws on a confirmed hard failure. */
  send(message: PushMessage): Promise<PushOutcome>;
}

/** A `symbol` on purpose: a string DI token collides silently across modules. */
export const PUSH_DELIVERY = Symbol.for('heliogrid.PushDelivery');

/** What a handset tells the server about itself. */
export interface RegisteredDevice {
  readonly platform: PushPlatform;
  readonly token: string;
}
