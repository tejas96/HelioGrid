import { theme } from '@heliogrid/theme';
import { useEffect, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, Dimensions, StyleSheet, View } from 'react-native';
import { Portal } from '../../primitives/Portal/Portal.native';
import { Text } from '../../primitives/Text/Text.native';
import type { CoachMarkProps } from './CoachMark.types';
import { MAX_STEPS } from './CoachMark.types';
import {
  CoachMarkArrow,
  CoachMarkFoot,
  CoachMarkHead,
  CoachMarkRing,
} from './CoachMarkParts.native';
import { COACH_MARK_FALLBACK_HEIGHT, coachMarkCounter, placeCoachMark } from './coach-mark-place';
import { useAnchorRect } from './use-anchor-rect.native';
import { useCoachMarks } from './use-coach-marks.native';

interface NativeCoachMarkProps extends CoachMarkProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * One persistent mark anchored to a live control. The screen underneath stays fully usable — no
 * backdrop, no scrim, no focus trap (M01-16, MS1-08).
 *
 * Touch mapping: the web half dismisses on Escape and moves DOM focus to the card. RN has neither,
 * so dismissal is the Dismiss control (44px, always present when `onDismiss` is given) and
 * `autoFocus` announces the mark to the screen reader instead — the same purpose, which is that
 * assistive tech finds the mark when it opens. `within` is web-only: a native mark is placed
 * against the window (see use-anchor-rect.native).
 */
export function CoachMark({
  anchor,
  title,
  body,
  step,
  total,
  open = true,
  placement = 'auto',
  padding = 6,
  width = 292,
  nextLabel,
  dismissLabel = 'Dismiss',
  onNext,
  onDismiss,
  onAnchorMissing,
  autoFocus = true,
  ring = true,
  style,
}: NativeCoachMarkProps) {
  const rect = useAnchorRect(anchor, open, onAnchorMissing);
  const [cardHeight, setCardHeight] = useState(0);
  const { steps, counter, isLast } = coachMarkCounter(total, step, MAX_STEPS);

  useEffect(() => {
    if (open && autoFocus) {
      AccessibilityInfo.announceForAccessibility(counter === null ? title : `${title}. ${counter}`);
    }
  }, [open, autoFocus, title, counter]);

  if (!open) {
    return null;
  }
  /* Anchored but unresolvable: draw nothing rather than point at nothing. */
  if (anchor !== undefined && rect === null) {
    return null;
  }

  const screen = Dimensions.get('window');
  const placed =
    rect === null
      ? null
      : placeCoachMark(rect, width, cardHeight || COACH_MARK_FALLBACK_HEIGHT, placement, {
          width: screen.width,
          height: screen.height,
        });
  const onLayout = (event: LayoutChangeEvent) => setCardHeight(event.nativeEvent.layout.height);

  return (
    <Portal>
      {ring && rect !== null ? <CoachMarkRing rect={rect} padding={padding} /> : null}
      {/* `role="group"`, which is exactly what the web half carries — and deliberately NOT a
          dialog: this is guidance over a live screen, it traps nothing and the screen underneath
          stays usable (M01-16, MS1-08). A role, never `accessible`: Dismiss and Next are 44dp
          controls inside this card and folding would put both out of reach. */}
      <View
        role="group"
        accessibilityLabel={counter === null ? title : `${title}. ${counter}`}
        onLayout={onLayout}
        style={[
          styles.card,
          { width },
          placed === null ? styles.parked : { top: placed.top, left: placed.left },
          style,
        ]}
      >
        {placed === null ? null : <CoachMarkArrow placed={placed} />}
        <CoachMarkHead
          counter={counter}
          title={title}
          dismissLabel={dismissLabel}
          onDismiss={onDismiss}
        />
        {body === undefined ? null : (
          <Text variant="body-sm" color="secondary" style={styles.body}>
            {body}
          </Text>
        )}
        <CoachMarkFoot
          steps={steps}
          step={step}
          isLast={isLast}
          nextLabel={nextLabel}
          onNext={onNext}
          onDismiss={onDismiss}
        />
      </View>
    </Portal>
  );
}

CoachMark.useCoachMarks = useCoachMarks;

export { useCoachMarks };

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-lg'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e4,
  },
  /* An unanchored mark is a legitimate variant: it parks at the bottom rather than inventing a
     target. */
  parked: {
    bottom: theme.spacing['sp-6'],
    alignSelf: 'center',
  },
  body: {
    marginTop: 6,
  },
});
