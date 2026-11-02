import { theme } from '@heliogrid/theme';
import { useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { landFocusOn } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { BannerAction } from '../Banner/BannerAction.native';
import { BannerStack } from '../Banner/BannerStack.native';
import { BillingStrip } from '../BillingHome/BillingNeeds.native';
import { PlanComparison } from './PlanComparison.native';
import { PlanHeld } from './PlanHeld.native';
import { PlanPlans } from './PlanPlans.native';
import type { PlanSelectionProps } from './PlanSelection.types';

/**
 * The plans on the phone (`SCR-M12-03`, the 375 frames): the strip, `Your plan`, the cycle, the
 * cards with the act at their foot, Enterprise, the source line and `Compare all plans`. The
 * phone has one column whatever `layout` says; the bar and the review sheet are the screen's.
 */
export function PlanSelection(props: PlanSelectionProps) {
  const { words, view, acts } = props;
  const heldFrame = useRef<View>(null);
  useImperativeHandle(props.ref, () => ({ focusHeld: () => landFocusOn(heldFrame) }), []);
  return (
    <View style={styles.page}>
      {view.strip === null ? null : (
        <BillingStrip strip={view.strip} moreLabel={words.bannerMore} />
      )}
      {view.failure === null ? null : (
        <BannerStack mode="single" moreLabel={words.bannerMore}>
          <Banner
            kind="state"
            tone="danger"
            title={view.failure.title}
            action={
              <BannerAction onClick={acts.onRetryFailure} focusAfter={heldFrame}>
                {words.tryAgain}
              </BannerAction>
            }
          >
            <Text variant="body-sm">{view.failure.line}</Text>
          </Banner>
        </BannerStack>
      )}
      <View ref={heldFrame}>
        <PlanHeld
          read={props.heldRead}
          held={view.held}
          words={words}
          onRetried={() => landFocusOn(props.focusAfter)}
        />
      </View>
      <PlanPlans {...props} />
      <PlanComparison {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-5'] },
});
