import type { ProposalBuilderScreen } from '@heliogrid/data/react';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';

/**
 * The builder's sheets are drawn through the app's one portal, above every screen, so a link that
 * opens another screen over the builder left the sheet open over it → each sheet closes as the
 * builder leaves view.
 */
export function useSheetsCloseOnLeave(screen: ProposalBuilderScreen): void {
  const navigation = useNavigation();
  const latest = useRef(screen);
  latest.current = screen;
  useEffect(
    () =>
      navigation.addListener('blur', () => {
        const { closeSteps, closePreview, check, parts } = latest.current;
        closeSteps();
        closePreview();
        check.close();
        parts.closeEdit();
        parts.closeAdd();
        parts.close();
      }),
    [navigation],
  );
}
