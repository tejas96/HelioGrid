import type { CreateTenant } from '@heliogrid/contracts';
import type { ReactElement } from 'react';

/**
 * The verified number as a fact, not a field (`SCR-M01-02` decision 1): after verification it is
 * the account, so there is nothing to edit and no Change control — the system's value and the
 * system's chip for its standing. At 1536 it is the identity half's (decision 11).
 */
export interface SignupAccountProps {
  words: { label: string; verified: string };
  /** The verified number, in E.164. */
  phoneE164: string;
}

/**
 * The three values while they are being written (`SCR-M01-02`, the loading state): facts rather
 * than fields for the moment, never greyed-out inputs — disabled grey is the one colour that may
 * not carry a word a person is checking.
 */
export interface SignupFactsProps {
  /** One row per company detail, in the fields' order; `@heliogrid/i18n`'s `companyFacts` writes them. */
  facts: readonly { label: string; value: string }[];
}

/**
 * One company field as its binding hands it over: what it holds, how it changes, and every word
 * it shows — `@heliogrid/i18n`'s `companyFieldWords` writes the four.
 */
export interface SignupFieldState {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  /** The step's line under the field; absent where the frame carries none. */
  helper: string | undefined;
  /** The field's own answer when Create company is pressed; absent until it refuses. */
  error: string | undefined;
}

/**
 * Binds one company field to the screen's form and returns what `draw` makes of it. The binding
 * must subscribe to that field alone: a controlled native input whose value lags the keyboard
 * drops characters, so a keystroke re-renders one input, never the step. The name is the
 * contract's: a name outside it cannot be bound.
 */
export type SignupFieldBinder = (
  name: keyof CreateTenant,
  draw: (field: SignupFieldState) => ReactElement,
) => ReactElement;

/**
 * The three fields and no fourth (`M01-01`): the company name across the measure, your name and
 * the city sharing the row beneath it from the door's breakpoint (`SCR-M01-02` decision 12). Each
 * answers for itself when Create company is pressed, all messages at once (the fields-invalid
 * state); the primary is never gated on them.
 */
export interface SignupFieldsProps {
  bind: SignupFieldBinder;
  /**
   * The fields sit under the verified account, which takes the wider gap; a title or a block takes
   * the board's sp-5. The phone half reads it; on the web the frame's column sets that gap.
   */
  underAccount?: boolean;
}
