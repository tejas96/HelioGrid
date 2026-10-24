import type { AssignRolesEditor } from '@heliogrid/data/react';
import { OPENED_FROM_ASSIGN_ROLES, SETTINGS_SEGMENT } from '@heliogrid/domain';
import { StackActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

/**
 * Assign Roles' way to the Roles reference and back (`SCR-M01-14`): the editor steps aside keeping
 * its ticks, the reference is pushed over Team — pushed, not navigated: Team is this same route,
 * and `navigate` would only change its params — and Team opens the editor again when it is back in
 * view.
 */
export function useRolesReferenceDoor(editor: AssignRolesEditor): () => void {
  const navigation = useNavigation();
  const { resume, stepAside } = editor;
  useFocusEffect(useCallback(() => resume(), [resume]));
  return () => {
    stepAside();
    navigation.dispatch(
      StackActions.push('SettingsRow', {
        segment: SETTINGS_SEGMENT.roles,
        from: OPENED_FROM_ASSIGN_ROLES,
      }),
    );
  };
}
