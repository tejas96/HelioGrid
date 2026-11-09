import type { DoorCodeStepProps } from './DoorCodeStep.types';

/**
 * What Enter in the code boxes (the done key on the phone) does: the step's primary, as its button
 * does — nothing while the step is busy or has no primary.
 */
export function submitFromBoxes({
  frame,
  busy,
  onPress,
}: Pick<DoorCodeStepProps, 'frame' | 'busy' | 'onPress'>): (() => void) | undefined {
  const { primary } = frame;
  if (primary === null || busy) return undefined;
  return () => onPress(primary.press);
}
