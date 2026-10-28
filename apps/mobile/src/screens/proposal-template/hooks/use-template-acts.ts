import type { ProposalTemplatePage } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { closeKeyboard } from '@heliogrid/ui';
import { StackActions, useNavigation } from '@react-navigation/native';

/** The page's phone acts: the save, and the ways to Branding and the Business profile. */
export function useTemplateActs(page: ProposalTemplatePage) {
  const navigation = useNavigation();
  // A push, never a navigate: a navigate to the route on screen swaps its params, and the held
  // draft would go with no ask.
  const open = (row: 'branding' | 'company_profile') =>
    navigation.dispatch(StackActions.push('SettingsRow', { segment: SETTINGS_SEGMENT[row] }));
  return {
    // The keyboard closes on the act, so the banner a failed save raises is in view.
    save: () => {
      closeKeyboard();
      page.save();
    },
    openBranding: () => open('branding'),
    openProfile: () => open('company_profile'),
  };
}
