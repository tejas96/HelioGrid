import type { CreateTenant } from '@heliogrid/contracts';
import type { ReactElement, ReactNode } from 'react';
import type { SignupStepsWords } from '../SignupSteps/SignupSteps.types';
import type { TintedBlockProps } from '../TintedBlock/TintedBlock.types';

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

/**
 * Every word step 3 draws; `@heliogrid/i18n`'s `companyStepWords` writes them. `null` where the
 * frame has no such part.
 */
export interface SignupCompanyStepWords {
  steps: SignupStepsWords;
  title: string;
  /** Follows the title on the step as it opens only. */
  intro: string | null;
  /** A create or a request that did not land, under the heading. */
  block: TintedBlockProps | null;
  /** The verified number's label and chip; `null` where a block or the steer takes its place. */
  account: SignupAccountProps['words'] | null;
  /** Under the account on a resumed step. */
  resumeLine: string | null;
  /** Under the fields: what the write means while it runs, what to do if it keeps failing. */
  caption: string | null;
  /** Create company on the plain step, the join road under the steer; `aria` names it in full. */
  primary: { label: string; aria: string | undefined };
  /** The join steer's finding and its second road; `null` on the plain step. */
  steer: { finding: { title: string; body: string }; createAnyway: string } | null;
}

/**
 * Company signup's step 3 (`SCR-M01-02`): the three fields over the verified number, and the one
 * write this screen owns (`M01-01`). When the details match a company that exists the same fields
 * stay and the steer — the finding and both roads, full-size — takes the primary's place
 * (`M01-09`, decisions 17 and 18). The primary is the frame's held action, under the scrolling
 * fields (decision 9); at 1536 every finding about the person is the identity half's (decision
 * 21). The form, the write and the steer are the screen's; this draws them and raises the presses.
 */
export interface SignupCompanyStepProps {
  /** The door's language control, the header row's trailing control. */
  language: ReactNode;
  words: SignupCompanyStepWords;
  /** The verified number, in E.164. */
  phoneE164: string;
  bind: SignupFieldBinder;
  /**
   * The three values while a create or a request is on its way — facts, not fields, for the
   * moment; `null` while the fields are open.
   */
  facts: SignupFactsProps['facts'] | null;
  /** A read or a write is on its way: the primary spins, and under the steer the second road waits, so one press cannot both ask and create. */
  busy: boolean;
  onCreate: () => void;
  onRequestToJoin: () => void;
  onCreateAnyway: () => void;
}
