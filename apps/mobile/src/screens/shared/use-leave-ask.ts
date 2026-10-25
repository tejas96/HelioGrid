import { type NavigationAction, useNavigation, usePreventRemove } from '@react-navigation/native';
import { useState } from 'react';

/**
 * The way out of a page that holds a change asks first (`SCR-M01-18` s18-w): the bar's way back
 * (it pops) and the system Back both remove the page, so both are held here until the person
 * answers. The bottom nav is hidden while a change is held, so no tab move needs holding.
 * Two settings screens share it — Branding and Proposal template (m19-n10) — so a change to how
 * one leaves changes both.
 */
export function useLeaveAsk(held: boolean) {
  const navigation = useNavigation();
  const [asked, setAsked] = useState<NavigationAction | null>(null);
  usePreventRemove(held, ({ data }) => setAsked(data.action));
  return {
    asking: asked !== null,
    stay: () => setAsked(null),
    /** Drops the change, then goes where the person was going. */
    leave: (discard: () => void) => {
      if (asked === null) return;
      discard();
      setAsked(null);
      navigation.dispatch(asked);
    },
  };
}
