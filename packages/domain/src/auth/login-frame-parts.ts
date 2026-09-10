/**
 * The parts a code-step frame is made of — the vocabularies `loginFrame` decides in and
 * `packages/i18n` keys its words by. A word here is a meaning, never a sentence: the sentence
 * lives in the catalogs, once per language.
 */
import type { LoginPress } from './login-state';

/** The tint of the block above a locked code field — the words carry the reason, the tint is the second channel. */
export type FrameTone = 'danger' | 'warning';

/** The line under the title that names the number: what was done to it. */
export type SubLine =
  | 'sent-by-sms'
  | 'read-out'
  | 'tried-by-sms'
  | 'tried-to-call'
  | 'will-call'
  | 'checked-for'
  | 'locked-for';

/** The helper under the code field. */
export type CodeHelper =
  | 'no-code-yet'
  | 'nothing-until-new'
  | 'locked'
  | 'code-was-fine'
  | 'sent-just-now'
  | 'sent-moment-ago'
  | 'answer-call'
  | 'filled-from-sms'
  | 'paste-whole';

/** The field's own error: the code did not match, or Verify was pressed short. */
export type CodeError = 'wrong' | 'short';

export type PrimaryLabel =
  | 'verify'
  | 'try-again'
  | 'send-new'
  | 'send-again'
  | 'call-me'
  | 'call-again';

export type ResendLabel = 'send-new' | 'send-sms-again';

/** Why the resend slot shows a wait instead of a control. */
export type WaitReason = 'first' | 'again' | 'short' | 'cap' | 'locked';

/** The caption at the foot of the frame. */
export type FootLine =
  | 'auth-error'
  | 'locked'
  | 'cap'
  | 'not-sent'
  | 'call'
  | 'tries-left'
  | 'only-some-phones'
  | 'code-works-for'
  | 'wait-stops';

export interface FrameControl {
  readonly press: LoginPress;
  readonly label: PrimaryLabel;
}

export type ResendSlot =
  | { readonly kind: 'live'; readonly press: LoginPress; readonly label: ResendLabel }
  | { readonly kind: 'wait'; readonly reason: WaitReason };
