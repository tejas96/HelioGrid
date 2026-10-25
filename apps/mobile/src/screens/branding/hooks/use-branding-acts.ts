import type { BrandingPage } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { StackActions, useNavigation } from '@react-navigation/native';
import { Keyboard } from 'react-native';
import { pickImage } from '../../../files/pick-image';

/** The page's three phone acts: the save, the system's photo picker and the way to the profile. */
export function useBrandingActs(page: BrandingPage) {
  const navigation = useNavigation();
  return {
    // The keyboard closes on the act, so the banner a failed save raises is in view.
    save: () => {
      Keyboard.dismiss();
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
