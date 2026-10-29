import type { ProposalTemplateScreen } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { closeKeyboard } from '@heliogrid/ui';
import { StackActions, useNavigation, usePreventRemove } from '@react-navigation/native';

/**
 * The page's phone acts: the save, and the ways to Branding and the Business profile. While a
 * change is held, the bar's way back and the system Back both remove the page, so each is held and
 * handed to the screen's leave ask; the nav is hidden then, so no tab move needs holding.
 */
export function useTemplateActs({ held, leave, save }: ProposalTemplateScreen) {
  const navigation = useNavigation();
  usePreventRemove(held, ({ data }) => leave.ask(() => navigation.dispatch(data.action)));
  // A push, never a navigate: a navigate to the route on screen swaps its params, and the held
  // draft would go with no ask.
  const open = (row: 'branding' | 'company_profile') =>
    navigation.dispatch(StackActions.push('SettingsRow', { segment: SETTINGS_SEGMENT[row] }));
  return {
    // The keyboard closes on the act, so the banner a failed save raises is in view.
    save: () => {
      closeKeyboard();
      save();
    },
    openBranding: () => open('branding'),
    openProfile: () => open('company_profile'),
  };
}
