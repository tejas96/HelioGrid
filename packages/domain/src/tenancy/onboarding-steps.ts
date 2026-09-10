/**
 * Progressive setup (`M01-10`, `M01-22`, `M01-29`): a sequence of skippable moments, never a
 * wizard that must complete. The steps in the order the screens run them after signup; the state
 * a step can be left in; the four facts a skip leaves for later, each with exactly one prompt-point
 * at its moment of need — §M01.3's list: the company profile at the first send, the catalog at the
 * first component pick, the payment terms at the first builder use of their step, the bank details
 * at the builder's bank step.
 *
 * Readonly tuples, so contracts derives its `z.enum`s and the store's envelopes are typed from the
 * same lists (Law 11: one vocabulary, both screens and the server).
 */
export const ONBOARDING_STEPS = [
  'language',
  'what_you_sell',
  'business_profile',
  'invite_team',
  'ready',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const STEP_STATES = ['completed', 'skipped'] as const;
export type StepState = (typeof STEP_STATES)[number];

export const PROMPT_POINT_FACTS = [
  'company_profile',
  'catalog',
  'payment_terms',
  'bank_details',
] as const;
export type PromptPointFact = (typeof PROMPT_POINT_FACTS)[number];

export const PROMPT_POINT_STATES = ['fired', 'completed', 'declined'] as const;
export type PromptPointState = (typeof PROMPT_POINT_STATES)[number];

/** What the store holds per step — nothing yet for a step never reached. */
export type StepStates = Readonly<Partial<Record<OnboardingStep, StepState>>>;
/** What the store holds per fact — nothing yet for a prompt-point that never fired. */
export type PromptPointStates = Readonly<Partial<Record<PromptPointFact, PromptPointState>>>;

/**
 * Where a returning owner resumes (`M01-10`): the first step neither completed nor skipped, in
 * sequence; `null` once every step is answered — the corridor is closed and never reopens.
 */
export function resumeStep(states: StepStates): OnboardingStep | null {
  return ONBOARDING_STEPS.find((step) => states[step] === undefined) ?? null;
}

/** A step's answer, recorded; answering again replaces it, so a skipped step may still be completed. */
export function recordStep(states: StepStates, step: OnboardingStep, state: StepState): StepStates {
  return { ...states, [step]: state };
}

export type PromptPointOutcome =
  | { readonly outcome: 'done'; readonly states: PromptPointStates }
  | { readonly outcome: 'already-fired' | 'already-answered' | 'not-fired' };

/**
 * Exactly one prompt-point per skipped fact (`M01-29`): it fires once — a second fire is refused,
 * so a closed sheet never nags — and is then answered once, completed or declined. Declining
 * leaves the working default in place; nothing here touches the setting itself.
 */
export function promptPointTransition(
  states: PromptPointStates,
  fact: PromptPointFact,
  next: PromptPointState,
): PromptPointOutcome {
  const current = states[fact];
  if (next === 'fired') {
    if (current === undefined) return { outcome: 'done', states: { ...states, [fact]: next } };
    return { outcome: current === 'fired' ? 'already-fired' : 'already-answered' };
  }
  if (current === undefined) return { outcome: 'not-fired' };
  if (current !== 'fired') return { outcome: 'already-answered' };
  return { outcome: 'done', states: { ...states, [fact]: next } };
}

/**
 * The facts whose prompt-point is still owed: absent, and never fired. A fact that fired and was
 * declined stays absent and is never asked again; a fact the owner filled in is no longer absent.
 */
export function pendingPromptPoints(
  states: PromptPointStates,
  absent: readonly PromptPointFact[],
): readonly PromptPointFact[] {
  return PROMPT_POINT_FACTS.filter((fact) => absent.includes(fact) && states[fact] === undefined);
}
