/**
 * The parts a code-step frame is made of — the vocabularies `loginFrame` decides in and
 * `packages/i18n` keys its words by. A word here is a meaning, never a sentence: the sentence
 * lives in the catalogs, once per language.
 */
import type { LoginPress } from './login-state';

/** The tint of the block above a locked code field — the words carry the reason, the tint is the second channel. */
export type FrameTone = 'danger' | 'warning';

/**
 * A door block's tint: the two refusal tones, and `info` for a fact that is neither a refusal nor
 * a risk — a steer's finding (`SCR-M01-02`), an access removed (`SCR-M01-01` decision 16).
 */
export type BlockTone = FrameTone | 'info';

/**
 * How a door block is spoken when it appears: `alert` for one that answers a press, said at once;
 * `status` for a fact the page opens on, read in its place (`SCR-M01-01` decision 16).
 */
export type BlockAnnouncement = 'alert' | 'status';

/**
 * The road at the foot of the number step: the question, the label, and where it goes
 * (`SCR-M01-02`). Both doors draw one, and the other door is where it leads. A screen fills
 * it from its words and its navigator; both platforms read this one shape.
 */
export interface DoorRoad {
  readonly question: string;
  readonly label: string;
  readonly onPress: () => void;
}

/** The line under the title that names the number: what was done to it. */
export type SubLine =
  | 'sent-by-sms'
  | 'read-out'
  | 'tried-by-sms'
  | 'tried-to-call'
  | 'will-call'
  | 'checked-for'
  | 'correct-for'
  | 'locked-for';

/**
 * The code field, as a frame draws it: `open` takes a code; `read-only` shows the code the step
 * already holds, on its normal ground; `closed` is a field with no code to take until a new one
 * is sent; `absent` is a frame that draws none — the number is locked, nothing can be typed.
 */
export type CodeField = 'open' | 'read-only' | 'closed' | 'absent';

/** The field's own error: the code did not match, or Verify was pressed short. */
export type CodeError = 'wrong' | 'short';

export type PrimaryLabel =
  | 'verify'
  | 'try-again'
  | 'send-new'
  | 'send-again'
  | 'call-me'
  | 'call-again'
  | 'sign-in-by-number';

export type ResendLabel = 'send-new' | 'send-sms-again';

/** The caption at the foot of the frame: only what the person acts on (`F7-46`). */
export type FootLine = 'auth-error' | 'tries-left';

/** An Explainer beside a frame's title, for a rule the frame no longer spells out (`F7-46`). */
export type FrameExplainer = 'code-limits';

/**
 * The Google control a code frame carries (`M01-02`): the way in while SMS is locked, or another
 * Google login when this one cannot be linked. It always raises the `google` press.
 */
export type GoogleLabel = 'continue' | 'use-another';

export interface FrameControl {
  readonly press: LoginPress;
  readonly label: PrimaryLabel;
}

export type ResendSlot =
  | { readonly kind: 'live'; readonly press: LoginPress; readonly label: ResendLabel }
  /** The resend gap is running: the control's own label counts it down. */
  | { readonly kind: 'wait' };
