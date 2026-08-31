import type { ReactNode } from 'react';

/**
 * A phone number, entered and shown. Both halves take the dial code and the digit grouping from the
 * market pack (`F1-49`, `MarketProvider`) — never from a caller and never from a literal, which is
 * how one number ends up formatted two ways on two screens.
 *
 * `value` and `onChange` are always **E.164** (`contracts/common.ts` `phoneE164Schema`), the only
 * shape stored or transported. The grouping is display; the caller never sees it.
 */

/** Size only, matching `Input` — expressive 52px, functional 40px. Never the ground (`Q77`). */
export type PhoneFieldDensity = 'expressive' | 'functional';

export interface PhoneFieldProps {
  /** Required — a field nobody can name is not a field. Already translated by the caller. */
  label: string;
  /** E.164, or empty. The dial code renders as a fixed prefix beside the digits, never inside them. */
  value?: string;
  /** Hands back E.164, so a caller stores what it is given. */
  onChange?: (e164: string) => void;
  density?: PhoneFieldDensity;
  /** Refusal text. The words carry it; the ring is the second channel (`F7-12`). */
  error?: string;
  /** A sentence beside the field. `--text-secondary`, because a caller passing one expects it read. */
  helper?: string;
  disabled?: boolean;
  /**
   * Announces the refusal instead of only describing it — for a refusal that happens under the
   * user's finger. A gate that jumps you to an already-failing field leaves this off.
   */
  announceError?: boolean;
  id?: string;
}

export interface PhoneValueProps {
  /** The overline above the number. Required, already translated. */
  label: string;
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
