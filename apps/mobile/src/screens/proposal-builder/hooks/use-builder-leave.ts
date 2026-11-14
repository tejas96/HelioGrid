import type { ProposalBuilderScreen } from '@heliogrid/data/react';
import { useNavigation, usePreventRemove } from '@react-navigation/native';

/**
 * The builder's way out on the phone while a value is not stored (`T-M06-023`): Close, the bar's
 * way back and the system Back all remove the screen, so each is held and handed to the screen's
 * leave ask, which makes it only once the person chose to leave — the web's leave guard's twin.
 */
export function useBuilderLeave(leave: ProposalBuilderScreen['leave']): void {
  const navigation = useNavigation();
  usePreventRemove(leave.held, ({ data }) => leave.ask(() => navigation.dispatch(data.action)));
}
