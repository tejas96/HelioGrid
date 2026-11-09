import type { PressableHaptic } from './Pressable/Pressable.types';

/**
 * The phone's light tap as a press lands (`Pressable`'s `haptic`). The web has no haptic engine,
 * so this half does nothing; the phone's half (`haptic.native.ts`) taps.
 */
export function tapHaptic(_kind: PressableHaptic): void {}
