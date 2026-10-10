/** The flow's name and its three steps, in order; `@heliogrid/i18n`'s `signupStepsWords` writes them. */
export interface SignupStepsWords {
  label: string;
  steps: readonly [string, string, string];
}

/**
 * Company signup's step header (`SCR-M01-02` decisions 4 and 13): three steps, gated, because the
 * company details read the verified account and cannot be jumped to before it exists; going back
 * stays open. Under the door's breakpoint, and on the phone, the track and its counter, where
 * 335px holds no step names; from the breakpoint the numbered form with the steps spelled out.
 * The length is also spoken in the number step's body copy, never only here.
 */
export interface SignupStepsProps {
  words: SignupStepsWords;
  /** Zero-based: the number, the code, the company. */
  current: 0 | 1 | 2;
}
