import type { BrandingScreen } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { closeKeyboard } from '@heliogrid/ui';
import { StackActions, useNavigation, usePreventRemove } from '@react-navigation/native';
import { pickImage } from '../../../files/pick-image';

/**
 * The page's phone acts: the save, the system's photo picker and the way to the profile. While a
 * change is held, the bar's way back and the system Back both remove the page, so each is held and
 * handed to the screen's leave ask; the bottom nav is hidden then, so no tab move needs holding.
 */
export function useBrandingActs({ page, leave }: BrandingScreen) {
  const navigation = useNavigation();
  usePreventRemove(page.changed, ({ data }) => leave.ask(() => navigation.dispatch(data.action)));
  return {
    // The keyboard closes on the act, so the banner a failed save raises is in view.
    save: () => {
      closeKeyboard();
      page.save();
    },
    pickLogo: () => {
      void pickImage().then((image) => {
        if (image !== null) page.chooseLogo(image);
      });
    },
    // A push, never a navigate: a navigate to the route on screen swaps its params, and the held
    // draft would go with no ask.
    openProfile: () =>
      navigation.dispatch(
        StackActions.push('SettingsRow', { segment: SETTINGS_SEGMENT.company_profile }),
      ),
  };
}
