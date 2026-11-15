import type { ProposalTemplateScreen } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { closeKeyboard } from '@heliogrid/ui';
import { StackActions, useNavigation, usePreventRemove } from '@react-navigation/native';
import { pickImage } from '../../../files/pick-image';

/**
 * The page's phone acts: the save, the system's photo picker, the way to Branding and the way back
 * to Settings. While a change is held — the page's or the open plan's — the way back and the system
 * Back both remove the page, so each is held and handed to the leave ask that owns the change.
 */
export function useTemplateActs({ held, leave, save, plans, coverPhoto }: ProposalTemplateScreen) {
  const navigation = useNavigation();
  const planChanged = plans.page.editor?.changed ?? false;
  usePreventRemove(held || planChanged, ({ data }) => {
    const go = () => navigation.dispatch(data.action);
    if (planChanged) plans.askLeave(go);
    else leave.ask(go);
  });
  return {
    // The keyboard closes on the act, so the banner a failed save raises is in view.
    save: () => {
      closeKeyboard();
      save();
    },
    pickPhoto: () => {
      void pickImage().then((image) => {
        if (image !== null) coverPhoto.choose(image);
      });
    },
    // A push, never a navigate: a navigate to the route on screen swaps its params, and the held
    // draft would go with no ask.
    openBranding: () =>
      navigation.dispatch(StackActions.push('SettingsRow', { segment: SETTINGS_SEGMENT.branding })),
    done: () => navigation.goBack(),
  };
}
