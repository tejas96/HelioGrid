import type { PressableHaptic, PressableRole } from './Pressable.types';

/** The roles that make a choice: each taps `selection` unless its caller says otherwise. */
export const CHOICE_ROLES: ReadonlySet<PressableRole> = new Set<PressableRole>([
  'checkbox',
  'menuitemcheckbox',
  'menuitemradio',
  'radio',
  'switch',
  'tab',
]);

/** The haptic a press gives: the caller's, else `selection` for a choice and none for an act. */
export function hapticOf(
  role: PressableRole,
  haptic: PressableHaptic | undefined,
): PressableHaptic {
  return haptic ?? (CHOICE_ROLES.has(role) ? 'selection' : 'none');
}
