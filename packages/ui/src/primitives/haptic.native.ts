import { trigger } from 'react-native-haptic-feedback';
import type { PressableHaptic } from './Pressable/Pressable.types';

/* The system's own feel for each: a light impact for an act, the selection tick for a choice. */
const KIND = { impact: 'impactLight', selection: 'selection' } as const;

/**
 * The phone's light tap as a press lands (`Pressable`'s `haptic`). It follows the person's own
 * system setting — a phone with touch feedback turned off stays still — and never falls back to
 * the vibration motor, whose buzz is not a tap.
 */
export function tapHaptic(kind: PressableHaptic): void {
  if (kind === 'none') return;
  trigger(KIND[kind], { enableVibrateFallback: false, ignoreAndroidSystemSettings: false });
}
