/**
 * The studio's steps, in the order a design is made. The site comes first: its place, name and
 * supply are set before the studio opens, and its step is how a person goes back to change them.
 */
export const STUDIO_STEPS = ['site', 'roof', 'objects', 'panels', 'wiring', 'result'] as const;
export type StudioStep = (typeof STUDIO_STEPS)[number];

/**
 * Why a step is locked: the objects need a closed roof to stand on; every later step needs the one
 * before it finished.
 */
export const STEP_LOCKS = ['needs_roof', 'needs_earlier_step'] as const;
export type StepLock = (typeof STEP_LOCKS)[number];

export interface StepPlace {
  readonly step: StudioStep;
  /** The step in hand. */
  readonly here: boolean;
  /** `null`: the step is open. */
  readonly lock: StepLock | null;
}

/**
 * The step rail: the site done and always open to change, the roof in hand, each step after it
 * locked with its reason.
 */
export function stepRail(roofClosed: boolean): readonly StepPlace[] {
  return STUDIO_STEPS.map((step) => {
    if (step === 'site') return { step, here: false, lock: null };
    if (step === 'roof') return { step, here: true, lock: null };
    if (step === 'objects') return { step, here: false, lock: roofClosed ? null : 'needs_roof' };
    return { step, here: false, lock: 'needs_earlier_step' };
  });
}
