import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode, Ref } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';

/**
 * A phone number, entered and shown. Both halves take the dial code and the digit grouping from the
 * market pack (`F1-49`, `MarketProvider`) — never from a caller and never from a literal, which is
 * how one number ends up formatted two ways on two screens.
 *
 * `value` and `onChange` are always **E.164** (`contracts/common.ts` `phoneE164Schema`), the only
 * shape stored or transported. The grouping is display; the caller never sees it.
 */

/** What the field says that the caller's words do not. */
export interface PhoneFieldWords {
  /**
   * The phone's spoken name for the box: the field's name, then the whole number with its dial
   * code, so a screen reader hears one number rather than a code and some groups. The web names
   * the box by its `<label>` and needs none.
   */
  spokenNumber: (label: string, phone: string) => TranslatedText;
}

/** Size only, matching `Input` — expressive 54px, functional 40px. Never the ground. */
export type PhoneFieldDensity = 'expressive' | 'functional';

export interface PhoneFieldProps {
  /** Required — a field nobody can name is not a field. Already translated by the caller. */
  label: TranslatedText;
  /** The phone's spoken name for the box — `phoneFieldWords(t)`. */
  words: PhoneFieldWords;
  /** E.164, or empty. The dial code renders as a fixed prefix beside the digits, never inside them. */
  value?: string;
  /** Hands back E.164, so a caller stores what it is given. */
  onChange?: (e164: string) => void;
  density?: PhoneFieldDensity;
  /** Refusal text. The words carry it; the ring is the second channel (`F7-12`). */
  error?: TranslatedText;
  /** A sentence beside the field. `--text-secondary`, because a caller passing one expects it read. */
  helper?: TranslatedText;
  disabled?: boolean;
  /**
   * Holds its number while a request runs: not editable, but drawn on its normal ground, never
   * greyed — the field did nothing wrong, the screen is waiting (`SCR-M01-01` m-loading).
   */
  readOnly?: boolean;
  /** Takes focus on mount — the desktop door, where the number is the one task. The phone never raises its keyboard uninvited. */
  autoFocus?: boolean;
  /**
   * Announces the refusal instead of only describing it — for a refusal that happens under the
   * user's finger. A gate that jumps you to an already-failing field leaves this off.
   */
  announceError?: boolean;
  id?: string;
  /**
   * Takes the focus when the screen sends it here — Invite Teammate's *Use a different number*.
   * Web: the keyboard's focus. Native: the screen reader's, never the keyboard's (`focusScreenReaderOn`).
   */
  ref?: Ref<FocusHandle>;
}

export interface PhoneValueProps {
  /** The overline above the number. Required, already translated. */
  label: TranslatedText;
  /** E.164. Rendered grouped and monospaced — a number is read in groups, not as a run of digits. */
  value: string;
  /**
   * One sentence under the number: who recorded it, when, what it is for. A value handed to
   * somebody owes its origin, and this is that sentence rather than a tooltip (`F8-07`).
   */
  note?: ReactNode;
  /** A phone that is not the market's is shown with its own digits and no borrowed dial code. */
  id?: string;
}
