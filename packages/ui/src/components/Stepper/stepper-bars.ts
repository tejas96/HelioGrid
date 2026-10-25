import type { StepperVariant } from './Stepper.types';

/** The two variants `StepperBars` draws. */
export type BarsVariant = Extract<StepperVariant, 'bars' | 'numbered-bars'>;

export function isBarsVariant(variant: StepperVariant): variant is BarsVariant {
  return variant === 'bars' || variant === 'numbered-bars';
}
